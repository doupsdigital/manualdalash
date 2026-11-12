import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './state/auth'
import { PurchasesProvider } from './state/purchases'
import { ProgressProvider } from './state/progress'
import { ProgressSync } from './state/ProgressSync'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
  </StrictMode>,
)
