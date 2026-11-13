// Cria a primeira campanha do Manual da Lash Designer no Meta Ads (Marketing API / Graph API), a
// partir de marketing/campanha-manual/campanha.json. Baseado no script do LashBox, que já rodou de
// verdade em 10/11/2026 (mesmos ajustes de API descobertos lá).
//
// Token: META_ACCESS_TOKEN (variável de ambiente ou .env na raiz). NUNCA é impresso nem gravado.
//
// REGRA DE OURO: este script só CRIA coisas novas (tudo PAUSED) e só LÊ a conta, a página, o pixel
// e a busca de interesses. Ele nunca lê, altera, pausa ou ativa nenhuma outra campanha da conta
// (LashBox, Agenda Lotada, StudioMenu…).
//
// Uso:
//   node scripts/meta/criar-campanha-manual.mjs --simular   → não cria nada; mostra o plano completo
//   node scripts/meta/criar-campanha-manual.mjs              → cria de verdade (tudo como PAUSED)
//
// Seguro para rodar de novo: marketing/campanha-manual/resultado.json guarda os IDs já criados e cada
// passo pula o que já existe, então um erro no meio não duplica nada.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const CAMPAIGN_DIR = path.join(ROOT, 'marketing/campanha-manual')
const CONFIG_PATH = path.join(CAMPAIGN_DIR, 'campanha.json')
const RESULT_PATH = path.join(CAMPAIGN_DIR, 'resultado.json')

// Confira em developers.facebook.com/docs/graph-api/guides/versioning se já existe uma versão mais
// nova. Dá para trocar com META_GRAPH_API_VERSION=vXX.0 no ambiente, sem editar o código.
const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v26.0'
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`
const SIMULATE = process.argv.includes('--simular')
const SITE_HOST = 'manualdalash.com.br'

function loadToken() {
  if (process.env.META_ACCESS_TOKEN) return process.env.META_ACCESS_TOKEN
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath)) return null
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    if (line.slice(0, eq).trim() !== 'META_ACCESS_TOKEN') continue
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
    return value || null
  }
  return null
}
const TOKEN = loadToken()

async function graphGet(edgePath, params = {}) {
  const url = new URL(`${GRAPH_BASE}/${edgePath}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, typeof v === 'string' ? v : JSON.stringify(v))
  url.searchParams.set('access_token', TOKEN)
  const res = await fetch(url)
  const json = await res.json()
  if (json.error) throw new Error(`GET ${edgePath}: ${json.error.message} (código ${json.error.code})`)
  return json
}

async function graphPost(edgePath, body = {}) {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(body)) params.set(k, typeof v === 'string' ? v : JSON.stringify(v))
  params.set('access_token', TOKEN)
  const res = await fetch(`${GRAPH_BASE}/${edgePath}`, { method: 'POST', body: params })
  const json = await res.json()
  if (json.error) {
    const e = json.error
    const detail = [e.error_user_title, e.error_user_msg].filter(Boolean).join(' — ')
    throw new Error(`POST ${edgePath}: ${e.message} (código ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''})${detail ? ` · ${detail}` : ''}`)
  }
  return json
}

const loadConfig = () => JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
const loadResult = () => (fs.existsSync(RESULT_PATH) ? JSON.parse(fs.readFileSync(RESULT_PATH, 'utf8')) : {})
const saveResult = (r) => fs.writeFileSync(RESULT_PATH, JSON.stringify(r, null, 2) + '\n')
const pixelIsPlaceholder = (cfg) => !cfg.pixel.id || /PREENCHER/i.test(cfg.pixel.id)

// --- Largada às 05:00 no fuso da conta ---------------------------------------------------------

function getUtcOffsetMinutes(timeZone, atDate) {
  const offsetPart = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(atDate).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0'
  const match = offsetPart.match(/GMT([+-]\d+)(?::(\d+))?/)
  if (!match) return 0
  const sign = match[1].startsWith('-') ? -1 : 1
  return sign * (Math.abs(Number(match[1])) * 60 + Number(match[2] || 0))
}

function computeNext5amIso(timeZone) {
  const now = new Date()
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(now).map((p) => [p.type, p.value]),
  )
  let targetDateStr = `${parts.year}-${parts.month}-${parts.day}`
  if (Number(parts.hour) * 60 + Number(parts.minute) >= 5 * 60) {
    targetDateStr = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + 1)).toISOString().slice(0, 10)
  }
  const off = getUtcOffsetMinutes(timeZone, now)
  const abs = Math.abs(off)
  return `${targetDateStr}T05:00:00${off >= 0 ? '+' : '-'}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`
}

// --- Passo 1: acesso à conta, página e pixel ---------------------------------------------------

async function checkAccess(cfg) {
  console.log('[1] Conferindo acesso à conta de anúncios, página e pixel…')
  const account = await graphGet(cfg.conta_de_anuncios.id, { fields: 'name,currency,timezone_name,account_status' })
  console.log(`  Conta: ${account.name} · moeda ${account.currency} · fuso ${account.timezone_name} · status ${account.account_status}`)
  // O token pode não ler a página (sem pages_read_engagement), mas consegue anunciar com ela pelo ID.
  // Nesse caso, testa gerando uma prévia (generatepreviews não cria nada).
  const page = await graphGet(cfg.pagina_facebook.id, { fields: 'name' }).catch(() => null)
  if (page) console.log(`  Página: ${page.name}`)
  else {
    const spec = { object_story_spec: { page_id: cfg.pagina_facebook.id, link_data: { link: cfg.link_final, message: 'teste' } } }
    await graphGet(`${cfg.conta_de_anuncios.id}/generatepreviews`, { ad_format: 'MOBILE_FEED_STANDARD', creative: spec })
    console.log(`  Página: ${cfg.pagina_facebook.nome} — sem leitura dos dados, mas a Meta aceita anunciar com ela pelo ID (prévia de teste OK)`)
  }
  if (pixelIsPlaceholder(cfg)) {
    console.log('  Pixel: AINDA NÃO PREENCHIDO em campanha.json (pixel.id).')
  } else {
    const pixel = await graphGet(cfg.pixel.id, { fields: 'name' })
    console.log(`  Pixel: ${pixel.name} (${cfg.pixel.id})`)
  }
  return account
}

// --- Passo 2: o pixel recebeu eventos nas últimas 48h? (só avisa) -------------------------------

async function checkPixelRecentEvents(cfg) {
  console.log(`\n[2] Conferindo se o pixel recebeu eventos de ${SITE_HOST} nas últimas 48h…`)
  if (pixelIsPlaceholder(cfg)) {
    console.log('  Pulado: pixel ainda não preenchido.')
    return false
  }
  const now = Math.floor(Date.now() / 1000)
  const since = now - 48 * 3600
  try {
    const stats = await graphGet(`${cfg.pixel.id}/stats`, { aggregation: 'event', start_time: since, end_time: now })
    const total = (stats.data || []).reduce(
      (sum, row) => sum + (Array.isArray(row.data) ? row.data.reduce((s, ev) => s + Number(ev.count || 0), 0) : Number(row.count || 0)),
      0,
    )
    if (total > 0) {
      console.log(`  OK — ${total} evento(s) nas últimas 48h.`)
      return true
    }
  } catch (err) {
    console.log(`  /stats não funcionou (${err.message}).`)
  }
  console.log('  Nenhum evento recente confirmado.')
  return false
}

// --- Passo 3: público (busca o ID de cada interesse pelo nome) ----------------------------------

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

async function resolveAudience(cfg) {
  console.log('\n[3] Montando o público e buscando os interesses pelo nome…')
  const p = cfg.publico
  const banned = new Set((p.nao_usar || []).map(norm))
  const interests = []
  const notFound = []
  for (const name of p.interesses_por_nome) {
    const resp = await graphGet('search', { type: 'adinterest', q: name, limit: '10', locale: 'pt_BR' }).catch((err) => {
      console.log(`  Busca de "${name}" falhou: ${err.message}`)
      return { data: [] }
    })
    const list = (resp.data || []).filter((i) => !banned.has(norm(i.name)))
    const exact = list.find((i) => norm(i.name) === norm(name))
    const pick = exact || list.find((i) => norm(i.name).includes(norm(name)))
    if (pick) {
      if (!interests.some((i) => i.id === pick.id)) interests.push({ id: pick.id, name: pick.name })
      const size = pick.audience_size_lower_bound ? ` · ~${Number(pick.audience_size_lower_bound).toLocaleString('pt-BR')}+ pessoas` : ''
      console.log(`  "${name}" → "${pick.name}" (${pick.id})${exact ? '' : ' [nome parecido]'}${size}`)
    } else {
      notFound.push(name)
      console.log(`  "${name}" → não encontrado (pulado)`)
    }
  }
  if (interests.length === 0) throw new Error('Nenhum interesse encontrado. Confira os nomes em campanha.json → publico.interesses_por_nome.')
  const targeting = {
    geo_locations: p.geo_locations,
    genders: p.genders,
    age_min: p.age_min,
    age_max: p.age_max,
    flexible_spec: [{ interests }],
    targeting_automation: { advantage_audience: p.advantage_audience ?? 0 },
  }
  return { source: `interesses (fase ${p.fase})`, targeting, notFound }
}

// --- Passo 4: imagens ----------------------------------------------------------------------------

async function ensureImages(cfg, result) {
  console.log('\n[4] Enviando as imagens dos anúncios (adimages)…')
  result.images = result.images || {}
  for (const [adName, ad] of Object.entries(cfg.anuncios)) {
    for (const sizeKey of ['imagem_4x5', 'imagem_9x16']) {
      const key = `${adName}__${sizeKey}`
      if (result.images[key]) continue
      const file = path.join(CAMPAIGN_DIR, ad[sizeKey])
      if (!fs.existsSync(file)) throw new Error(`Imagem não encontrada: ${path.relative(ROOT, file)}`)
      // Uma imagem por chamada, no parâmetro "bytes".
      const resp = await graphPost(`${cfg.conta_de_anuncios.id}/adimages`, { bytes: fs.readFileSync(file).toString('base64'), name: key })
      const info = Object.values(resp.images || {})[0]
      if (!info?.hash) throw new Error(`Upload de "${key}" não retornou hash.`)
      result.images[key] = { hash: info.hash, url: info.url }
      saveResult(result)
    }
    console.log(`  "${adName}": ok.`)
  }
  return result.images
}

// --- Passo 5: campanha, conjuntos, criativos e anúncios (tudo PAUSED) ---------------------------

async function ensureCampaign(cfg, result) {
  console.log('\n[5a] Campanha…')
  if (result.campaign?.id) {
    console.log(`  Já existe: ${result.campaign.id} — pulando.`)
    return result.campaign.id
  }
  const resp = await graphPost(`${cfg.conta_de_anuncios.id}/campaigns`, {
    name: cfg.campanha.nome,
    objective: cfg.campanha.objective,
    special_ad_categories: cfg.campanha.special_ad_categories,
    status: 'PAUSED',
    is_adset_budget_sharing_enabled: false,
  })
  result.campaign = { id: resp.id, name: cfg.campanha.nome }
  saveResult(result)
  console.log(`  Criada: ${resp.id}`)
  return resp.id
}

async function ensureAdSets(cfg, result, campaignId, audience, startTime) {
  console.log('\n[5b] Conjuntos…')
  console.log(`  Largada agendada: ${startTime} (depois disso, roda sem parar).`)
  result.adsets = result.adsets || {}
  const common = cfg.configuracao_comum_dos_conjuntos
  for (const conjunto of cfg.conjuntos) {
    if (result.adsets[conjunto.chave]?.id) {
      console.log(`  "${conjunto.nome}" já existe: ${result.adsets[conjunto.chave].id} — pulando.`)
      continue
    }
    const body = (targeting) => ({
      name: conjunto.nome,
      campaign_id: campaignId,
      daily_budget: conjunto.daily_budget_centavos,
      optimization_goal: common.optimization_goal,
      billing_event: common.billing_event,
      bid_strategy: common.bid_strategy,
      status: 'PAUSED',
      start_time: startTime,
      promoted_object: { pixel_id: cfg.pixel.id, custom_event_type: common.promoted_object.custom_event_type },
      // Sem publisher_platforms no targeting = posicionamentos Advantage+ (automáticos).
      targeting,
    })
    let resp
    try {
      resp = await graphPost(`${cfg.conta_de_anuncios.id}/adsets`, body(audience.targeting))
    } catch (err) {
      if (audience.targeting.targeting_automation?.advantage_audience !== 0) throw err
      console.log(`  A Meta recusou o público com Advantage+ desligado (${err.message}). Tentando com Advantage+ ligado (interesses como sugestão)…`)
      audience.targeting = { ...audience.targeting, targeting_automation: { advantage_audience: 1 } }
      audience.source += ' · Advantage+ ligado (a Meta exigiu)'
      result.audience = audience
      saveResult(result)
      resp = await graphPost(`${cfg.conta_de_anuncios.id}/adsets`, body(audience.targeting))
    }
    result.adsets[conjunto.chave] = { id: resp.id, name: conjunto.nome }
    saveResult(result)
    console.log(`  Criado "${conjunto.nome}": ${resp.id}`)
  }
}

const ADVANTAGE_FEATURES = ['image_touchups', 'image_templates', 'image_brightness_and_contrast', 'image_uncrop', 'text_optimizations', 'inline_comment', 'enhance_cta']

async function ensureCreative(cfg, result, adName, ad, images) {
  result.creatives = result.creatives || {}
  if (result.creatives[adName]?.id) return result.creatives[adName].id

  const img4x5 = images[`${adName}__imagem_4x5`]
  const img9x16 = images[`${adName}__imagem_9x16`]
  const advantageOff = cfg.advantage_creative_desligado
    ? { degrees_of_freedom_spec: { creative_features_spec: Object.fromEntries(ADVANTAGE_FEATURES.map((f) => [f, { enroll_status: 'OPT_OUT' }])) } }
    : {}
  const igIdentity = cfg.pagina_facebook.instagram_user_id_da_pagina ? { instagram_user_id: cfg.pagina_facebook.instagram_user_id_da_pagina } : {}
  const placementRules = [
    {
      customization_spec: { publisher_platforms: ['facebook', 'instagram'], facebook_positions: ['feed', 'right_hand_column'], instagram_positions: ['stream', 'explore'] },
      image_label: { name: 'img_4x5' },
    },
    {
      customization_spec: { publisher_platforms: ['facebook', 'instagram'], facebook_positions: ['story', 'facebook_reels'], instagram_positions: ['story', 'reels'] },
      image_label: { name: 'img_9x16' },
    },
  ]
  const feedSpec = (bodies, titles) => ({
    name: `Criativo · ${adName}`,
    object_story_spec: { page_id: cfg.pagina_facebook.id, ...igIdentity },
    asset_feed_spec: {
      ad_formats: ['SINGLE_IMAGE'],
      images: [
        { hash: img4x5.hash, adlabels: [{ name: 'img_4x5' }] },
        { hash: img9x16.hash, adlabels: [{ name: 'img_9x16' }] },
      ],
      bodies: bodies.map((text) => ({ text })),
      titles: titles.map((text) => ({ text })),
      descriptions: [{ text: cfg.descricao_padrao }],
      link_urls: [{ website_url: cfg.link_final }],
      call_to_action_types: [cfg.call_to_action],
      asset_customization_rules: placementRules,
    },
    url_tags: cfg.url_tags,
    ...advantageOff,
  })
  const singleImage = {
    name: `Criativo · ${adName}`,
    object_story_spec: {
      page_id: cfg.pagina_facebook.id,
      ...igIdentity,
      link_data: {
        link: cfg.link_final,
        message: ad.textos_principais[0],
        name: ad.titulos[0],
        description: cfg.descricao_padrao,
        call_to_action: { type: cfg.call_to_action, value: { link: cfg.link_final } },
        image_hash: img4x5.hash,
      },
    },
    url_tags: cfg.url_tags,
    ...advantageOff,
  }

  // Tenta, nesta ordem: (1) 4x5 + 9x16 com as variações de texto e título; (2) 4x5 + 9x16 com só o
  // primeiro texto e título; (3) só a 4x5 com o primeiro texto e título.
  const attempts = [
    { label: '4x5 + 9x16 com variações de texto', body: feedSpec(ad.textos_principais, ad.titulos) },
    { label: '4x5 + 9x16 com 1 texto e 1 título', body: feedSpec([ad.textos_principais[0]], [ad.titulos[0]]) },
    { label: 'só 4x5 com 1 texto e 1 título', body: singleImage },
  ]
  let resp
  let used
  for (const attempt of attempts) {
    try {
      resp = await graphPost(`${cfg.conta_de_anuncios.id}/adcreatives`, attempt.body)
      used = attempt.label
      break
    } catch (err) {
      console.log(`  "${adName}": formato "${attempt.label}" recusado (${err.message}).`)
    }
  }
  if (!resp) throw new Error(`Nenhum formato de criativo foi aceito para "${adName}".`)
  result.creatives[adName] = { id: resp.id, formato: used }
  saveResult(result)
  console.log(`  Criativo "${adName}": ${resp.id} (${used})`)
  return resp.id
}

async function ensureAd(cfg, result, adName, ad, creativeId) {
  result.ads = result.ads || {}
  if (result.ads[adName]?.id) {
    console.log(`  "${adName}" já existe: ${result.ads[adName].id} — pulando.`)
    return
  }
  const resp = await graphPost(`${cfg.conta_de_anuncios.id}/ads`, {
    name: adName,
    adset_id: result.adsets[ad.conjunto].id,
    creative: { creative_id: creativeId },
    status: 'PAUSED',
  })
  result.ads[adName] = { id: resp.id }
  saveResult(result)
  console.log(`  Criado "${adName}": ${resp.id}`)
}

// --- Passo 6: links de pré-visualização --------------------------------------------------------

async function generatePreviews(result) {
  console.log('\n[6] Gerando links de pré-visualização…')
  result.previews = result.previews || {}
  const formats = { feed_facebook: 'MOBILE_FEED_STANDARD', feed_instagram: 'INSTAGRAM_STANDARD', stories_instagram: 'INSTAGRAM_STORY', reels_instagram: 'INSTAGRAM_REELS' }
  for (const [adName, ad] of Object.entries(result.ads || {})) {
    result.previews[adName] = result.previews[adName] || {}
    for (const [label, adFormat] of Object.entries(formats)) {
      if (result.previews[adName][label]) continue
      const resp = await graphGet(`${ad.id}/previews`, { ad_format: adFormat }).catch((err) => {
        console.log(`  Sem preview "${label}" para "${adName}": ${err.message}`)
        return null
      })
      const iframe = resp?.data?.[0]?.body
      if (iframe) {
        result.previews[adName][label] = iframe
        console.log(`  OK: ${adName} · ${label}`)
      }
    }
  }
  saveResult(result)
}

// --- Simulação ---------------------------------------------------------------------------------

function printDryRunPlan(cfg, audience, startTime) {
  console.log(`\nCampanha: "${cfg.campanha.nome}" · ${cfg.campanha.objective} · PAUSED`)
  console.log(`Pixel: ${pixelIsPlaceholder(cfg) ? 'NÃO PREENCHIDO (modo real não roda assim)' : cfg.pixel.id} · otimização: compra (Purchase)`)
  console.log(`Largada agendada: ${startTime}`)
  console.log(`\nPúblico (${audience.source}):`)
  console.log(JSON.stringify(audience.targeting, null, 2))
  if (audience.notFound?.length) console.log(`Interesses não encontrados (pulados): ${audience.notFound.join(', ')}`)
  for (const conjunto of cfg.conjuntos) {
    console.log(`\n  Conjunto "${conjunto.nome}" · R$ ${(conjunto.daily_budget_centavos / 100).toFixed(2)}/dia · PAUSED`)
    for (const adName of conjunto.ads) {
      const ad = cfg.anuncios[adName]
      const ok = ['imagem_4x5', 'imagem_9x16'].map((k) => `${ad[k]} ${fs.existsSync(path.join(CAMPAIGN_DIR, ad[k])) ? '✓' : '✗ NÃO ENCONTRADA'}`)
      console.log(`    Anúncio "${adName}"`)
      console.log(`      Imagens: ${ok.join(' · ')}`)
      console.log(`      ${ad.textos_principais.length} textos principais · títulos: ${ad.titulos.join(' | ')}`)
    }
  }
  console.log(`\nLink: ${cfg.link_final} · CTA ${cfg.call_to_action} · descrição "${cfg.descricao_padrao}"`)
  console.log(`UTM: ${cfg.url_tags}`)
  console.log('Tudo seria criado como PAUSED — nada vai ao ar sem revisão manual.')
}

// --- main ----------------------------------------------------------------------------------------

async function main() {
  console.log(`=== Manual da Lash · Criar campanha no Meta Ads (${SIMULATE ? 'SIMULAÇÃO' : 'MODO REAL'}) ===`)
  const cfg = loadConfig()

  if (!TOKEN) {
    if (!SIMULATE) {
      console.error('\nFaltou o token: coloque META_ACCESS_TOKEN=... no .env (na raiz do projeto) e rode de novo.')
      process.exit(1)
    }
    console.log('\nSem META_ACCESS_TOKEN — simulação offline (sem chamadas à API).')
    const p = cfg.publico
    printDryRunPlan(
      cfg,
      { source: 'interesses por nome (IDs só são buscados com token)', targeting: { geo_locations: p.geo_locations, genders: p.genders, age_min: p.age_min, age_max: p.age_max, interesses: p.interesses_por_nome, targeting_automation: { advantage_audience: p.advantage_audience } } },
      `${computeNext5amIso('America/Sao_Paulo')} (exemplo; com token usa o fuso real da conta)`,
    )
    return
  }

  if (SIMULATE) {
    console.log('\nToken encontrado — leituras de verdade (passos 1 a 3); nada é criado.\n')
    const account = await checkAccess(cfg)
    await checkPixelRecentEvents(cfg)
    const audience = await resolveAudience(cfg)
    printDryRunPlan(cfg, audience, computeNext5amIso(account.timezone_name))
    return
  }

  // MODO REAL
  if (pixelIsPlaceholder(cfg)) {
    console.error('\nO pixel ainda não foi preenchido em marketing/campanha-manual/campanha.json (pixel.id). Crie o pixel, preencha e rode de novo.')
    process.exit(1)
  }
  const result = loadResult()
  const account = await checkAccess(cfg)
  if (!(await checkPixelRecentEvents(cfg))) {
    console.log(`\nAVISO: o pixel ainda não recebeu eventos de ${SITE_HOST} nas últimas 48h. Seguindo (tudo fica PAUSED) — confira o pixel antes de ativar.`)
  }
  result.audience = result.audience || (await resolveAudience(cfg))
  result.scheduledStart = result.scheduledStart || computeNext5amIso(account.timezone_name)
  saveResult(result)

  const images = await ensureImages(cfg, result)
  const campaignId = await ensureCampaign(cfg, result)
  await ensureAdSets(cfg, result, campaignId, result.audience, result.scheduledStart)
  console.log('\n[5c] Criativos e anúncios…')
  for (const [adName, ad] of Object.entries(cfg.anuncios)) {
    const creativeId = await ensureCreative(cfg, result, adName, ad, images)
    await ensureAd(cfg, result, adName, ad, creativeId)
  }
  await generatePreviews(result)

  console.log('\n=== Pronto. Campanha, conjuntos e anúncios criados como PAUSED. ===')
  console.log('Resultado salvo em marketing/campanha-manual/resultado.json (sem token).')
}

main().catch((err) => {
  console.error(`\nErro: ${err.message}`)
  process.exit(1)
})
