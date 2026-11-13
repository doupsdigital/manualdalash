import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import { AuthProvider } from './state/auth'
import { PurchasesProvider } from './state/purchases'
import { ProgressProvider } from './state/progress'
import { ProgressSync } from './state/ProgressSync'
import './index.css'

// O service worker (PWA) só é registrado pelo app — nunca pela /lp, senão quem chega do anúncio
// baixaria o app inteiro em segundo plano no 4G.
registerSW({ immediate: true })

// O index.html traz o título da página de vendas (para quem compartilha o link); no app, o nome curto.
document.title = 'Manual da Lash Designer'

export default function AppRoot() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PurchasesProvider>
          <ProgressProvider>
            <ProgressSync />
            <App />
          </ProgressProvider>
        </PurchasesProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
