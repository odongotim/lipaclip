import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import BrandNav from '../../components/BrandNav'
import PageLoader from '../../components/PageLoader'
import LogoutButton from '../../components/LogoutButton'

export default function BrandSettings() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [logoUrl, setLogoUrl] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'brand') { navigate('/'); return }
    setProfile(prof)
    setLogoUrl(prof.logo_url || '')
    setDisplayName(prof.display_name || '')
    setPhone(prof.phone || '')
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setError('')
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      logo_url: logoUrl || null,
      display_name: displayName,
      phone,
    }).eq('id', user.id)

    if (error) setError(error.message)
    else {
      setMessage('Settings saved successfully!')
      setProfile((prev: any) => ({ ...prev, logo_url: logoUrl, display_name: displayName }))
    }
    setSaving(false)
  }

  if (loading) return (
    <PageLoader />
  )

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <BrandNav userName={profile?.display_name} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-10">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Brand settings</h1>
        <p className="text-stone-500 text-sm mb-8">Manage your brand profile and logo</p>

        {message && <div role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}
        {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="max-w-xl space-y-6">
          {/* Logo preview */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h2 className="text-stone-900 font-semibold mb-4">Brand logo</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-brand-50 border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-brand-700">{(displayName || 'Your Brand').charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="text-stone-900 text-sm font-semibold">{displayName || 'Your Brand'}</p>
                <p className="text-stone-500 text-xs mt-1">This logo appears on all your campaign thumbnails</p>
              </div>
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-logo-url">Logo URL</label>
              <input id="f-logo-url" type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://example.com/your-logo.png"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition" />
              <p className="text-stone-400 text-xs mt-1">Use a direct image URL (JPG, PNG). Recommended: 200x200px square</p>
            </div>
          </div>

          {/* Profile */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h2 className="text-stone-900 font-semibold mb-4">Profile details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-brand-name">Brand name</label>
                <input id="f-brand-name" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition" />
              </div>
              <div>
                <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-phone-number">Phone number</label>
                <input id="f-phone-number" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 0771234567"
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm">
            {saving ? 'Saving...' : 'Save settings'}
          </button>

          <div className="pt-6 border-t border-stone-200">
            <LogoutButton />
          </div>
        </div>
      </main>
    </div>
  )
}
