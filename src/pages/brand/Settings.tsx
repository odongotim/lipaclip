import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import BrandSidebar from '../../components/BrandSidebar'

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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Brand Settings</h1>
        <p className="text-stone-500 text-sm mb-8">Manage your brand profile and logo</p>

        {message && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="max-w-xl space-y-6">
          {/* Logo preview */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h2 className="text-stone-900 font-semibold mb-4">Brand Logo</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-stone-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl
                  ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-amber-600">{(displayName || 'Your Brand').charAt(0).toUpperCase()}</span>
                }
              </div>
              <div>
                <p className="text-stone-900 text-sm font-semibold">{displayName || 'Your Brand'}</p>
                <p className="text-stone-500 text-xs mt-1">This logo appears on all your campaign thumbnails</p>
              </div>
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Logo URL</label>
              <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://example.com/your-logo.png"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
              <p className="text-stone-400 text-xs mt-1">Use a direct image URL (JPG, PNG). Recommended: 200x200px square</p>
            </div>
          </div>

          {/* Profile */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h2 className="text-stone-900 font-semibold mb-4">Profile Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-stone-500 text-sm mb-1 block">Brand Name</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
              </div>
              <div>
                <label className="text-stone-500 text-sm mb-1 block">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 0771234567"
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
              </div>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}
