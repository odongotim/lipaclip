import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpg'
import { IconGoogle } from '../components/icons'

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') || ''

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkEmail, setCheckEmail] = useState(false)

  const handleGoogleSignup = async () => {
    setError('')
    setGoogleLoading(true)
    // Stash the chosen role — the auth callback page reads this once Google
    // redirects back, since OAuth loses normal React state.
    localStorage.setItem('lipaclip_pending_role', role)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setGoogleLoading(false) }
  }

  const handleSignup = async () => {
    setError('')
    if (!name) { setError('Please enter your full name'); return }
    if (!email) { setError('Please enter your email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (!agreed) { setError('Please accept the terms and conditions'); return }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    })
    if (error) { setError(error.message); setLoading(false); return }

    // Create profile
    await supabase.from('profiles').insert({
      id: data.user!.id,
      email,
      display_name: name,
      phone,
      role,
    })

    setLoading(false)

    // If email confirmation is required, there's no session yet — show a
    // "check your inbox" screen instead of trying to enter the app.
    if (!data.session) {
      setCheckEmail(true)
      return
    }

    if (role === 'brand') navigate('/brand')
    else navigate('/influencer')
  }

  if (checkEmail) {
    return (
      <div className="relative min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="relative w-full max-w-md text-center">
          <div className="bg-white border border-stone-200 rounded-2xl p-8">
            <svg className="w-12 h-12 text-amber-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <h2 className="text-stone-900 font-bold text-xl mb-2">Check your email</h2>
            <p className="text-stone-500 text-sm mb-6">We sent a confirmation link to <strong>{email}</strong>. Click it to verify your account, then log in.</p>
            <Link to="/login" className="inline-block bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-lg transition text-sm">Go to Login</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="relative min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-50 blur-[120px]" aria-hidden="true" />
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="LipaClip" className="w-10 h-10 rounded-full object-cover border border-stone-200" />
              <span className="font-display text-amber-600 text-3xl font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
            </Link>
            <p className="text-stone-500 mt-2 text-sm">First, tell us who you are</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-8">
            <h2 className="font-display text-stone-900 text-xl font-bold mb-6 tracking-tight">I'm signing up as a...</h2>
            <div className="space-y-3">
              <button onClick={() => setRole('brand')} className="w-full text-left border border-stone-200 hover:border-amber-400 rounded-xl p-4 transition">
                <div className="text-stone-900 font-semibold text-sm">Brand</div>
                <div className="text-stone-500 text-xs mt-0.5">I want to run campaigns and get creators to post videos</div>
              </button>
              <button onClick={() => setRole('influencer')} className="w-full text-left border border-stone-200 hover:border-amber-400 rounded-xl p-4 transition">
                <div className="text-stone-900 font-semibold text-sm">Influencer</div>
                <div className="text-stone-500 text-xs mt-0.5">I want to post videos for campaigns and get paid per view</div>
              </button>
            </div>
            <p className="text-stone-500 text-sm text-center mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-amber-600 hover:text-amber-700">Login</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-amber-50 blur-[120px]" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo} alt="LipaClip" className="w-10 h-10 rounded-full object-cover border border-stone-200" />
            <span className="font-display text-amber-600 text-3xl font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
          </Link>
          <p className="text-stone-500 mt-2 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-stone-900 text-xl font-bold tracking-tight">Get started</h2>
            <button onClick={() => setRole('')} className="text-amber-600 hover:text-amber-700 text-xs font-semibold capitalize">
              Signing up as {role} · change
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2.5 border border-stone-300 hover:border-stone-400 disabled:opacity-50 text-stone-900 font-semibold py-3 rounded-lg transition text-sm mb-5"
          >
            <IconGoogle className="w-5 h-5" />
            {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-stone-400 text-xs">or sign up with email</span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
  <label className="text-stone-500 text-sm mb-1 block">Phone Number</label>
  <input
    type="tel"
    value={phone}
    onChange={e => setPhone(e.target.value)}
    placeholder="e.g. 0771234567"
    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
  />
</div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-stone-50 border text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none transition ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-300 focus:border-red-300'
                    : 'border-stone-200 focus:border-amber-500'
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-700 text-xs mt-1">Passwords match</p>
              )}
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1 accent-amber-600 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="terms" className="text-stone-500 text-sm cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" className="text-amber-600 hover:text-amber-700 underline">
  Terms and Conditions
</Link>
{' '}and{' '}
<Link to="/privacy" className="text-amber-600 hover:text-amber-700 underline">
  Privacy Policy
</Link>
              </label>
            </div>

            <button
              onClick={handleSignup}
              disabled={loading || !agreed}
              className="gold-shimmer w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition text-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <p className="text-stone-500 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-600 hover:text-amber-700">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}