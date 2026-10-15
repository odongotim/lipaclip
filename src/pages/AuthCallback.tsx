import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageLoader from '../components/PageLoader'

const homeFor = (role?: string | null) => (role === 'admin' ? '/admin' : role === 'brand' ? '/brand' : '/influencer')

// After Google redirects back here, we finish setting up the account: if this
// is a brand-new user we create their profile using the role they picked
// before leaving for Google (stashed in localStorage since OAuth redirects
// lose normal component state). Returning users are sent to the home page for
// their role (admin, brand or creator).
export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    // The session can take a moment to appear after the redirect, so wait briefly for it.
    const waitForSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) return session.user
      return new Promise<any>(resolve => {
        const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
          if (s?.user) { sub.subscription.unsubscribe(); resolve(s.user) }
        })
        setTimeout(() => { sub.subscription.unsubscribe(); resolve(null) }, 5000)
      })
    }

    const finish = async () => {
      const user = await waitForSession()
      if (cancelled) return
      if (!user) {
        setError('Sign-in did not complete. Please try again.')
        setTimeout(() => navigate('/login'), 2500)
        return
      }

      const { data: existingProfile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (existingProfile) { navigate(homeFor(existingProfile.role), { replace: true }); return }

      const pendingRole = localStorage.getItem('lipaclip_pending_role') === 'brand' ? 'brand' : 'influencer'
      localStorage.removeItem('lipaclip_pending_role')

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        role: pendingRole,
      })
      if (insertError) {
        setError(`We signed you in but could not set up your profile: ${insertError.message}`)
        return
      }
      navigate(homeFor(pendingRole), { replace: true })
    }
    finish()
    return () => { cancelled = true }
  }, [])

  if (!error) return <PageLoader />

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <p role="alert" className="text-red-700 text-sm text-center max-w-sm">{error}</p>
    </div>
  )
}
