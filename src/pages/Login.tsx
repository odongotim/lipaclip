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
  const [showPassword, setShowPassword] = useState(false)

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
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo} alt="LipaClip" className="w-10 h-10 rounded-full object-cover border border-stone-200" />
            <span className="font-display text-brand-700 text-3xl font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
          </Link>
          <p className="text-stone-500 mt-2 text-sm">Welcome back. Log in to see your campaigns and earnings.</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <h2 className="font-display text-stone-900 text-xl font-bold mb-6 tracking-tight">Log in to your account</h2>
          {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

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
            <span className="text-stone-400 text-xs">or log in with email</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleLogin() }} noValidate>
            <div>
              <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-email">Email</label>
              <input id="f-email" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-stone-500 text-sm" htmlFor="f-password">Password</label>
                <Link to="/forgot-password" className="text-brand-700 hover:text-brand-800 text-xs font-semibold">Forgot password?</Link>
              </div>
              <div className="relative">
                <input id="f-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg pl-4 pr-16 py-3 text-sm focus:outline-none focus:border-brand-500 transition" />
                <button type="button" onClick={() => setShowPassword(v => !v)} aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-stone-500 hover:text-stone-900">{showPassword ? 'Hide' : 'Show'}</button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="gold-shimmer w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition text-sm">
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <p className="text-stone-500 text-sm text-center mt-6">
            Don't have an account? <Link to="/signup" className="text-brand-700 hover:text-brand-700">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
