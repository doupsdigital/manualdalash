-- Manual da Lash Designer · registro de todos os webhooks recebidos da Kiwify (para depuração)

create table public.webhook_logs (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  source text not null default 'kiwify',
  event_type text,
  order_id text,
  email text,
  signature_valid boolean not null,
  -- processed | ignored | rejected | error
  result text not null,
  message text,
  payload jsonb,
  raw_body text
);
create index webhook_logs_received_idx on public.webhook_logs (received_at desc);
create index webhook_logs_order_idx on public.webhook_logs (order_id);

alter table public.webhook_logs enable row level security;
-- Sem políticas: só o service role (a Edge Function) grava e lê.
revoke all on table public.webhook_logs from anon, authenticated;
