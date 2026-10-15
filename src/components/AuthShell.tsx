import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import logo from '../assets/logo.jpg'

type Props = { subtitle?: string; title: string; children: ReactNode }

/** Shared frame for the password reset screens (same look as Login). */
export default function AuthShell({ subtitle, title, children }: Props) {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo} alt="LipaClip" className="w-10 h-10 rounded-full object-cover border border-stone-200" />
            <span className="font-display text-brand-700 text-3xl font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
          </Link>
          {subtitle && <p className="text-stone-500 mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <h1 className="font-display text-stone-900 text-xl font-bold mb-6 tracking-tight">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
