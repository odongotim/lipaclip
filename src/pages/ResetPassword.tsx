import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { toast } from '../lib/toast'
import AuthShell from '../components/AuthShell'

type Status = 'checking' | 'ready' | 'invalid'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // The emailed link signs the person in with a short-lived recovery session.
    // Supabase reads it from the URL and fires PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStatus('ready')
    })
    supabase.auth.getSession().then(({ data }) => { if (data.session) setStatus('ready') })
    const timer = setTimeout(() => setStatus(prev => (prev === 'checking' ? 'invalid' : prev)), 3000)
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer) }
  }, [])

  const handleSubmit = async () => {
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    await supabase.auth.signOut()
    toast('Password updated. Log in with your new password.', 'success')
    navigate('/login')
  }

  if (status === 'checking') {
    return (
      <AuthShell title="Checking your link">
        <p className="text-stone-500 text-sm" role="status">One moment...</p>
      </AuthShell>
    )
  }

  if (status === 'invalid') {
    return (
      <AuthShell title="This link has expired">
        <p className="text-stone-600 text-sm mb-6">Reset links work once and expire after a short time. Request a new one and try again.</p>
        <Link to="/forgot-password" className="gold-shimmer inline-block bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">Get a new link</Link>
      </AuthShell>
    )
  }

  const mismatch = confirm.length > 0 && password !== confirm
  const inputCls = 'w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition'

  return (
    <AuthShell title="Choose a new password">
      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit() }} noValidate>
        <div>
          <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-new-password">New password</label>
          <input id="f-new-password" name="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
            value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-confirm-new-password">Confirm new password</label>
          <input id="f-confirm-new-password" name="confirm-new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password"
            value={confirm} onChange={e => setConfirm(e.target.value)} className={inputCls} />
          {mismatch && <p className="text-red-700 text-xs mt-1">Passwords do not match</p>}
        </div>
        <button type="button" onClick={() => setShowPassword(v => !v)} aria-pressed={showPassword}
          className="text-xs font-semibold text-stone-500 hover:text-stone-900">{showPassword ? 'Hide passwords' : 'Show passwords'}</button>
        <button type="submit" disabled={loading}
          className="gold-shimmer w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition text-sm">
          {loading ? 'Saving...' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  )
}
