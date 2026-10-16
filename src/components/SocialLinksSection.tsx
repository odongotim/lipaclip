import { useState } from 'react'
import { supabase, getCurrentUser } from '../lib/supabase'

type Props = {
  profile: any
  /** Called after a successful save so the page can refresh its verification status. */
  onSaved: (patch: Record<string, unknown>) => void
}

const FIELDS = [
  { key: 'tiktok_url', id: 'f-tiktok-url', label: 'TikTok', placeholder: 'https://www.tiktok.com/@username' },
  { key: 'instagram_url', id: 'f-instagram-url', label: 'Instagram', placeholder: 'https://www.instagram.com/username' },
  { key: 'youtube_url', id: 'f-youtube-url', label: 'YouTube', placeholder: 'https://www.youtube.com/@channel' },
  { key: 'x_url', id: 'f-x-url', label: 'X (Twitter)', placeholder: 'https://x.com/username' },
] as const

/** The creator's social account links and their verification status. Shown on the Profile page. */
export default function SocialLinksSection({ profile, onSaved }: Props) {
  const [values, setValues] = useState<Record<string, string>>({
    tiktok_url: profile?.tiktok_url || '',
    instagram_url: profile?.instagram_url || '',
    youtube_url: profile?.youtube_url || '',
    x_url: profile?.x_url || '',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isVerified = profile?.is_verified || profile?.tiktok_verified

  const handleSave = async () => {
    setSaving(true); setMessage(''); setError('')
    const user = await getCurrentUser()
    if (!user) { setSaving(false); return }

    if (!FIELDS.some(f => values[f.key].trim())) {
      setError('Add at least one social media link')
      setSaving(false)
      return
    }

    const patch = {
      tiktok_url: values.tiktok_url.trim() || null,
      instagram_url: values.instagram_url.trim() || null,
      youtube_url: values.youtube_url.trim() || null,
      x_url: values.x_url.trim() || null,
      // Changing links sends the account back for admin verification
      is_verified: false,
      tiktok_verified: false,
    }
    const { error: err } = await supabase.from('profiles').update(patch).eq('id', user.id)
    if (err) setError(err.message)
    else {
      setMessage('Social links saved. An admin will verify your account shortly.')
      onSaved(patch)
    }
    setSaving(false)
  }

  return (
    <section id="social-accounts" className="scroll-mt-20 mb-10 max-w-xl" aria-labelledby="social-heading">
      <h2 id="social-heading" className="font-display text-stone-900 text-lg font-bold mb-1">Social accounts</h2>
      <p className="text-stone-500 text-sm mb-4">Add the accounts you post from. An admin verifies them before you can submit videos or appear to brands.</p>

      {isVerified ? (
        <div role="status" className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-4">
          <div className="text-green-800 font-semibold text-sm">Your account is verified</div>
          <div className="text-stone-600 text-xs mt-0.5">You can submit videos to campaigns.</div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4">
          <div className="text-brand-800 font-semibold text-sm">Waiting for admin verification</div>
          <div className="text-stone-600 text-xs mt-0.5">Add your links below. You can submit videos once an admin verifies them.</div>
        </div>
      )}

      {message && <div role="status" className="bg-green-50 border border-green-200 text-green-800 text-sm px-4 py-3 rounded-lg mb-4">{message}</div>}
      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
        {FIELDS.map(f => (
          <div key={f.key}>
            <label htmlFor={f.id} className="text-stone-900 font-semibold text-sm flex items-center gap-2 mb-1.5">
              {f.label}
              {isVerified && values[f.key] && <span className="bg-green-50 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">Verified</span>}
            </label>
            <input id={f.id} type="url" inputMode="url" autoComplete="off" value={values[f.key]}
              onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition" />
          </div>
        ))}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm">
          {saving ? 'Saving...' : 'Save social links'}
        </button>
      </div>
    </section>
  )
}
