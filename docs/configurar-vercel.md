# Configurar a Vercel

Passo a passo para publicar o app (já feito uma vez — fica aqui para referência, ou caso
precise refazer em outra conta).

## 1. Importar o projeto

1. Em [vercel.com](https://vercel.com), **Add New → Project**.
2. Conecte a conta do GitHub (`doupsdigital`), se ainda não estiver.
3. Selecione o repositório `manualdalash`.
4. A Vercel detecta Vite sozinha (Framework Preset: Vite) — não precisa mudar build/output.
5. Nenhuma variável de ambiente é obrigatória para o primeiro deploy (o app roda em modo
   local, sem login, até o Supabase ser configurado — veja `docs/configurar-supabase.md`).
6. **Deploy**.

## 2. Variáveis de ambiente (depois que o Supabase estiver pronto)

Em **Settings → Environment Variables**, adicione (marcando Production, Preview e
Development):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Depois de adicionar, faça um **Redeploy** (Deployments → "..." → Redeploy) — variáveis novas
só valem a partir de um build novo.

## 3. Domínio próprio

Em **Settings → Domains**:

1. Adicione o domínio sem `www` (ex.: `manualdalash.com.br`) → **desmarque** "Redirect apex
   domains to www" → "Connect to an environment: Production" → **Add Domain**.
2. Adicione de novo, dessa vez com `www.` → escolha **"Redirect to Another Domain"**, 308
   Permanent Redirect, apontando para o domínio sem `www`.
3. A Vercel mostra os registros DNS que faltam (um `A` para o `@` e um `CNAME` para o `www`).
   Edite esses dois registros no seu provedor de DNS (Hostinger, Registro.br etc.) com os
   valores exatos que a Vercel pedir — eles podem mudar a cada domínio/conta, então sempre
   confira a tela "Invalid Configuration" em vez de copiar um valor antigo.
4. Espera a propagação (minutos a poucas horas) e o certificado SSL ser emitido sozinho.

## 4. SPA e rotas diretas

O `vercel.json` na raiz do projeto já tem o rewrite necessário para qualquer rota (`/entrar`,
`/licao/1-1` etc.) abrir direto, sem dar 404 — isso é obrigatório para SPAs com rota no
navegador (React Router). Não precisa mexer nisso, mas se recriar o projeto do zero, não
esqueça desse arquivo.

## 5. Redeploy automático

Depois do primeiro import, todo `git push` para a branch `main` publica sozinho uma nova
versão em produção. Não precisa fazer nada na Vercel depois disso.
