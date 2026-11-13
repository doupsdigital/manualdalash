# Configurar o Supabase

Passo a passo para criar o banco e o login do Manual da Lash Designer. Tudo pelo painel —
nenhum comando de terminal é necessário.

## 1. Criar o projeto

1. Em [supabase.com](https://supabase.com), **New project**.
2. Nome: `manual-lash` (ou o que preferir).
3. Região: **South America (São Paulo)**.
4. Defina uma senha de banco (guarde num lugar seguro — não é usada no dia a dia, só se precisar).
5. Espere o projeto terminar de ser criado (1-2 minutos).

## 2. Pegar a URL e a chave do projeto

1. No projeto, vá em **Project Settings → API Keys**.
2. Copie a **Project URL** (algo como `https://xxxxxxxx.supabase.co`).
3. Copie a chave **anon public** (não é segredo, pode ficar no app).
4. Guarde as duas — você vai usá-las em dois lugares:
   - Num arquivo `.env.local` neste computador (se for rodar `npm run dev` com Supabase ligado):
     ```
     VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=cole_aqui_a_anon_public
     ```
   - Nas variáveis de ambiente do projeto na **Vercel** (Settings → Environment Variables), com os
     mesmos dois nomes. Depois de adicionar, é preciso fazer um novo deploy (ou clicar em
     "Redeploy") para elas valerem.

## 3. Criar as tabelas (SQL Editor)

Vá em **SQL Editor → New query**, cole o SQL abaixo e clique em **Run**:

```sql
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
```

Depois, em **outra** query, cole este segundo SQL e rode também:

```sql
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
```

## 4. Configurar o login por e-mail

Em **Authentication → Sign In / Providers → Email**:

1. **Allow new users to sign up**: desligado (só a Edge Function `request-login` cria contas,
   depois de conferir a compra).
2. **Email OTP length**: `8`.
3. Em **Authentication → URL Configuration**:
   - **Site URL**: a URL do app na Vercel (ex.: `https://manualdalash.vercel.app`).
   - **Redirect URLs**: adicione essa mesma URL, a versão com `/` no final, e
     `http://localhost:5200/` (para testar no seu computador).

## 5. Template do e-mail de acesso

Em **Authentication → Emails → Templates → Magic Link**:

1. Assunto: `Seu acesso ao Manual da Lash Designer`.
2. Corpo: cole o conteúdo de `supabase/templates/link-magico.html`.

## 6. E-mail de envio (SMTP próprio, recomendado)

Por padrão, o Supabase manda poucos e-mails por hora — ótimo para testar, mas não para vender de
verdade. Quando for abrir para vendas:

1. Crie uma conta no [Resend](https://resend.com) e verifique um domínio seu.
2. Em **Project Settings → Auth → SMTP Settings**, ligue "Enable Custom SMTP":
   - Host: `smtp.resend.com`
   - Porta: `465`
   - Usuário: `resend`
   - Senha: a chave de API do Resend
   - Remetente: algo como `acesso@seudominio.com.br`, nome "Manual da Lash Designer"

## 7. Criar as Edge Functions

Em **Edge Functions → Create a new function**:

1. Nome: `request-login`. Cole o conteúdo de `supabase/functions/request-login/index.ts`.
   Em "Enforce JWT verification", **desligue** (a função não usa o JWT do app, e precisa
   responder antes do login acontecer).
2. Nome: `kiwify-webhook`. Cole o conteúdo de `supabase/functions/kiwify-webhook/index.ts`.
   Também **desligue** "Enforce JWT verification" (quem chama é a Kiwify, não o app).

## 8. Secrets das Edge Functions

Em **Edge Functions → Secrets**, adicione:

- `KIWIFY_WEBHOOK_TOKEN`: o token que a Kiwify gera ao criar o webhook (veja
  `docs/configurar-kiwify.md`, passo 3).
- `KIWIFY_PRODUCT_MAP`: no formato `id1:manual,id2:mensagens,id3:tabela-precos` — os ids vêm
  da Kiwify (veja `docs/configurar-kiwify.md`, passo 2).
- `RESEND_API_KEY`: a mesma chave de API do Resend usada no SMTP (passo 6) — é com ela que a
  função manda o e-mail de boas-vindas (`supabase/templates/boas-vindas.html`) assim que uma
  compra do manual é aprovada pela primeira vez.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem automaticamente em toda Edge Function,
não precisa cadastrar.

## 9. Testar

1. Com `.env.local` preenchido, rode `npm run dev` — a tela de login deve aparecer.
2. Para liberar seu próprio acesso sem esperar uma compra de teste, no SQL Editor:
   ```sql
   insert into public.purchases (email, kiwify_order_id, product_key, status, buyer_name)
   values ('seu-email@minusculo.com', 'teste-manual', 'manual', 'active', 'Seu Nome');
   ```
3. Tente entrar com esse e-mail no app — deve chegar o link mágico e o código de 8 dígitos.
