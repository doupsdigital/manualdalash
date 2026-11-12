import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { TabBar } from './components/TabBar'
import Welcome from './screens/Welcome'
import Home from './screens/Home'
import Module from './screens/Module'
import Lesson from './screens/Lesson'
import Bonus from './screens/Bonus'
import Checklist from './screens/Checklist'
import Guide from './screens/Guide'
import ForYou from './screens/ForYou'
import { hasSeenWelcome } from './lib/onboarding'

const TAB_ROUTES = ['/inicio', '/bonus', '/para-voce']

export default function App() {
  const location = useLocation()
  const showTabs = TAB_ROUTES.includes(location.pathname)

  return (
    <div className="flex min-h-full items-center justify-center bg-[#1d0c19]">
      <div className="relative h-screen max-h-[880px] w-full max-w-[430px] overflow-hidden bg-night text-white">
        <Routes>
          <Route path="/" element={<Navigate to={hasSeenWelcome() ? '/inicio' : '/boas-vindas'} replace />} />
          <Route path="/boas-vindas" element={<Welcome />} />
          <Route path="/inicio" element={<Home />} />
          <Route path="/modulo/:id" element={<Module />} />
          <Route path="/licao/:id" element={<Lesson />} />
          <Route path="/bonus" element={<Bonus />} />
          <Route path="/bonus/checklist" element={<Checklist />} />
          <Route path="/bonus/guia" element={<Guide />} />
          <Route path="/para-voce" element={<ForYou />} />
        </Routes>
        {showTabs && <TabBar />}
      </div>
    </div>
  )
}
