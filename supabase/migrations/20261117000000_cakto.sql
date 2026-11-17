-- Manual da Lash Designer · checkout na Cakto (17/11/2026)
-- A coluna kiwify_order_id continua com esse nome (unicidade e request-login dependem dela) e passa
-- a guardar o código do pedido de qualquer plataforma. Os pedidos da Cakto são UUID, sem colisão.

alter table public.purchases
  add column if not exists provider text not null default 'kiwify',
  -- Order bump vendido como pedido próprio: aponta para o pedido principal, para o reembolso do
  -- principal revogar o bump junto (ver supabase/functions/cakto-webhook).
  add column if not exists parent_order_id text;

create index if not exists purchases_parent_order_idx on public.purchases (parent_order_id);
