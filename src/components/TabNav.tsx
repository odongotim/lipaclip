import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { ComponentType } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpg'
import { IconLogout } from './icons'

export type NavItem = {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
  /** Match only this exact path (use for section roots like /brand). */
  exact?: boolean
  /** Draw this tab as the main action (a raised circle on phones, a filled button on desktop). */
  highlight?: boolean
  /** Small red count on the tab. */
  badge?: number
}

type Props = {
  items: NavItem[]
  userName?: string
  /** 'bottom': tab bar at the bottom on phones, tabs in the header on desktop. 'scroll': scrolling tab row under the header (for many tabs). */
  variant?: 'bottom' | 'scroll'
  showLogout?: boolean
}

export default function TabNav({ items, userName, variant = 'bottom', showLogout = false }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const isActive = (it: NavItem) => (it.exact ? pathname === it.to : pathname === it.to || pathname.startsWith(it.to + '/'))

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const badge = (n?: number) =>
    n && n > 0 ? (
      <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
        <span aria-hidden="true">{n > 9 ? '9+' : n}</span>
        <span className="sr-only">{n} waiting</span>
      </span>
    ) : null

  return (
    <>
      <header className="sticky top-0 z-30 bg-stone-50/95 backdrop-blur-sm border-b border-stone-200" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={logo} alt="LipaClip" className="w-8 h-8 rounded-full object-cover border border-stone-200" />
            <span className="font-display text-brand-700 text-lg font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
          </Link>

          {variant === 'bottom' && (
            <nav aria-label="Main" className="hidden md:flex items-center gap-1 ml-4">
              {items.map(it => (
                <Link key={it.to} to={it.to} aria-current={isActive(it) ? 'page' : undefined}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    it.highlight
                      ? 'bg-brand-700 hover:bg-brand-800 text-white font-semibold'
                      : isActive(it) ? 'bg-brand-100 text-brand-800 font-semibold' : 'text-stone-600 hover:text-stone-900 hover:bg-brand-50'
                  }`}>
                  <it.icon className="w-4 h-4" />
                  {it.label}
                  {badge(it.badge)}
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3 min-w-0">
            {userName && <span className="hidden sm:block text-stone-500 text-xs truncate max-w-[10rem]">{userName}</span>}
            {showLogout && (
              <button onClick={logout} className="flex items-center gap-1.5 text-red-700 hover:text-red-800 text-sm font-medium px-2 py-1.5">
                <IconLogout className="w-4 h-4" />
                Log out
              </button>
            )}
          </div>
        </div>

        {variant === 'scroll' && (
          <nav aria-label="Main" className="max-w-6xl mx-auto px-2 sm:px-5 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map(it => (
              <Link key={it.to} to={it.to} aria-current={isActive(it) ? 'page' : undefined}
                className={`relative flex items-center gap-2 px-3 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  isActive(it) ? 'border-brand-700 text-brand-800 font-semibold' : 'border-transparent text-stone-500 hover:text-stone-900'
                }`}>
                <it.icon className="w-4 h-4" />
                {it.label}
                {badge(it.badge)}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {variant === 'bottom' && (
        <nav aria-label="Main" className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-stone-200" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
            {items.map(it => {
              const active = isActive(it)
              return (
                <li key={it.to}>
                  <Link to={it.to} aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center justify-center gap-0.5 min-h-[58px] text-[11px] transition-colors ${active || it.highlight ? 'text-brand-800 font-semibold' : 'text-stone-500'}`}>
                    <span className="relative">
                      {it.highlight ? (
                        <span className="flex items-center justify-center w-11 h-11 -mt-5 rounded-full bg-brand-700 text-white shadow-lg ring-4 ring-white">
                          <it.icon className="w-6 h-6" />
                        </span>
                      ) : (
                        <it.icon className={`w-6 h-6 ${active ? 'text-brand-700' : ''}`} />
                      )}
                      {badge(it.badge)}
                    </span>
                    {it.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      )}
    </>
  )
}
