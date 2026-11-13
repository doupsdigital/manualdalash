# Manual da Lash Designer: contexto completo do projeto

Este arquivo é lido automaticamente pelo Claude Code ao abrir o projeto. Resume tudo o que
foi feito até 13/11/2026 (Fases 1 a 5: app completo, Supabase, Kiwify, extras e PWA), para
continuar o trabalho em qualquer computador.

## 1. O produto

- **O que é:** um app (PWA) em português, apostila para **lash designers**: 11 módulos, 60
  lições curtas (2 a 4 min cada), 2 bônus (Checklist do Atendimento, Guia Visual de Fios e
  Curvaturas) e 2 extras avulsos (Mensagens que Fecham Horário, Tabela de Preços da Lash).
  Princípio do projeto: simples, bonito, elegante e funcional — é uma apostila, não um SaaS.
- **Como é vendido:** Kiwify, produto **"Manual da Lash Designer"**, pagamento único de
  **R$ 27,00**. Dois order bumps avulsos, R$ 12,90 cada: **Mensagens que Fecham Horário** e
  **Tabela de Preços da Lash** — vinculados ao checkout do produto principal, mas também
  compráveis depois, pelo botão "Desbloquear" dentro do app.
- **Situação:** **no ar em produção** em https://manualdalash.com.br — GitHub, Supabase,
  Vercel, domínio (Hostinger), Resend e Kiwify todos configurados e testados de ponta a
  ponta, inclusive uma compra real (Pix) com reembolso, confirmando que o webhook libera e
  revoga o acesso corretamente.
- **Reaproveitado dos outros dois apps da dona** (`../lashbox`, `../agendalotada`): o motor
  de login (link mágico + código de 8 dígitos) e o webhook da Kiwify, do agendalotada; o
  motor de artes (tabela de valores com 3 paletas e exportação em PNG), do lashbox —
  simplificado, sem o sistema de "Meu Estúdio" (este app não tem perfil/dashboard).

## 2. Como trabalhar com a dona do projeto

- Mesmas regras dos outros dois apps: ela não é programadora, fala português, um passo de
  cada vez. Ela já tem experiência configurando Supabase/Kiwify dos outros projetos, então
  às vezes prefere seguir os docs sozinha e só chamar se travar.
- **Git:** só commit/push quando ela pedir ("pode subir"). Nunca commitar `.env`. Nunca
  colar tokens no chat — ler o valor do arquivo e usar só em comando, nunca ecoar.
- **Painéis (Supabase, Vercel, Kiwify, Resend, Hostinger):** ela mesma clica; dar o passo a
  passo. Não usar as CLIs dessas ferramentas.
- Linguagem simples e direta em pt-BR nos textos do produto. Nunca usar termos de saúde
  (alergia, irritação, inflamação, doença, remédio, paciente, diagnóstico etc.).

## 3. Configurar este computador

```bash
cd manual-lash
npm install
```

- **Variáveis do Supabase:** `.env.local` (fora do Git) com `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY` (Supabase → Project Settings → API Keys). **Sem esse arquivo,
  `npm run dev` roda em modo local**: sem login, com todos os extras bloqueados (para testar
  a tela de bloqueio) — ver `state/purchases.tsx`.

### Comandos

| Comando | Para quê |
|---|---|
| `npm run dev` | Servidor de desenvolvimento em http://localhost:5200 (porta fixa) |
| `npm run build` | Checa os tipos (`tsc -b`) e gera o build em `dist/` |
| `npm run preview` | Build final em http://localhost:4200 |
| `npm run icons` | Gera os ícones do PWA a partir de `scripts/icon-master.svg` (+ a versão maskable) |

## 4. Arquitetura

```
src/
  App.tsx                 Rotas e o Gate (loading → login → app)
  main.tsx                Providers: AuthProvider, PurchasesProvider, ProgressProvider
  screens/                Login, Welcome, Home, Module, Lesson, Bonus, Checklist, Guide, ForYou
    extras/                Messages, PriceTable, PriceBuilder (ferramenta de montar a tabela)
  components/             ui.tsx, TabBar.tsx, CopyButton.tsx, RequireExtra.tsx
    art/                  PriceBoard.tsx, ScaledBoard.tsx — motor de arte (tabela de valores)
  content/                manual.json (11 módulos/60 lições/2 bônus) + types.ts + index.ts
    extras/                mensagens.json (42 mensagens), tabela-precos.json + types.ts
  state/                  auth.tsx (login), purchases.tsx (extras liberados via my_products()),
                          progress.tsx (lições concluídas/checklist/última lição/tamanho de
                          texto), sync.ts + ProgressSync.tsx (sincronização com o Supabase)
  lib/                    supabase.ts, config.ts (links externos, preços, vitrine),
                          search.ts, clipboard.ts, onboarding.ts, artPalettes.ts, exportBoard.ts
supabase/                 migrations/ (aplicadas), functions/ (request-login e
                          kiwify-webhook, publicadas), templates/ (link-magico.html,
                          boas-vindas.html)
scripts/                  gerar-icones.mjs, icon-master.svg, icon-master-maskable.svg
docs/                     configurar-supabase.md, configurar-kiwify.md, configurar-vercel.md
vercel.json               Rewrite de SPA (toda rota cai no index.html — sem isso, abrir uma
                          rota direto pela URL, como /entrar vindo da Kiwify, dava 404)
```

### Rotas

| Rota | Tela | Observação |
|---|---|---|
| `/` | — | Redireciona para `/inicio` ou `/boas-vindas` (primeiro acesso) |
| `/boas-vindas` | Welcome | Só no primeiro acesso (`lib/onboarding.ts`) |
| `/inicio` | Home | Continuar de onde parou, progresso geral, busca, lista de módulos |
| `/modulo/:id`, `/licao/:id` | Module, Lesson | — |
| `/bonus`, `/bonus/checklist`, `/bonus/guia` | Bonus, Checklist, Guide | — |
| `/bonus/mensagens`, `/bonus/tabela-precos` | Extras | Atrás de `RequireExtra` (só com `my_products()`) |
| `/bonus/tabela-precos/montar` | PriceBuilder | Monta e baixa a tabela de valores em PNG |
| `/para-voce` | ForYou | Vitrine de produtos (`lib/config.ts`, sem URL o card não aparece) |

Sem Supabase configurado (ou com `status === 'local'`), o Gate em `App.tsx` pula direto para
as rotas do app — sem login, mas com os extras sempre bloqueados.

### Regras do app

- **Progresso:** salvo no navegador e, quando logada, também no banco (`state/sync.ts`).
  Lições concluídas somam por união (mantendo a data mais antiga); checklist e última lição
  vista vêm inteiros de quem foi atualizado por último (comparando `updated_at`). O tamanho
  do texto (`Aa`, 16/17/19px) é só do aparelho, nunca sincroniza.
- **Busca** (`lib/search.ts`): local, no título/intro/blocos/dica/erro/resumo, ignorando
  acento/maiúscula, mínimo de 2 letras.
- **Extras:** liberados por `product_key` em `purchases` (`manual` | `mensagens` |
  `tabela-precos`), lidos via `rpc('my_products')`. Bloqueado: cadeado + "Desbloquear · R$
  12,90" (link com o e-mail da logada na query string) + "Já comprei, atualizar". Liberado:
  o card abre a tela direto.
- **Tabela de Preços → ferramenta de montar** (`screens/extras/PriceBuilder.tsx` +
  `components/art/PriceBoard.tsx`): até 6 itens (nome + preço), título e observação
  editáveis, nome do estúdio/Instagram salvos só no aparelho (`localStorage`, sem sistema de
  perfil), 3 paletas (rosa, nude e dourado, preto e dourado — `lib/artPalettes.ts`, portado
  do LashBox), Story (1080×1920) ou Post (1080×1350), exportação em PNG
  (`lib/exportBoard.ts`, `html-to-image`, compartilha ou baixa).

## 5. Login, banco e sincronização (Supabase)

- **Projeto:** ref `ohzddtevkalohwjemxsw`.
- **Fluxo de login:** e-mail → Edge Function `request-login` confere compra `active` do
  `product_key = 'manual'` → cria a conta (com `user_metadata.full_name` vindo do
  `buyer_name` da compra) → link mágico + código de 8 dígitos (OTP de 8 dígitos configurado
  no painel). Depois do login, `rpc('has_access')` confirma o acesso.
- **Tabelas** (`supabase/migrations/`): `purchases` (email, kiwify_order_id, product_key,
  status, buyer_name — único em `kiwify_order_id, product_key`, só o service role acessa),
  `profiles`, `progress`, `webhook_logs`. RLS em tudo, gated por `has_access()`.
- **RPCs:** `has_access()` (compra `manual` ativa) e `my_products()` (todos os `product_key`
  ativos do e-mail logado).
- **E-mails** (Resend, domínio `manualdalash.com.br` verificado):
  - **Login** (`supabase/templates/link-magico.html`, template "Magic Link" do Supabase):
    enviado só quando a cliente pede, em `/entrar`.
  - **Boas-vindas** (`supabase/templates/boas-vindas.html`, mandado pela própria função
    `kiwify-webhook` via API do Resend, **não** pelo template do Supabase): enviado uma
    única vez, na primeira aprovação de compra do `manual` para aquele e-mail. Link fixo do
    app (não expira, ao contrário do link mágico) + explicação de como entrar depois.
  - SMTP customizado no Supabase (Auth → SMTP Settings) com a mesma chave do Resend.

## 6. Kiwify → webhook

- **Produtos** (ids em `KIWIFY_PRODUCT_MAP`, no Supabase):
  - Manual da Lash Designer: `b1f380b0-df4c-11f1-a60d-abb9b485ba7d` → `manual`
  - Mensagens que Fecham Horário: `c02a9cd0-df4d-11f1-baa2-fbfaab2dd2bc` → `mensagens`
  - Tabela de Preços da Lash: `f7691190-df4d-11f1-a269-5bff7a7869e4` → `tabela-precos`
  - Checkouts: `src/lib/config.ts`, `EXTRAS_CHECKOUT_URLS` (extras) e a URL do manual é só
    usada diretamente na Kiwify/anúncios, não precisa estar no código.
- **Webhook** "ManualDaLash", escopo "Todos que sou produtor" (a Kiwify não deixa escolher só
  os produtos deste app) → `https://ohzddtevkalohwjemxsw.supabase.co/functions/v1/kiwify-webhook`,
  eventos Compra aprovada / Reembolso / Chargeback. Produto fora do mapa é ignorado.
- **✅ Confirmado com uma compra real (Pix) + reembolso:** `order_approved` liberou o acesso,
  mandou o e-mail de boas-vindas, e `order_refunded` revogou — tudo certo em `webhook_logs`
  e `purchases`.
- **⚠️ Pendência:** só testamos o produto principal sozinho e os extras via `insert` manual
  no banco (a pedido da dona, para não gastar em teste). **Uma compra real com os dois order
  bumps marcados no mesmo checkout ainda não foi testada** — `extractProducts()` (em
  `supabase/functions/kiwify-webhook/index.ts`) tenta reconhecer bumps em várias chaves
  possíveis do payload (`Bumps`, `bumps`, `OrderBumps`...), mas isso só se confirma de
  verdade na primeira venda real com bump. Confira em `webhook_logs` (campo `payload`)
  quando isso acontecer, e ajuste `extractProducts()` se o formato real for diferente.
- **Secrets** (Edge Functions → Secrets): `KIWIFY_WEBHOOK_TOKEN`, `KIWIFY_PRODUCT_MAP`,
  `RESEND_API_KEY` (mesma chave do SMTP, usada para o e-mail de boas-vindas).

## 7. Hospedagem e domínios

- **GitHub:** `doupsdigital/manualdalash`, branch `main`.
- **Vercel:** projeto `manualdalash`, deploy automático a cada push em `main`.
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` cadastradas. Domínio `manualdalash.com.br`
  (Production), `www.manualdalash.com.br` redireciona para ele (308).
- **Domínio:** comprado na **Hostinger**. DNS (Hostinger): `A @ → 216.198.79.1` (Vercel),
  `CNAME www →` o CNAME de verificação da Vercel (específico deste domínio — confira sempre
  a tela "Invalid Configuration" da Vercel, o valor pode mudar), mais os registros do Resend
  (`TXT resend._domainkey`, `CNAME rsend`, `CNAME send`, `TXT _dmarc`) — não mexer nesses.
- **Resend:** domínio `manualdalash.com.br` verificado, região São Paulo.

## 8. PWA

- Ícone gerado a partir de `scripts/icon-master.svg` (cílio dourado sobre fundo ameixa —
  mesmo desenho usado na tela de login/boas-vindas) + `icon-master-maskable.svg` (mesma arte,
  sem cantos arredondados, para o Android aplicar a máscara dele). `npm run icons` gera os
  PNGs em `public/` (192/512/512 maskable/apple-touch/favicons).
- `vite-plugin-pwa` (`vite.config.ts`): manifest com `display: 'standalone'`, tema ameixa
  `#4A2140`. O conteúdo (módulos/lições) já vai embutido no JS, funciona offline sozinho. As
  capas dos módulos (`public/modulos/*.webp`) ficam **fora do precache** (`globIgnores`) e
  entram em cache (`CacheFirst`) conforme a usuária abre cada módulo — não baixa as 11 de
  uma vez no primeiro acesso.

## 9. O que ainda depende da dona

1. Testar uma compra real com os order bumps marcados juntos (seção 6) — ou simplesmente
   aguardar a primeira venda de verdade com bump e conferir o `webhook_logs` nesse momento.
2. Revisão final de conteúdo/preços antes de abrir para tráfego pago, se for o caso.
