import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpg'
import { IconGoogle } from '../components/icons'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    // No role to stash here — an existing account keeps its role; a brand-new
    // signer-in defaults to influencer in the callback page.
    localStorage.removeItem('lipaclip_pending_role')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    await new Promise(r => setTimeout(r, 500))

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()

    if (!profile) {
      await supabase.from('profiles').insert({
        id: data.user.id, email: data.user.email,
        role: 'influencer', display_name: data.user.email?.split('@')[0],
      })
      window.location.href = '/influencer'
      return
    }

    if (profile.role === 'admin') window.location.href = '/admin'
    else if (profile.role === 'brand') window.location.href = '/brand'
    else window.location.href = '/influencer'
  }

  return (
    <div className="relative min-h-screen bg-stone-50 flex items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-50 blur-[120px]" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo} alt="LipaClip" className="w-10 h-10 rounded-full object-cover border border-stone-200" />
            <span className="font-display text-amber-600 text-3xl font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
          </Link>
          <p className="text-stone-500 mt-2 text-sm">Welcome back</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-8 backdrop-blur-sm">
          <h2 className="font-display text-stone-900 text-xl font-bold mb-6 tracking-tight">Login to your account</h2>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 border border-stone-300 hover:border-stone-400 disabled:opacity-50 text-stone-900 font-semibold py-3 rounded-lg transition text-sm mb-5"
          >
            <IconGoogle className="w-5 h-5" />
            {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-stone-400 text-xs">or login with email</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="gold-shimmer w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition text-sm">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          <p className="text-stone-500 text-sm text-center mt-6">
            Don't have an account? <Link to="/signup" className="text-amber-600 hover:text-amber-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
