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
  const [showPassword, setShowPassword] = useState(false)

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
            <svg className="w-12 h-12 text-brand-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <h2 className="text-stone-900 font-bold text-xl mb-2">Check your email</h2>
            <p className="text-stone-500 text-sm mb-6">We sent a confirmation link to <strong>{email}</strong>. Click it to verify your account, then log in.</p>
            <Link to="/login" className="inline-block bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 px-6 rounded-lg transition text-sm">Go to log in</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="relative min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12 overflow-hidden">
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="LipaClip" className="w-10 h-10 rounded-full object-cover border border-stone-200" />
              <span className="font-display text-brand-700 text-3xl font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
            </Link>
            <p className="text-stone-500 mt-2 text-sm">Choose the account that fits</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-8">
            <h2 className="font-display text-stone-900 text-xl font-bold mb-6 tracking-tight">How will you use LipaClip?</h2>
            <div className="space-y-3">
              <button onClick={() => setRole('brand')} className="w-full text-left border border-stone-200 hover:border-brand-400 rounded-xl p-4 transition">
                <div className="text-stone-900 font-semibold text-sm">Brand</div>
                <div className="text-stone-500 text-xs mt-0.5">I run campaigns and pay creators for views</div>
              </button>
              <button onClick={() => setRole('influencer')} className="w-full text-left border border-stone-200 hover:border-brand-400 rounded-xl p-4 transition">
                <div className="text-stone-900 font-semibold text-sm">Creator</div>
                <div className="text-stone-500 text-xs mt-0.5">I post videos for campaigns and earn per view</div>
              </button>
            </div>
            <p className="text-stone-500 text-sm text-center mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-700 hover:text-brand-700">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src={logo} alt="LipaClip" className="w-10 h-10 rounded-full object-cover border border-stone-200" />
            <span className="font-display text-brand-700 text-3xl font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
          </Link>
          <p className="text-stone-500 mt-2 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-stone-900 text-xl font-bold tracking-tight">Get started</h2>
            <button onClick={() => setRole('')} className="text-brand-700 hover:text-brand-700 text-xs font-semibold capitalize">
              Signing up as a {role === 'influencer' ? 'creator' : role}. Change
            </button>
          </div>

          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
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

          <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSignup() }} noValidate>
            <div>
              <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-full-name">Full name</label>
              <input id="f-full-name"
                type="text" name="name" autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-email">Email</label>
              <input id="f-email"
                type="email" name="email" autoComplete="email" inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <div>
  <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-phone-number">Phone number</label>
  <input id="f-phone-number"
    type="tel" name="phone" autoComplete="tel" inputMode="tel"
    value={phone}
    onChange={e => setPhone(e.target.value)}
    placeholder="e.g. 0771234567"
    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition"
  />
</div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-password">Password</label>
              <input id="f-password"
                type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-confirm-password">Confirm password</label>
              <input id="f-confirm-password"
                type={showPassword ? 'text' : 'password'} name="confirm-password" autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-stone-50 border text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none transition ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-300 focus:border-red-300'
                    : 'border-stone-200 focus:border-brand-500'
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-600 text-xs mt-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-700 text-xs mt-1">Passwords match</p>
              )}
            </div>

            <button type="button" onClick={() => setShowPassword(v => !v)} aria-pressed={showPassword} className="text-xs font-semibold text-stone-500 hover:text-stone-900 -mt-2">{showPassword ? 'Hide passwords' : 'Show passwords'}</button>

            {/* Terms and conditions */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 accent-brand-600 w-5 h-5 cursor-pointer flex-shrink-0"
              />
              <label htmlFor="terms" className="text-stone-500 text-sm cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" className="text-brand-700 hover:text-brand-700 underline">
  Terms and Conditions
</Link>
{' '}and{' '}
<Link to="/privacy" className="text-brand-700 hover:text-brand-700 underline">
  Privacy Policy
</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="gold-shimmer w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition text-sm"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-stone-500 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-700 hover:text-brand-700">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}