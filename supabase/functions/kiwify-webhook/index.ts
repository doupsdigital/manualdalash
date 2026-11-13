// Edge Function: kiwify-webhook
// Recebe os eventos de venda da Kiwify, confere a assinatura e libera ou revoga o acesso.
// O webhook está cadastrado em "Todos que sou produtor": qualquer produto fora do
// KIWIFY_PRODUCT_MAP é ignorado (não grava nada em purchases).
// Os order bumps (mensagens, tabela de preços) podem chegar como produtos dentro do
// mesmo pedido do manual, ou como eventos separados — os dois casos são tratados aqui.
//
// Assinatura (docs.kiwify.com.br/api-reference/webhooks/receiving):
//   a Kiwify adiciona ?signature=<hex> na URL; o valor é HMAC-SHA1 do corpo cru,
//   usando como chave o token cadastrado no webhook.
//
// Segredos (Edge Functions → Secrets):
//   KIWIFY_WEBHOOK_TOKEN      token do webhook na Kiwify (obrigatório)
//   KIWIFY_WEBHOOK_TOKEN_OLD  token antigo, só durante uma troca de token (opcional)
//   KIWIFY_PRODUCT_MAP        "id_do_produto:product_key,id_do_produto:product_key,..."
//                             product_key é 'manual' | 'mensagens' | 'tabela-precos' (obrigatório;
//                             sem isso, a função recusa tudo)
//   RESEND_API_KEY            chave de API do Resend, para mandar o e-mail de boas-vindas
//                              (a mesma usada no SMTP do Supabase)
//
// Na primeira vez que o manual é liberado para um e-mail, a função cria a conta (sem mandar
// nenhum e-mail de login — isso só acontece quando ela mesma pedir, em /entrar) e manda um
// e-mail de boas-vindas à parte, pelo Resend, com o link fixo do app e a explicação de como
// entrar (supabase/templates/boas-vindas.html).

const APP_URL = 'https://manualdalash.com.br/'

export interface PurchaseRow {
  email: string
  kiwify_order_id: string
  product_key: string
  status: 'active' | 'revoked'
  product: string | null
  buyer_name: string | null
}

export interface LogRow {
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
  tokens: string[]
  /** id do produto na Kiwify → product_key interno */
  productMap: Record<string, string>
  findPurchase: (orderId: string, productKey: string) => Promise<{ status: string } | null>
  upsertPurchase: (row: PurchaseRow) => Promise<void>
  /** Revoga todas as linhas de purchases com esse kiwify_order_id. Devolve quantas mudaram. */
  revokeOrder: (orderId: string) => Promise<number>
  /** Cria a conta se precisar e manda o e-mail de boas-vindas (link fixo do app). */
  sendWelcomeEmail: (email: string, buyerName: string | null) => Promise<void>
  log: (row: LogRow) => Promise<void>
}

const APPROVED = new Set(['order_approved'])
const REVOKE = new Set(['order_refunded', 'chargeback'])
const REVOKE_STATUS = new Set(['refunded', 'chargedback'])

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')

export async function hmacSha1Hex(key: string, message: string) {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  return toHex(await crypto.subtle.sign('HMAC', k, enc.encode(message)))
}

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

/**
 * Lista os produtos presentes no payload: o produto principal (`Product`) e, se houver,
 * os order bumps (mensagens, tabela de preços) — no mesmo pedido ou em chaves de bump.
 */
export function extractProducts(payload: Json): { productId: string; productName: string | null }[] {
  const list: { productId: string; productName: string | null }[] = []
  const add = (productId: string | null, productName: string | null) => {
    if (productId && !list.some((p) => p.productId === productId)) list.push({ productId, productName })
  }
  add(
    pick(payload, ['Product', 'product_id'], ['product', 'id'], ['Product', 'id']),
    pick(payload, ['Product', 'product_name'], ['product', 'name'], ['Product', 'name']),
  )
  const bumpKeys = ['Bumps', 'bumps', 'OrderBumps', 'order_bumps', 'order_bump', 'Products', 'products']
  for (const key of bumpKeys) {
    const arr = payload?.[key]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      add(
        pick(item, ['Product', 'product_id'], ['product_id'], ['id']),
        pick(item, ['Product', 'product_name'], ['product_name'], ['name']),
      )
    }
  }
  return list
}

function extractBuyerName(payload: Json): string | null {
  return pick(
    payload,
    ['Customer', 'full_name'],
    ['customer', 'full_name'],
    ['Customer', 'name'],
    ['customer', 'name'],
  )
}

const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export async function handle(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== 'POST') return respond(405, { ok: false })

  const raw = await req.text() // corpo cru, antes de qualquer parse
  const signature = (new URL(req.url).searchParams.get('signature') ?? '').toLowerCase()

  let payload: Json = null
  try {
    payload = JSON.parse(raw)
  } catch {
    payload = null
  }

  const eventType = pick(payload, ['webhook_event_type'])
  const orderStatus = pick(payload, ['order_status'])
  const orderId = pick(payload, ['order_id'], ['id'])
  const emailRaw = pick(payload, ['Customer', 'email'], ['customer', 'email'], ['Customer', 'Email'])
  const email = emailRaw ? emailRaw.toLowerCase() : null
  const buyerName = extractBuyerName(payload)

  const base = { event_type: eventType, order_id: orderId, email, payload, raw_body: payload ? null : raw.slice(0, 5000) }

  // 1. Assinatura
  if (!deps.tokens.length) {
    await deps.log({ ...base, signature_valid: false, result: 'error', message: 'KIWIFY_WEBHOOK_TOKEN não configurado' })
    return respond(500, { ok: false, reason: 'not_configured' })
  }
  let valid = false
  for (const t of deps.tokens) {
    if (signature && safeEqual(await hmacSha1Hex(t, raw), signature)) valid = true
  }
  if (!valid) {
    await deps.log({ ...base, signature_valid: false, result: 'rejected', message: 'assinatura inválida' })
    return respond(401, { ok: false, reason: 'invalid_signature' })
  }

  const done = async (result: LogRow['result'], message: string, status = 200) => {
    await deps.log({ ...base, signature_valid: true, result, message })
    return respond(status, { ok: result !== 'error', result, message })
  }

  // 2. O mapa de produtos precisa existir: nunca liberar acesso por padrão
  if (!Object.keys(deps.productMap).length) {
    return done('error', 'KIWIFY_PRODUCT_MAP não configurado', 500)
  }

  if (!payload) return done('ignored', 'corpo não é JSON')
  if (!eventType && !orderStatus) return done('ignored', 'sem webhook_event_type (ex.: carrinho abandonado)')

  const isApproved = APPROVED.has(eventType ?? '')
  const isRevoke = REVOKE.has(eventType ?? '') || (!eventType && REVOKE_STATUS.has(orderStatus ?? ''))
  if (!isApproved && !isRevoke) return done('ignored', `evento ${eventType ?? orderStatus} não altera acesso`)

  if (!orderId) return done('error', 'payload sem order_id', 400)
  if (!email) return done('error', 'payload sem e-mail da compradora', 400)

  const found = extractProducts(payload)
  const matched = found.map((p) => ({ ...p, productKey: deps.productMap[p.productId] })).filter((p) => p.productKey)

  if (!matched.length) {
    const ids = found.map((p) => p.productId).join(', ') || 'nenhum'
    return done('ignored', `produto(s) fora do KIWIFY_PRODUCT_MAP (id: ${ids})`)
  }

  try {
    if (isApproved) {
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
          product: m.productName,
          buyer_name: buyerName,
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
      return done('processed', `${email} (pedido ${orderId}): ${parts.join('; ')}`)
    }
    // Reembolso/chargeback: a Kiwify revoga o pedido inteiro, então revoga todos os
    // product_key daquele kiwify_order_id, não só o produto citado no payload.
    const count = await deps.revokeOrder(orderId)
    return done('processed', `acesso revogado (${eventType ?? orderStatus}) para ${email}, pedido ${orderId} (${count} produto[s])`)
  } catch (e) {
    // 500 faz a Kiwify tentar de novo mais tarde
    return done('error', `erro no banco: ${e instanceof Error ? e.message : String(e)}`, 500)
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
    tokens: [env('KIWIFY_WEBHOOK_TOKEN'), env('KIWIFY_WEBHOOK_TOKEN_OLD')].filter(Boolean),
    productMap: parseProductMap(env('KIWIFY_PRODUCT_MAP')),
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
    revokeOrder: async (orderId) => {
      const { data, error } = await db
        .from('purchases')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('kiwify_order_id', orderId)
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
