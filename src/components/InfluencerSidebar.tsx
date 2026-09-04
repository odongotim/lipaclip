import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpg'

type Props = { userName?: string }

const links = [
  { label: 'Home', to: '/influencer' },
  { label: 'Dashboard', to: '/influencer/dashboard' },
  { label: 'My Socials', to: '/influencer/socials' },
  { label: 'Withdraw', to: '/influencer/withdraw' },
]

export default function InfluencerSidebar({ userName }: Props) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navLinks = links.map(item => (
    <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
      className={`px-4 py-3 rounded-lg text-sm transition block ${location.pathname === item.to ? 'bg-amber-100 text-amber-600 font-semibold' : 'text-stone-500 hover:text-stone-900 hover:bg-amber-50'}`}>
      {item.label}
    </Link>
  ))

  const footer = (
    <div className="mt-auto pt-6 border-t border-stone-200">
      <div className="text-stone-400 text-xs mb-3 truncate">{userName}</div>
      <button onClick={handleLogout} className="text-red-600 hover:text-red-700 text-sm transition">Logout</button>
    </div>
  )

  return (
    <>
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 bg-amber-50 border border-stone-300 text-amber-600 p-2 rounded-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      {open && <div className="lg:hidden fixed inset-0 bg-stone-900/50 z-40" onClick={() => setOpen(false)} />}

      <div className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-stone-50 border-r border-stone-200 p-6 z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-stone-500 hover:text-stone-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src={logo} alt="LipaClip" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-stone-200" />
          <span className="text-amber-600 text-xl font-bold">Lipa<span className="text-stone-900">Clip</span></span>
        </Link>
        <div className="flex flex-col gap-1 flex-1">{navLinks}</div>
        {footer}
      </div>

      <aside className="hidden lg:flex flex-col w-64 border-r border-stone-200 p-6 fixed h-full bg-stone-50">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <img src={logo} alt="LipaClip" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-stone-200" />
          <span className="text-amber-600 text-xl font-bold">Lipa<span className="text-stone-900">Clip</span></span>
        </Link>
        <div className="flex flex-col gap-1 flex-1">{navLinks}</div>
        {footer}
      </aside>
    </>
  )
}
