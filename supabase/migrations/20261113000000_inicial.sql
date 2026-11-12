-- Manual da Lash Designer · estrutura inicial
-- Cada usuária só lê e escreve os próprios dados, e só enquanto tiver compra ativa do manual.

-- ───────────── Compras (só o service role acessa) ─────────────
create table public.purchases (
  id bigint generated always as identity primary key,
  email text not null check (email = lower(btrim(email))),
  kiwify_order_id text not null,
  product_key text not null check (product_key in ('manual', 'mensagens', 'tabela-precos')),
  status text not null check (status in ('active', 'revoked')),
  buyer_name text,
  product text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (kiwify_order_id, product_key)
);
create index purchases_email_idx on public.purchases (email);

alter table public.purchases enable row level security;
-- Sem políticas: anon e authenticated não enxergam nada. Só o service role (Edge Functions).
revoke all on table public.purchases from anon, authenticated;

-- ───────────── Acesso: a usuária logada comprou o manual? ─────────────
create or replace function public.has_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.purchases p
    where p.email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and p.status = 'active'
      and p.product_key = 'manual'
  );
$$;
revoke all on function public.has_access() from public, anon;
grant execute on function public.has_access() to authenticated;

-- ───────────── Extras liberados (my_products): quais product_key estão ativos ─────────────
create or replace function public.my_products()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct p.product_key), '{}')
  from public.purchases p
  where p.email = lower(coalesce(auth.jwt() ->> 'email', ''))
    and p.status = 'active';
$$;
revoke all on function public.my_products() from public, anon;
grant execute on function public.my_products() to authenticated;

-- ───────────── Perfil ─────────────
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text check (char_length(name) <= 120),
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "perfil: ler o próprio" on public.profiles
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.has_access()));

create policy "perfil: criar o próprio" on public.profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_access()));

create policy "perfil: alterar o próprio" on public.profiles
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.has_access()))
  with check (user_id = (select auth.uid()));

-- ───────────── Progresso da leitura ─────────────
create table public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  lessons jsonb not null default '{}'::jsonb check (jsonb_typeof(lessons) = 'object'),
  checklist jsonb not null default '{}'::jsonb check (jsonb_typeof(checklist) = 'object'),
  last_lesson text,
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "progresso: ler o próprio" on public.progress
  for select to authenticated
  using (user_id = (select auth.uid()) and (select public.has_access()));

create policy "progresso: criar o próprio" on public.progress
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_access()));

create policy "progresso: alterar o próprio" on public.progress
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.has_access()))
  with check (user_id = (select auth.uid()));

-- Visitantes sem login não acessam nenhuma tabela
revoke all on table public.profiles, public.progress from anon;
