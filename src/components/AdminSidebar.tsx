import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Props = { userName?: string }

const links = [
  { label: '📊 Dashboard', to: '/admin' },
  { label: '👥 Users', to: '/admin/users' },
  { label: '💰 Payments', to: '/admin/withdrawals' },
  { label: '📹 Views', to: '/admin/views' },
  { label: '✅ Verifications', to: '/admin/verifications' },
  { label: '⚙️ Settings', to: '/admin/settings' },
]

export default function AdminSidebar({ userName }: Props) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const navLinks = links.map(item => (
    <Link key={item.to} to={item.to} onClick={() => setOpen(false)}
      className={`px-4 py-3 rounded-lg text-sm transition block ${location.pathname === item.to ? 'bg-yellow-500/20 text-yellow-400 font-semibold' : 'text-gray-400 hover:text-white hover:bg-yellow-500/10'}`}>
      {item.label}
    </Link>
  ))

  return (
    <>
      {/* Mobile hamburger */}
      <button onClick={() => setOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 p-2 rounded-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>

      {/* Mobile overlay */}
      {open && <div className="lg:hidden fixed inset-0 bg-black/70 z-40" onClick={() => setOpen(false)} />}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-[#0f0a06] border-r border-yellow-900/30 p-6 z-50 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <Link to="/" className="text-yellow-500 text-2xl font-bold mb-8 block">Lipa<span className="text-white">Clip</span></Link>
        <div className="flex flex-col gap-1 flex-1">{navLinks}</div>
        <div className="mt-8 pt-6 border-t border-yellow-900/30">
          <div className="text-gray-500 text-xs mb-3 truncate">{userName}</div>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm transition">Logout</button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-yellow-900/30 p-6 fixed h-full bg-[#0f0a06]">
        <Link to="/" className="text-yellow-500 text-2xl font-bold mb-8 block">Lipa<span className="text-white">Clip</span></Link>
        <div className="flex flex-col gap-1 flex-1">{navLinks}</div>
        <div className="mt-auto pt-6 border-t border-yellow-900/30">
          <div className="text-gray-500 text-xs mb-3 truncate">{userName}</div>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm transition">Logout</button>
        </div>
      </aside>
    </>
  )
}
