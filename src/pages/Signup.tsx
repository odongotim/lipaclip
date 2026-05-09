import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-yellow-500 text-3xl font-bold">Lipa<span className="text-white">Clip</span></Link>
          <p className="text-gray-400 mt-2 text-sm">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-8">
          <h2 className="text-white text-xl font-bold mb-6">Get started</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
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
                      ? 'bg-yellow-500 text-black border-yellow-500'
                      : 'bg-black/40 text-gray-400 border-yellow-500/20 hover:border-yellow-500/50'
                  }`}
                >
                  {r === 'brand' ? '🏢 Brand' : '🎬 Influencer'}
                </button>
              ))}
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition"
              />
            </div>

            <div>
  <label className="text-gray-400 text-sm mb-1 block">Phone Number</label>
  <input
    type="tel"
    value={phone}
    onChange={e => setPhone(e.target.value)}
    placeholder="e.g. 0771234567"
    className="w-full bg-black/40 border border-gold-400/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold-500 transition"
  />
</div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-black/40 border text-white rounded-lg px-4 py-3 text-sm focus:outline-none transition ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500/50 focus:border-red-500'
                    : 'border-yellow-500/20 focus:border-yellow-500'
                }`}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>
              )}
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1 accent-yellow-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="terms" className="text-gray-400 text-sm cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" className="text-gold-400 hover:text-gold-300 underline">
  Terms and Conditions
</Link>
{' '}and{' '}
<Link to="/privacy" className="text-gold-400 hover:text-gold-300 underline">
  Privacy Policy
</Link>
              </label>
            </div>

            <button
              onClick={handleSignup}
              disabled={loading || !agreed}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition text-sm"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <p className="text-gray-400 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-500 hover:text-yellow-400">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}