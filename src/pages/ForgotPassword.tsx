import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import AuthShell from '../components/AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setError('')
    const trimmed = email.trim()
    if (!trimmed) { setError('Enter the email you signed up with'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <p className="text-stone-600 text-sm mb-6" role="status">
          If an account exists for <strong>{email.trim()}</strong>, we sent a link to reset your password. It can take a minute to arrive, so check your spam folder too.
        </p>
        <Link to="/login" className="inline-block text-brand-700 hover:text-brand-800 text-sm font-semibold">Back to log in</Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Reset your password" subtitle="We will email you a link to choose a new one.">
      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit() }} noValidate>
        <div>
          <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-email">Email</label>
          <input id="f-email" name="email" type="email" autoComplete="email" inputMode="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition" />
        </div>
        <button type="submit" disabled={loading}
          className="gold-shimmer w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition text-sm">
          {loading ? 'Sending link...' : 'Send reset link'}
        </button>
      </form>
      <p className="text-stone-500 text-sm text-center mt-6">
        Remembered it? <Link to="/login" className="text-brand-700 hover:text-brand-800">Log in</Link>
      </p>
    </AuthShell>
  )
}
