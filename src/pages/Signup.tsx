import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo.jpg'

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') || 'influencer'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState(defaultRole)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    setError('')
    if (!name) { setError('Please enter your full name'); return }
    if (!email) { setError('Please enter your email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (!agreed) { setError('Please accept the terms and conditions'); return }
    
    setLoading(true)
    
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    
    // Create profile
    await supabase.from('profiles').insert({
      id: data.user!.id,
      email,
      display_name: name,
      phone,
      role,
    })

    if (role === 'brand') navigate('/brand')
    else navigate('/influencer')
    setLoading(false)
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
          <h2 className="font-display text-stone-900 text-xl font-bold mb-6 tracking-tight">Get started</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-3">
              {['brand', 'influencer'].map(r => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-lg text-sm font-semibold border transition capitalize ${
                    role === r
                      ? 'bg-amber-600 text-white border-amber-500'
                      : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-amber-400'
                  }`}
                >
                  {r === 'brand' ? 'Brand' : 'Influencer'}
                </button>
              ))}
            </div>

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