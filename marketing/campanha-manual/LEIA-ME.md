# Campanha do Manual da Lash Designer no Meta Ads: roteiro para o Claude Code do computador de casa

Este computador tem o token da Meta e acesso ao Gerenciador; o do trabalho não. Tudo (criativos,
textos, configuração e o script) já foi preparado e testado em modo de simulação, e está no GitHub.
Este arquivo é o passo a passo para rodar de verdade aqui. Baseado no que já funcionou no LashBox
(`../lashbox/marketing/campanha-lashbox/` e `../lashbox/scripts/meta/criar-campanha.mjs`).

## Arquivos

- `marketing/campanha-manual/campanha.json`: fonte de verdade da campanha (conta, página, pixel,
  público, orçamentos, textos, títulos, imagens, regras de decisão).
- `marketing/campanha-manual/criativos-manual/`: as 6 imagens (feed 1080×1350 e Stories/Reels
  1080×1920 de cada um dos 3 anúncios).
- `scripts/meta/criar-campanha-manual.mjs`: cria tudo como **PAUSED**. `--simular` não cria nada.
- `marketing/campanha-manual/resultado.json`: criado pelo script com os IDs (sem token). Fora do Git.
- O antigo `meta-ads-manual-lash.json` foi substituído pelo `campanha.json` e pode ser apagado.

## 0. Pré-requisitos (a dona faz no Gerenciador, com ajuda no chat)

Não rode o modo real antes destes 4 itens. O script recusa rodar com o pixel em branco.

1. **Pixel novo "Manual da Lash"** criado no Gerenciador de Eventos → copiar o ID para
   `campanha.json` → `pixel.id` (trocar `PREENCHER_ID_DO_PIXEL`).
2. **Pixel na /lp:** `META_PIXEL_ID` em `src/lib/config.ts` com o mesmo ID, deploy feito, e
   PageView/ViewContent/AddToCart aparecendo em "Testar eventos".
3. **Domínio `manualdalash.com.br` verificado** no Business Manager (meta tag no `index.html`
   ou registro TXT na Hostinger).
4. **Pixel na Cakto** (checkout desde 17/11/2026): produto "Manual da Lash Designer" → pixel
   cadastrado, com o Purchase só no pagamento aprovado (nunca ao gerar o Pix). Os 2 order bumps
   não precisam de pixel próprio.

## 1. Token

1. Na raiz do projeto, no arquivo `.env` (criar se não existir, nunca commitar):
   `META_ACCESS_TOKEN=o_token_aqui`
2. Conferir que `.env` está no `.gitignore`. **Nunca colar o token no chat nem imprimir.**
3. O token precisa de `ads_management` na conta `act_1626088674941828` e poder anunciar com a
   página `1184875188046307` ("Vida de Lash Designer"), os mesmos do LashBox.

## 2. Simulação (obrigatória antes do modo real)

```bash
node scripts/meta/criar-campanha-manual.mjs --simular
```

Com token, faz só leituras e mostra o plano. Conferir com a dona:

- Conta, página e pixel certos (nome, moeda BRL, fuso).
- **Interesses:** `publico.interesses` tem os IDs fixos (a busca da Meta por nome em português
  não acha nada, só pelo nome em inglês). Cada um deve sair com "✓ válido"; se algum vier
  "inválido", mostrar à dona antes de seguir. Nunca usar "Beleza" nem "Salões de beleza".
- 3 conjuntos de R$ 15,00/dia (R$ 45,00/dia no total), 1 anúncio cada, imagens todas com ✓.
- Largada agendada: a próxima 05:00 no fuso da conta.

## 3. Modo real

```bash
node scripts/meta/criar-campanha-manual.mjs
```

Cria campanha, 3 conjuntos e 3 anúncios, **tudo PAUSED**. Se der erro no meio, corrigir e rodar o
mesmo comando de novo: o script lê `resultado.json` e não duplica nada.

Ajustes automáticos que o script já faz (vindos do LashBox):
- Imagens sobem uma por chamada (`bytes`).
- Criativo tenta, em ordem: 4x5 + 9x16 com as variações de texto e título → 4x5 + 9x16 com 1 texto
  e 1 título → só 4x5. O formato usado fica salvo em `resultado.json`.
- Se a Meta recusar o público com Advantage+ desligado, tenta de novo com ele ligado e avisa.
- Melhorias automáticas do Advantage+ criativo desligadas uma a uma.

## 4. O que mostrar à dona no final

1. Tabela com os IDs (campanha, conjuntos, anúncios).
2. Orçamento de cada conjunto (R$ 15,00/dia) e a largada agendada. A campanha roda todos os dias,
   sem pausa no fim de semana.
3. Público usado: interesses (nome e ID), idade, gênero e se o Advantage+ ficou ligado ou desligado.
4. Formato de criativo usado em cada anúncio e se as variações de texto entraram.
5. Links de pré-visualização (feed do Facebook e do Instagram, Stories, Reels), salvos em
   `resultado.json` → `previews`.

Tudo continua PAUSED. A dona ativa no Gerenciador depois de revisar as prévias.

## 5. Regras de decisão (depois de ativar)

- Não mexer em nada nas primeiras 48h.
- Orçamento: R$ 15,00/dia por conjunto, R$ 45,00/dia no total, 7 dias por semana (~R$ 315/semana +
  impostos). Sem pausa no fim de semana: a venda é automática. A Meta pode gastar até ~75% a mais
  num dia e compensar em outro; manter saldo extra na conta para os anúncios não pararem.
- Conjunto que gastar R$ 30 sem nenhum InitiateCheckout: pausar (com R$ 15/dia, leva de 2 a 3 dias
  para chegar lá).
- Dia 3: CTR do link acima de 1,2% é bom; abaixo de 0,7%, o gancho não prende.
- Compra com custo de até ~R$ 27: vencedor. Aumentar o orçamento 20% a 30% a cada 2 dias.
- Com 10 a 20 vendas: duplicar o conjunto vencedor com Público Advantage+ (aberto) e comparar.
- Nas análises: considerar o ticket médio com os order bumps (R$ 27 + R$ 12,90 cada) e não mexer
  em conjuntos em fase de aprendizado sem motivo forte.

## Regra de ouro

O script e qualquer ajuste feito nele **só criam coisas novas** nesta campanha. Nada pode ler,
alterar, pausar ou ativar outras campanhas da conta, principalmente a do StudioMenu. Se algum passo
precisar mexer em outra campanha, pare e pergunte à dona.
