# Configurar a Cakto

Checkout do Manual desde 17/11/2026, no lugar da Kiwify. Este é o passo a passo para cadastrar o
produto principal, os dois extras e o webhook que libera o acesso automaticamente depois de uma
compra. O `kiwify-webhook` continua publicado, mas só para reembolsos de vendas antigas.

## 1. Produto principal: Manual da Lash Designer

- **Preço:** R$ 27,00, pagamento único. A Cakto soma uma taxa de serviço de R$ 0,99, e o total no
  checkout fica R$ 27,99. Mantivemos essa taxa por decisão da dona.
- **Checkout:**
  - Pix como forma de pagamento padrão.
  - Página de vendas: `https://manualdalash.com.br/lp`.
- **Canal de entrega:** "Link de pagamento". Quem libera o acesso é o webhook (passo 3), não a
  área de membros da Cakto.
- **Anotar:**
  - o **ID do produto**, que vai para o passo 4;
  - o **link do checkout**, que vai em `CHECKOUT_URL`, no `src/lib/config.ts`.

## 2. Extras (order bumps)

1. Crie dois produtos de **R$ 12,90**, pagamento único:
   - **Mensagens que Fecham Horário**;
   - **Tabela de Preços da Lash**.
2. No produto principal, ligue os dois como **order bump**.
3. Anote o **ID** e o **link de checkout** de cada um. Os links vão em `EXTRAS_CHECKOUT_URLS`
   (`src/lib/config.ts`), que é o botão "Desbloquear" do app, para quem não levou o extra na hora.

## 3. Webhook

- **Onde:** Cakto → Integrações → Webhooks → criar.
- **URL:** `https://ohzddtevkalohwjemxsw.supabase.co/functions/v1/cakto-webhook`.
- **Eventos:**
  - Compra aprovada (`purchase_approved`);
  - Reembolso (`refund`);
  - Chargeback (`chargeback`).
  - Os outros eventos podem ficar marcados: a função ignora e só registra no log.
- **Chave secreta:** defina uma chave longa e cadastre a mesma como o secret
  `CAKTO_WEBHOOK_SECRET` no Supabase (Edge Functions → Secrets).
- **Sem reenvio:** a Cakto **não reenvia** se der erro. Tudo fica em `webhook_logs` (com
  `source = 'cakto'`), para conferir e corrigir à mão.

## 4. CAKTO_PRODUCT_MAP

Uma linha só, no Supabase (Edge Functions → Secrets). O mapa aceita o ID longo (UUID) ou o
short_id de cada produto:

```
id-do-manual:manual,id-das-mensagens:mensagens,id-da-tabela:tabela-precos
```

## 5. Supabase (uma vez)

1. **SQL Editor:** rode `supabase/migrations/20261117000000_cakto.sql`. Ele cria as colunas
   `provider` e `parent_order_id` em `purchases`.
2. **Edge Functions → Create function:**
   - nome `cakto-webhook`;
   - cole `supabase/functions/cakto-webhook/index.ts`;
   - **desligue** "Enforce JWT verification".
3. **Secrets:** `CAKTO_WEBHOOK_SECRET` e `CAKTO_PRODUCT_MAP`. O `RESEND_API_KEY` já existe.

## 6. Pixel da Meta

- **Cadastro:** pixel `1015955554886103` no produto principal da Cakto.
- **Purchase:** só no pagamento **aprovado**, não ao gerar o Pix.
- **Eventos que a Cakto dispara no checkout:** InitiateCheckout e Purchase. A /lp continua
  disparando PageView, ViewContent e AddToCart.

## 7. Testar

1. Faça uma compra real no Pix, com os 2 bumps marcados, e depois reembolse.
2. No SQL Editor:
   ```sql
   select received_at, event_type, email, result, message
   from public.webhook_logs where source = 'cakto'
   order by received_at desc limit 20;

   select email, kiwify_order_id, product_key, status, provider, parent_order_id, buyer_name
   from public.purchases where provider = 'cakto' order by created_at desc;
   ```
3. Confira:
   - os 3 produtos aparecem como `active`, e o e-mail de boas-vindas chegou;
   - depois do reembolso, os 3 ficam `revoked`.
4. **Order bumps:** a Cakto não documenta como eles chegam.
   - Se aparecer `produto(s) fora do CAKTO_PRODUCT_MAP` ou se faltar algum extra, veja o
     `payload` em `webhook_logs` e ajuste `extractProducts()` na função.
   - Se o bump chegar como pedido separado sem `parent_order`, o reembolso do principal não
     revoga o bump sozinho. Nesse caso, ajuste a função.
