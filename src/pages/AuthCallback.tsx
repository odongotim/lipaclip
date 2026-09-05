import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// After Google redirects back here, we finish setting up the account: if this
// is a brand-new user we create their profile using the role they picked
// before leaving for Google (stashed in localStorage since OAuth redirects
// lose normal component state). Returning users just get routed to their
// existing role's home page.
export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const finish = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setError('Sign-in did not complete. Please try again.')
        setTimeout(() => navigate('/login'), 2500)
        return
      }

      const user = session.user
      const { data: existingProfile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()

      if (existingProfile) {
        navigate(existingProfile.role === 'brand' ? '/brand' : '/influencer')
        return
      }

      const pendingRole = localStorage.getItem('lipaclip_pending_role') || 'influencer'
      localStorage.removeItem('lipaclip_pending_role')

      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
        role: pendingRole,
      })

      navigate(pendingRole === 'brand' ? '/brand' : '/influencer')
    }
    finish()
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : (
          <>
            <svg className="w-8 h-8 text-amber-600 mx-auto mb-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <p className="text-stone-500 text-sm">Finishing sign-in...</p>
          </>
        )}
      </div>
    </div>
  )
}
