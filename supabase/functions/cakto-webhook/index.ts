// Edge Function: cakto-webhook
// Recebe os eventos de venda da Cakto, confere o segredo e libera ou revoga o acesso.
// Substitui a Kiwify como checkout (17/11/2026). O kiwify-webhook continua publicado só para
// reembolsos de vendas antigas.
//
// Formato (docs da Cakto, "Webhooks"): POST com { secret, event, data }.
//   - secret: a chave definida no cadastro do webhook na Cakto (vai no corpo; não há HMAC).
//   - event: purchase_approved | refund | chargeback | purchase_refused | pix_gerado | ...
//   - data.id (UUID do pedido), data.customer.{name,email}, data.product.{id,short_id,name},
//     data.offer.{id,name,price}, data.offer_type ('main' no produto principal), data.parent_order,
//     data.status (paid | refunded | chargeback | ...).
// A Cakto considera qualquer resposta como entregue e NÃO reenvia em caso de erro — por isso
// tudo fica em webhook_logs (com o payload, sem o secret) para conferir e corrigir à mão.
//
// Order bumps: a Cakto não documenta o formato. Tratamos os dois jeitos possíveis:
//   1. bump como pedido próprio (CONFIRMADO numa compra real em 17/11/2026, webhook "Individual"):
//      data.offer_type = 'orderbump' e data.parent_order = refId (curto) do pedido principal →
//      grava com parent_order_id, e o reembolso do principal revoga o bump junto;
//   2. bump dentro do mesmo pedido, numa lista (orderbumps, order_bumps, bumps, products...).
//
// Segredos (Edge Functions → Secrets):
//   CAKTO_WEBHOOK_SECRET      a chave secreta do webhook na Cakto (obrigatório)
//   CAKTO_WEBHOOK_SECRET_OLD  chave antiga, só durante uma troca (opcional)
//   CAKTO_PRODUCT_MAP         "id_do_produto:product_key,..." — aceita o id longo (UUID) ou o
//                             short_id do produto; product_key é 'manual' | 'mensagens' |
//                             'tabela-precos' (obrigatório; sem isso, a função não libera nada)
//   RESEND_API_KEY            chave de API do Resend, para o e-mail de boas-vindas

const APP_URL = 'https://manualdalash.com.br/'

export interface PurchaseRow {
  email: string
  /** Código do pedido. A coluna se chama kiwify_order_id por histórico; vale para qualquer plataforma. */
  kiwify_order_id: string
  product_key: string
  status: 'active' | 'revoked'
  product: string | null
  buyer_name: string | null
  provider: 'cakto'
  parent_order_id: string | null
}

export interface LogRow {
  source: 'cakto'
  event_type: string | null
  order_id: string | null
  email: string | null
  signature_valid: boolean
  result: 'processed' | 'ignored' | 'rejected' | 'error'
  message: string
  payload: unknown
  raw_body: string | null
}

export interface Deps {
  secrets: string[]
  /** id (UUID ou short_id) do produto na Cakto → product_key interno */
  productMap: Record<string, string>
  findPurchase: (orderId: string, productKey: string) => Promise<{ status: string } | null>
  upsertPurchase: (row: PurchaseRow) => Promise<void>
  /**
   * Revoga as linhas do pedido e as dos bumps ligados a ele. O bump guarda em parent_order_id a
   * referência CURTA do pedido principal (data.refId, ex.: 81fLii7 — confirmado numa compra real),
   * então a busca usa o id longo e o refId. Devolve quantas linhas mudaram.
   */
  revokeOrder: (orderId: string, refId: string | null) => Promise<number>
  /** Cria a conta se precisar e manda o e-mail de boas-vindas (link fixo do app). */
  sendWelcomeEmail: (email: string, buyerName: string | null) => Promise<void>
  log: (row: LogRow) => Promise<void>
}

const APPROVED = new Set(['purchase_approved'])
const REVOKE = new Set(['refund', 'chargeback'])
const REVOKE_STATUS = new Set(['refunded', 'chargeback'])

/** Comparação em tempo constante. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// deno-lint-ignore no-explicit-any
type Json = any

function pick(p: Json, ...paths: string[][]): string | null {
  for (const path of paths) {
    let v: Json = p
    for (const k of path) v = v?.[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
    if (typeof v === 'number') return String(v)
  }
  return null
}

/** Parse de "id:key,id:key,..." → { id: key }. */
export function parseProductMap(raw: string): Record<string, string> {
  const map: Record<string, string> = {}
  for (const part of raw.split(',')) {
    const [id, key] = part.split(':').map((s) => s.trim())
    if (id && key) map[id] = key
  }
  return map
}

interface FoundProduct {
  ids: string[]
  name: string | null
}

/** Produtos do pedido: o de `data.product` e, se houver, bumps listados dentro do mesmo pedido. */
export function extractProducts(data: Json): FoundProduct[] {
  const list: FoundProduct[] = []
  const add = (item: Json) => {
    const product = item?.product ?? item
    const ids = [pick(product, ['id']), pick(product, ['short_id']), pick(item, ['product_id'])].filter(
      (x): x is string => !!x,
    )
    if (!ids.length || list.some((p) => p.ids.some((id) => ids.includes(id)))) return
    list.push({ ids, name: pick(product, ['name']) ?? pick(item, ['product_name']) })
  }
  if (data?.product) add(data.product)
  const bumpKeys = ['orderbumps', 'orderBumps', 'order_bumps', 'bumps', 'products', 'items']
  for (const key of bumpKeys) {
    const arr = data?.[key]
    if (Array.isArray(arr)) arr.forEach(add)
  }
  return list
}

const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== 'POST') return respond(405, { ok: false })

  const raw = await req.text()
  let payload: Json = null
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = null
  }

  const secret = typeof payload?.secret === 'string' ? payload.secret : ''
  // O segredo nunca vai para o log.
  const safePayload = payload && typeof payload === 'object' ? { ...payload, secret: undefined } : null

  const data = payload?.data ?? null
  const eventType = pick(payload, ['event'])
  const orderStatus = pick(data, ['status'])
  const orderId = pick(data, ['id'])
  const refId = pick(data, ['refId'])
  const emailRaw = pick(data, ['customer', 'email'])
  const email = emailRaw ? emailRaw.toLowerCase() : null
  const buyerName = pick(data, ['customer', 'name'])
  const offerType = pick(data, ['offer_type'])
  const parentOrder = pick(data, ['parent_order'])
  const parentOrderId = parentOrder && parentOrder !== orderId && offerType !== 'main' ? parentOrder : null

  const base = {
    source: 'cakto' as const,
    event_type: eventType,
    order_id: orderId,
    email,
    payload: safePayload,
    raw_body: payload ? null : raw.slice(0, 5000),
  }

  // 1. Segredo
  if (!deps.secrets.length) {
    await deps.log({ ...base, signature_valid: false, result: 'error', message: 'CAKTO_WEBHOOK_SECRET não configurado' })
    return respond(500, { ok: false, reason: 'not_configured' })
  }
  const valid = !!secret && deps.secrets.some((s) => safeEqual(s, secret))
  if (!valid) {
    await deps.log({ ...base, signature_valid: false, result: 'rejected', message: 'secret inválido' })
    return respond(401, { ok: false, reason: 'invalid_secret' })
  }

  // A Cakto não reenvia: responder 200 sempre (o resultado fica no log).
  const done = async (result: LogRow['result'], message: string) => {
    await deps.log({ ...base, signature_valid: true, result, message })
    return respond(200, { ok: result !== 'error', result, message })
  }

  // 2. O mapa de produtos precisa existir: nunca liberar acesso por padrão
  if (!Object.keys(deps.productMap).length) return done('error', 'CAKTO_PRODUCT_MAP não configurado')

  if (!payload || !data) return done('ignored', 'corpo sem data')

  const isApproved = APPROVED.has(eventType ?? '')
  const isRevoke = REVOKE.has(eventType ?? '') || (!eventType && REVOKE_STATUS.has(orderStatus ?? ''))
  if (!isApproved && !isRevoke) return done('ignored', `evento ${eventType ?? orderStatus} não altera acesso`)

  if (!orderId) return done('error', 'payload sem data.id (pedido)')

  try {
    if (isRevoke) {
      // Revoga o pedido e os bumps ligados a ele — vale também se o produto não estiver no mapa.
      const count = await deps.revokeOrder(orderId, refId)
      return done('processed', `acesso revogado (${eventType ?? orderStatus}), pedido ${orderId} (${count} produto[s])`)
    }

    if (!email) return done('error', 'payload sem e-mail da compradora')

    const found = extractProducts(data)
    const matched = found
      .map((p) => ({ ...p, productKey: p.ids.map((id) => deps.productMap[id]).find(Boolean) }))
      .filter((p): p is FoundProduct & { productKey: string } => !!p.productKey)

    if (!matched.length) {
      const ids = found.map((p) => p.ids.join('/')).join(', ') || 'nenhum'
      return done('ignored', `produto(s) fora do CAKTO_PRODUCT_MAP (id: ${ids})`)
    }

    const parts: string[] = []
    let newManualAccess = false
    for (const m of matched) {
      const existing = await deps.findPurchase(orderId, m.productKey)
      // Reenvio atrasado de "aprovada" depois de um reembolso não devolve o acesso
      if (existing?.status === 'revoked') {
        parts.push(`${m.productKey}: ignorado (já reembolsado/estornado)`)
        continue
      }
      await deps.upsertPurchase({
        email,
        kiwify_order_id: orderId,
        product_key: m.productKey,
        status: 'active',
        product: m.name,
        buyer_name: buyerName,
        provider: 'cakto',
        parent_order_id: parentOrderId,
      })
      parts.push(`${m.productKey}: liberado`)
      if (!existing && m.productKey === 'manual') newManualAccess = true
    }
    if (newManualAccess) {
      try {
        await deps.sendWelcomeEmail(email, buyerName)
        parts.push('e-mail de boas-vindas enviado')
      } catch (e) {
        parts.push(`e-mail de boas-vindas falhou: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    const bumpInfo = parentOrderId ? ` [bump do pedido ${parentOrderId}]` : ''
    return done('processed', `${email} (pedido ${orderId}${bumpInfo}): ${parts.join('; ')}`)
  } catch (e) {
    return done('error', `erro no banco: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ───────────── Execução no Supabase (Deno) ─────────────
// deno-lint-ignore no-explicit-any
const D = (globalThis as any).Deno
if (D) {
  const { createClient } = await import('npm:@supabase/supabase-js@2')
  const env = (k: string) => D.env.get(k) ?? ''
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const deps: Deps = {
    secrets: [env('CAKTO_WEBHOOK_SECRET'), env('CAKTO_WEBHOOK_SECRET_OLD')].filter(Boolean),
    productMap: parseProductMap(env('CAKTO_PRODUCT_MAP')),
    findPurchase: async (orderId, productKey) => {
      const { data, error } = await db
        .from('purchases')
        .select('status')
        .eq('kiwify_order_id', orderId)
        .eq('product_key', productKey)
        .maybeSingle()
      if (error) throw error
      return data
    },
    upsertPurchase: async (row) => {
      const { error } = await db
        .from('purchases')
        .upsert({ ...row, updated_at: new Date().toISOString() }, { onConflict: 'kiwify_order_id,product_key' })
      if (error) throw error
    },
    revokeOrder: async (orderId, refId) => {
      // Só letras, números e hífen entram no filtro (ids da Cakto); o resto é descartado.
      const ids = [orderId, refId].filter((x): x is string => !!x && /^[A-Za-z0-9-]+$/.test(x))
      if (!ids.length) throw new Error(`id de pedido inesperado: ${orderId}`)
      const filters = [`kiwify_order_id.eq.${ids[0]}`, ...ids.map((id) => `parent_order_id.eq.${id}`)]
      const { data, error } = await db
        .from('purchases')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .or(filters.join(','))
        .select('product_key')
      if (error) throw error
      return data?.length ?? 0
    },
    sendWelcomeEmail: async (email: string, buyerName: string | null) => {
      // Cria a conta se ainda não existir (igual ao request-login, sem mandar nenhum e-mail
      // de login — isso só acontece quando ela mesma pedir, em /entrar).
      const { error: cErr } = await db.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: buyerName ? { full_name: buyerName } : undefined,
      })
      if (cErr && cErr.code !== 'email_exists' && !/already/i.test(cErr.message)) throw cErr

      const apiKey = env('RESEND_API_KEY')
      if (!apiKey) throw new Error('RESEND_API_KEY não configurado')
      const html = `<div style="background:#FBE8EE;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#2A1E27">
  <div style="max-width:440px;margin:0 auto;background:#ffffff;border-radius:24px;padding:28px 24px;text-align:center">
    <div style="font-size:20px;font-weight:900;margin-bottom:18px;color:#5B2A4E">Manual da Lash Designer</div>
    <div style="font-size:24px;font-weight:900;line-height:1.2;margin-bottom:10px">Sua compra foi aprovada 🎉</div>
    <div style="font-size:16px;line-height:1.5;color:#5E5468;margin-bottom:24px">
      A partir de agora você tem acesso completo ao manual, direto do seu celular. Toque no
      botão abaixo e guarde este link — é por ele que você sempre vai entrar.
    </div>
    <a href="${APP_URL}" style="display:inline-block;background:#E07A9B;color:#ffffff;text-decoration:none;font-weight:800;font-size:17px;padding:16px 32px;border-radius:999px">Abrir o Manual</a>
    <div style="font-size:14px;line-height:1.6;color:#5E5468;margin:28px 0 0">
      Sempre que quiser entrar, abra esse link e digite o e-mail da sua compra
      (<b>${email}</b>) — a gente manda um código na hora, sem senha para decorar.
    </div>
    <div style="font-size:12px;color:#8A7F92;margin-top:24px">Dúvidas? Responda este e-mail.</div>
  </div>
</div>`
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Manual da Lash Designer <acesso@manualdalash.com.br>',
          to: [email],
          subject: 'Sua compra foi aprovada 🎉',
          html,
        }),
      })
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
    },
    log: async (row) => {
      const { error } = await db.from('webhook_logs').insert(row)
      if (error) console.error('webhook_logs', error)
    },
  }
  D.serve((req: Request) => handle(req, deps))
}
