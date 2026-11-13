import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './LandingPage'
import { Terms } from './Terms'
import { Privacy } from './Privacy'
import { MarketingLayout } from './MarketingLayout'
import './marketing.css'

/**
 * Raiz leve de /lp, /termos e /privacidade — carregada sozinha, sem o app (sem Supabase, sem o
 * conteúdo do manual). Ver src/main.tsx: a escolha entre este pacote e o do app acontece antes
 * de qualquer um dos dois ser importado.
 */
export default function MarketingRoot() {
  return (
    <BrowserRouter>
      <MarketingLayout>
        <Routes>
          <Route path="/lp" element={<LandingPage />} />
          <Route path="/termos" element={<Terms />} />
          <Route path="/privacidade" element={<Privacy />} />
          <Route path="*" element={<Navigate to="/lp" replace />} />
        </Routes>
      </MarketingLayout>
    </BrowserRouter>
  )
}
