import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import Login from './screens/Login'
import Welcome from './screens/Welcome'
import Home from './screens/Home'
import Module from './screens/Module'
import Lesson from './screens/Lesson'
import Bonus from './screens/Bonus'
import Checklist from './screens/Checklist'
import Guide from './screens/Guide'
import ForYou from './screens/ForYou'
import ExtraMessages from './screens/extras/Messages'
import ExtraPriceTable from './screens/extras/PriceTable'
import { RequireExtra } from './components/RequireExtra'
import { hasSeenWelcome } from './lib/onboarding'
import { useAuth } from './state/auth'

const TAB_ROUTES = ['/inicio', '/bonus', '/para-voce']

function LoadingScreen() {
  return <div className="absolute inset-0 flex items-center justify-center text-white/40">Carregando…</div>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={hasSeenWelcome() ? '/inicio' : '/boas-vindas'} replace />} />
      <Route path="/boas-vindas" element={<Welcome />} />
      <Route path="/inicio" element={<Home />} />
      <Route path="/modulo/:id" element={<Module />} />
      <Route path="/licao/:id" element={<Lesson />} />
      <Route path="/bonus" element={<Bonus />} />
      <Route path="/bonus/checklist" element={<Checklist />} />
      <Route path="/bonus/guia" element={<Guide />} />
      <Route
        path="/bonus/mensagens"
        element={
          <RequireExtra extraKey="mensagens">
            <ExtraMessages />
          </RequireExtra>
        }
      />
      <Route
        path="/bonus/tabela-precos"
        element={
          <RequireExtra extraKey="tabela-precos">
            <ExtraPriceTable />
          </RequireExtra>
        }
      />
      <Route path="/para-voce" element={<ForYou />} />
    </Routes>
  )
}

export default function App() {
  const location = useLocation()
  const { status } = useAuth()
  const loggedIn = status === 'local' || status === 'ready'
  const showTabs = loggedIn && TAB_ROUTES.includes(location.pathname)

  return (
    <div className="flex min-h-full items-center justify-center bg-[#1d0c19]">
      <div className="relative h-dvh max-h-[880px] w-full max-w-[430px] overflow-hidden bg-night text-white">
        {status === 'loading' ? <LoadingScreen /> : status === 'signedOut' ? <Login /> : <AppRoutes />}
        {showTabs && <TabBar />}
      </div>
    </div>
  )
}
