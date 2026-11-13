import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

// /lp, /termos e /privacidade carregam um pacote leve próprio (sem Supabase, sem o conteúdo do
// manual, sem a ferramenta de artes) — é a página que recebe tráfego de anúncio, no 4G.
// Qualquer outra rota carrega o app de verdade. A escolha acontece aqui, antes de importar
// qualquer um dos dois, para o código do outro lado nunca entrar no carregamento da rota atual.
const MARKETING_PATHS = ['/lp', '/termos', '/privacidade']
const path = window.location.pathname.replace(/\/+$/, '') || '/'
const isMarketing = MARKETING_PATHS.includes(path)

// Cada import() fica numa função própria: com os dois no mesmo ternário, o Vite junta os
// pré-carregamentos e a /lp acabava baixando o JS e o CSS do app junto.
const loadMarketing = () => import('./marketing/MarketingRoot')
const loadApp = () => import('./AppRoot')
const Root = lazy(isMarketing ? loadMarketing : loadApp)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Root />
    </Suspense>
  </StrictMode>,
)
