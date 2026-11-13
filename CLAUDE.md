# Manual da Lash Designer: contexto completo do projeto

Este arquivo é lido automaticamente pelo Claude Code ao abrir o projeto. Resume tudo o que
foi feito até 13/11/2026 (Fases 1 a 5: app completo, Supabase, Kiwify, extras e PWA; Fase 6:
página de vendas /lp, termos e privacidade — seção 10), para
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
| `npm run lp-imagens` | Gera as imagens da /lp em `public/lp/` (livro em .webp, miniaturas dos módulos + 6 prints do app, ver seção 10) |

## 4. Arquitetura

```
src/
  main.tsx                Escolhe pela URL: /lp, /termos, /privacidade → marketing/; resto → AppRoot
  AppRoot.tsx             O app: providers (Auth, Purchases, Progress) + registro do PWA
  App.tsx                 Rotas e o Gate (loading → login → app)
  marketing/              Página de vendas e páginas legais (pacote separado, ver seção 10)
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
3. **/lp:** preencher `META_PIXEL_ID` quando tiver o pixel; na Kiwify, apontar a página de vendas
   do produto para `https://manualdalash.com.br/lp`.

## 10. Página de vendas (/lp), termos e privacidade

- **Pacote separado do app.** `src/main.tsx` olha a URL **antes** de importar qualquer coisa:
  `/lp`, `/termos`, `/privacidade` carregam `src/marketing/MarketingRoot.tsx`; qualquer outra
  rota carrega `src/AppRoot.tsx` (o app de sempre). Cada `import()` fica numa função própria —
  com os dois no mesmo ternário, o Vite juntava os pré-carregamentos e a /lp baixava o app junto.
  Resultado: a /lp não baixa Supabase, conteúdo do manual nem o JS/CSS do app (~95 KB de JS gzip).
- **Service worker só no app:** `injectRegister: false` no `vite.config.ts` e `registerSW()` em
  `AppRoot.tsx`. Quem chega pela /lp não baixa o app em segundo plano. `public/lp/**` fica fora
  do precache.
  **Cuidado (bug de 13/11/2026):** com `injectRegister: false` o plugin deixou de incluir
  `skipWaiting`/`clientsClaim` no SW, e quem já tinha aberto o app via a /lp só com o fundo ameixa
  (o SW antigo respondia com o app antigo em cache e a versão nova ficava "esperando" para sempre).
  Corrigido no `vite.config.ts`: `skipWaiting` e `clientsClaim` explícitos,
  `navigateFallbackDenylist` para /lp, /termos e /privacidade (sempre da rede, nunca do cache) e
  `importScripts: ['/sw-marketing.js']` (`public/sw-marketing.js`), que ao ativar recarrega as abas
  abertas nessas páginas. Não remover esses itens.
- **CSS próprio:** `src/marketing/marketing.css` (Tailwind só da pasta `marketing/`, Inter latin
  400–800 e Bodoni Moda 500). O `index.css` do app é importado só pelo `AppRoot`.
- **`index.html`** (compartilhado): título da /lp, meta description, og:image
  `/lp/banner.jpg` (1200×400). Um script inline pré-carrega `screen-inicio.webp` e
  `livro.webp` quando a URL é /lp (antes do JS chegar). O app troca o título para "Manual da Lash
  Designer" no `AppRoot`.
- **Arquivos:** `LandingPage.tsx` (seções 1 a 6 + rodapé + barra fixa, textos exatamente os do
  briefing), `Terms.tsx`/`Privacy.tsx`/`LegalLayout.tsx` (adaptados do Agenda Lotada para
  pagamento único; responsável: "Manual da Lash Designer - Um produto Doup - Soluções Digitais";
  `noindex`), `pixel.ts`, `CookieNotice.tsx`, `MarketingLayout.tsx`, `LashMark.tsx` (o cílio
  dourado do ícone).
- **Checkout:** `KIWIFY_CHECKOUT_URL` em `src/lib/config.ts` (`https://pay.kiwify.com.br/Ug94J6b`),
  com a query string da página (UTMs, fbclid) colada no final (`src/lib/checkoutUrl.ts`).
- **Pixel da Meta:** `META_PIXEL_ID` em `config.ts`, **vazio por enquanto** — vazio, nada é
  carregado e o aviso de cookies nem aparece (não há cookie de anúncio). Eventos: `PageView`;
  `ViewContent` uma vez quando a seção `#oferta` aparece; `AddToCart` (value 27, BRL) no clique
  de qualquer botão de compra, com no máximo 250ms antes de ir ao checkout. `InitiateCheckout`
  e `Purchase` ficam com a Kiwify. Ao preencher o ID: cadastrar o mesmo pixel no produto na
  Kiwify com "Disparar Purchase ao gerar Pix" **desligado** (mesma regra do LashBox).
- **Lista dos 11 módulos:** título dourado "Tudo o que tem dentro do manual" (mesmo estilo do "Não é
  um PDF") e cards com miniatura da capa (`public/lp/modulos/`, 144×144, ~3 KB cada,
  gerados por `npm run lp-imagens` a partir de `public/modulos/`), número em Bodoni dourado, título e,
  sempre embaixo dele, "N lições · M min". Esses números vêm do módulo virtual `virtual:modulos-resumo` (plugin
  `modulosResumo` no `vite.config.ts`), calculado do `manual.json` no build — a /lp não baixa o
  conteúdo do manual. Entrada em sequência (`data-stagger`, 60ms entre cards).
- **Pulsação dos botões de compra** (topo, oferta, chamada final; não na barra fixa): `pulse` no
  `BuyButton` + `.lp-pulse` no CSS — scale 1→1,04 e anel rosa expandindo, ciclo de 2,4s (movimento
  nos primeiros 40%), só enquanto o botão está na tela (IntersectionObserver). Hover (desktop):
  para e fica em 1,03 com brilho fixo; toque: 0,97. Sem pulsação com movimento reduzido.
- **Barra fixa do celular:** aparece quando o botão do topo sai da tela (por cima ou por baixo) e some enquanto o botão da
  oferta **ou** o da chamada final está na tela (nunca dois botões iguais juntos, e sem trecho da
  oferta sem botão). Fica abaixo do aviso de cookies (`z-40` × `z-50`).
- **Imagens** (`public/lp/`): `livro.webp`/`livro-titulo.webp` (convertidos dos PNG, que ficam como
  original), `banner.jpg` (só og:image), `selo-garantia.webp` (selo da garantia, esfumado pela
  máscara elíptica `.lp-seal-mask` — sem ela a névoa do selo formava uma caixa) e 6 prints gerados
  por `scripts/gerar-imagens-lp.mjs` (`npm run lp-imagens`): sobe o Vite em modo local na porta
  5299 (sem Supabase), grava progresso de demonstração (módulos 1–3 completos, parou na 4-4, 4 itens
  do checklist marcados), dia fixo 15/10/2026, 390×844. `screen-inicio` sai em escala 3 (é o print
  do topo, mostrado maior); os outros em @2x: módulo, lição, guia (curvaturas, no carrossel),
  checklist e guia-combinacoes (os dois da seção de bônus). O livro tem fundo magenta opaco: na capa
  ele é esfumado por máscara radial (`.lp-book-mask`).
- **Ajustes de 13/11/2026:** seção "E ainda leva 2 bônus" (entre os módulos e a oferta, mesmo fundo
  ameixa; cards em `bg-night`, igual ao fundo dos prints, para o degradê da base não manchar);
  cards do "Não é um PDF" com números 1/2/3 em Bodoni dourado no lugar dos ícones; celular do topo
  maior no celular (60% da largura).
- **Primeira dobra e identificação (13/11/2026, ajustes 2 e 3):** sem a pílula "Ei, Lash Designer"
  e sem o subtítulo branco; headline ~12% maior. Ordem no celular: headline → linha dourada → etiquetas
  (Técnicas · Mapping · Manutenção · Preço · Clientes) → imagem → botão → linha do preço (no desktop,
  texto e botão à esquerda, imagem à direita). No celular a composição celular + livro é a mesma do
  desktop, só menor (`min(76vw,300px)`), inteira, para o botão caber na primeira tela em 390×844.
  Identificação: "Já travou em alguma dessas?" + 3 balões de conversa + "O manual responde, em lições
  de 2 a 4 minutos." (balões de chat sólidos — blush à esquerda, rosa à direita — que chegam um a um
  com pontinhos "digitando", em `ChatQuestions`; só transform/opacity; com movimento reduzido tudo
  aparece direto); os cards do "Não é um PDF" viraram uma frase cada. "Lash" sempre com L
  maiúsculo nos textos da /lp; na headline, "Primeiro" e "Agenda" também (pedido da dona).
- **Revisão Impeccable** (critique + audit, 13/11/2026): `PRODUCT.md`, `DESIGN.md` e
  `.impeccable/` registram produto, visual e relatórios. Itens que ficaram de propósito por serem
  do briefing: texto branco no botão rosa (contraste 2,8:1, abaixo do AA — igual à /lp vencedora
  do LashBox, com a mesma sombra leve no texto; a dona testou texto ameixa e preferiu o branco),
  brilho rosa do botão, brilhos de fundo, 3 cards com ícone. Prints da entrega em `referencia/prints-lp/` (fora do Git).

## 11. Marketing: campanha no Meta Ads

Roteiro completo em **`marketing/campanha-manual/LEIA-ME.md`** (pré-requisitos, token, simulação,
modo real, o que mostrar à dona e regras de decisão). Resumo:

- **`marketing/campanha-manual/campanha.json`:** fonte de verdade da campanha (conta, página,
  pixel, público, 3 conjuntos de R$ 20/dia, textos, títulos, imagens). Sem token.
- **`marketing/campanha-manual/criativos-manual/`:** as 6 imagens (CT-01 a CT-03, feed 1080×1350 e
  Stories/Reels 1080×1920).
- **`scripts/meta/criar-campanha-manual.mjs`:** cria campanha, conjuntos e anúncios **sempre
  PAUSED**; só cria coisas novas e nunca mexe em outras campanhas da conta. `--simular` não cria
  nada (sem token, nem chama a API). Token em `META_ACCESS_TOKEN` no `.env` (fora do Git, nunca
  imprimir). Este computador (trabalho) não tem token; o modo real roda no de casa.
- **`marketing/campanha-manual/resultado.json`:** IDs criados pelo script; no `.gitignore`.
- **Pendente antes do modo real:** pixel novo "Manual da Lash" (ID em `campanha.json` → `pixel.id`
  e em `META_PIXEL_ID` no `src/lib/config.ts`), domínio verificado no Business Manager e pixel
  cadastrado na Kiwify com "Disparar Purchase ao gerar Pix" desligado.
- **Fora do build e do deploy:** `marketing/` não está em `public/` nem é importada pelo app, e o
  `.vercelignore` tem `/marketing/` (com a barra no início, para não excluir `src/marketing/`).
- **Preço:** os textos citam **R$ 27**. Se o preço mudar na Kiwify, atualizar junto: `campanha.json`
  e os criativos, `PRODUCT_PRICE` em `src/lib/config.ts` (Pixel), os textos da /lp
  (`src/marketing/LandingPage.tsx`: oferta, FAQ, barra fixa) e a meta description do `index.html`.
