import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-yellow-500 text-3xl font-bold">Lipa<span className="text-white">Clip</span></Link>
          <p className="text-gray-400 mt-2 text-sm">Welcome back</p>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-8">
          <h2 className="text-white text-xl font-bold mb-6">Login to your account</h2>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            <button onClick={handleLogin} disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-lg transition text-sm">
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          <p className="text-gray-400 text-sm text-center mt-6">
            Don't have an account? <Link to="/signup" className="text-yellow-500 hover:text-yellow-400">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
