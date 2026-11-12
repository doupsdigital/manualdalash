# Configurar a Kiwify

Passo a passo para cadastrar o produto principal, os dois extras e o webhook que libera o
acesso automaticamente depois de uma compra.

## 1. Produto principal: Manual da Lash Designer

1. Em **Produtos → Criar produto**, tipo "Curso/Infoproduto" (ou o equivalente a conteúdo digital).
2. Preço: **R$ 19,90**, pagamento único.
3. Garantia: 7 dias (ajuste como preferir).
4. Página de obrigado / acesso: a URL do app na Vercel, terminando em `/entrar`
   (ex.: `https://manualdalash.vercel.app/entrar`).
5. Depois de criar, anote o **id do produto** (aparece na URL do produto no painel, ou em
   Configurações do produto). Você vai usar esse id no passo 4.

## 2. Extras (Mensagens e Tabela de Preços)

Crie mais dois produtos avulsos, do mesmo jeito:

- **Mensagens que Fecham Horário** — R$ 9,90, pagamento único.
- **Tabela de Preços da Lash** — R$ 9,90, pagamento único.

Cada um pode também ser configurado como **order bump** na página de checkout do produto
principal (opcional — em Configurações do produto principal → Order bumps), para a cliente
poder levar junto na hora da compra. Mesmo quem não pegar na hora consegue comprar depois,
direto pelo botão "Desbloquear" dentro do app (link de checkout em `src/lib/config.ts`,
`EXTRAS_CHECKOUT_URLS`).

Anote o **id de cada produto** — vai todo mundo no mesmo mapa (passo 4).

## 3. Criar o webhook

1. Em **Configurações da conta → Webhooks → Criar webhook**.
2. URL: `https://<ref-do-seu-projeto>.supabase.co/functions/v1/kiwify-webhook`
   (o `<ref-do-seu-projeto>` está na URL do seu projeto Supabase).
3. Eventos: **Compra aprovada**, **Compra reembolsada**, **Chargeback**.
4. Escopo: "Todos que sou produtor" (a Kiwify não deixa escolher só os produtos deste app —
   a função ignora sozinha qualquer produto que não esteja no mapa do passo 4).
5. Ao salvar, a Kiwify mostra um **token** — copie e cole como o secret `KIWIFY_WEBHOOK_TOKEN`
   no Supabase (veja `docs/configurar-supabase.md`, passo 8).

## 4. Montar o KIWIFY_PRODUCT_MAP

Com os três ids anotados (passos 1 e 2), monte uma única linha assim:

```
id-do-manual:manual,id-das-mensagens:mensagens,id-da-tabela:tabela-precos
```

Cole esse valor como o secret `KIWIFY_PRODUCT_MAP` no Supabase.

## 5. Testar

1. Faça uma compra de teste (a Kiwify tem um modo de teste/sandbox, ou uma compra real de
   R$ 19,90 que depois pode ser reembolsada).
2. No Supabase, rode esta consulta para conferir se o webhook funcionou:
   ```sql
   select received_at, event_type, email, signature_valid, result, message
   from public.webhook_logs
   order by received_at desc
   limit 20;
   ```
3. Confira se apareceu uma linha nova em `purchases` com `status = 'active'`.
4. Tente entrar no app com o e-mail usado na compra — deve chegar o e-mail de acesso.
