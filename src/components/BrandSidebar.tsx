import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpg'
import { IconDashboard, IconPlusCircle, IconUsers, IconSettings, IconLogout } from './icons'

type Props = { userName?: string; logoUrl?: string }

const links = [
  { label: 'Dashboard', to: '/brand', icon: IconDashboard },
  { label: 'New campaign', to: '/brand/new-campaign', icon: IconPlusCircle },
  { label: 'Creators', to: '/brand/creators', icon: IconUsers },
  { label: 'Settings', to: '/brand/settings', icon: IconSettings },
]

export default function BrandSidebar({ userName, logoUrl }: Props) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navLinks = links.map(item => (
    <Link key={item.to} to={item.to} onClick={() => setOpen(false)} aria-current={location.pathname === item.to ? 'page' : undefined}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${location.pathname === item.to ? 'bg-brand-100 text-brand-800 font-semibold' : 'text-stone-500 hover:text-stone-900 hover:bg-brand-50'}`}>
      <item.icon className="w-5 h-5 flex-shrink-0" />
      {item.label}
    </Link>
  ))

  const brandMark = (
    <Link to="/" className="flex items-center gap-2 mb-8">
      <img src={logoUrl || logo} alt="LipaClip" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-stone-200" />
      <span className="text-brand-700 text-xl font-bold">Lipa<span className="text-stone-900">Clip</span></span>
    </Link>
  )

  const footer = (
    <div className="mt-auto pt-6 border-t border-stone-200">
      <div className="text-stone-400 text-xs mb-3 truncate">{userName}</div>
      <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm transition">
        <IconLogout className="w-4 h-4" />
        Logout
      </button>
    </div>
  )

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open menu" className="lg:hidden fixed top-4 left-4 z-50 bg-brand-50 border border-stone-300 text-brand-700 p-2 rounded-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      {open && <div className="lg:hidden fixed inset-0 bg-stone-900/50 z-40" onClick={() => setOpen(false)} />}

      <div className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-stone-50 border-r border-stone-200 p-6 z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute top-4 right-4 text-stone-500 hover:text-stone-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        {brandMark}
        <nav aria-label="Main" className="flex flex-col gap-1 flex-1">{navLinks}</nav>
        {footer}
      </div>

      <aside className="hidden lg:flex flex-col w-64 border-r border-stone-200 p-6 fixed h-full bg-stone-50">
        {brandMark}
        <nav aria-label="Main" className="flex flex-col gap-1 flex-1">{navLinks}</nav>
        {footer}
      </aside>
    </>
  )
}
