import { NavLink } from 'react-router-dom'

const ICONS: Record<string, string> = {
  home: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z',
  bonus: 'M3 8h18v4H3zM5 12v8h14v-8M12 8v12M12 8c-1-3-5-4-5-1.5C7 8 9 8 12 8zM12 8c1-3 5-4 5-1.5C17 8 15 8 12 8z',
  you: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16v4M17 18h4',
}

const tabs = [
  { label: 'Início', to: '/inicio', icon: 'home' },
  { label: 'Bônus', to: '/bonus', icon: 'bonus' },
  { label: 'Para você', to: '/para-voce', icon: 'you' },
]

export function TabBar() {
  return (
    <nav className="pb-safe absolute right-0 bottom-0 left-0 z-10 flex border-t border-white/10 bg-night/95 backdrop-blur-xl">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          className="flex h-[72px] flex-1 flex-col items-center justify-center gap-1 text-[10.5px] font-semibold"
        >
          {({ isActive }) => (
            <>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isActive ? '#E07A9B' : 'rgba(255,255,255,.45)'}
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={ICONS[t.icon]} />
              </svg>
              <span style={{ color: isActive ? '#E07A9B' : 'rgba(255,255,255,.45)' }}>{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
