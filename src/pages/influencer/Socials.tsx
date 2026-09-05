import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import InfluencerSidebar from '../../components/InfluencerSidebar'

export default function Socials() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [tiktok, setTiktok] = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube] = useState('')
  const [x, setX] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof) { navigate('/'); return }
    setProfile(prof)
    setTiktok(prof.tiktok_url || '')
    setInstagram(prof.instagram_url || '')
    setYoutube(prof.youtube_url || '')
    setX(prof.x_url || '')
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    setError('')
    const user = await getCurrentUser()
    if (!user) return

    const hasAtLeastOne = tiktok || instagram || youtube || x
    if (!hasAtLeastOne) {
      setError('Please add at least one social media link')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('profiles').update({
      tiktok_url: tiktok || null,
      instagram_url: instagram || null,
      youtube_url: youtube || null,
      x_url: x || null,
      is_verified: false,
      tiktok_verified: false,
    }).eq('id', user.id)

    if (error) setError(error.message)
    else {
      setMessage('Social links saved! Admin will verify your profile shortly.')
      setProfile((prev: any) => ({
        ...prev,
        tiktok_url: tiktok, instagram_url: instagram,
        youtube_url: youtube, x_url: x,
        is_verified: false, tiktok_verified: false,
      }))
    }
    setSaving(false)
  }

  const isVerified = profile?.is_verified || profile?.tiktok_verified

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <InfluencerSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">My Socials</h1>
        <p className="text-stone-500 text-sm mb-8">Add your social media links. Admin will verify them.</p>

        {message && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

        {/* Verification status */}
        {isVerified ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="text-green-700 font-semibold text-sm">Your profile is verified!</div>
              <div className="text-stone-500 text-xs mt-0.5">You can now submit videos to campaigns</div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="text-amber-600 font-semibold text-sm">Pending admin verification</div>
              <div className="text-stone-500 text-xs mt-0.5">Add your links below and wait for admin to verify</div>
            </div>
          </div>
        )}

        <div className="max-w-xl space-y-4">
          {/* TikTok */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-stone-900 font-semibold text-sm">TikTok</span>
              {isVerified && tiktok && <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">Verified</span>}
            </div>
            <input type="url" value={tiktok} onChange={e => setTiktok(e.target.value)}
              placeholder="https://www.tiktok.com/@username"
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
          </div>

          {/* Instagram */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-stone-900 font-semibold text-sm">Instagram</span>
              {isVerified && instagram && <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">Verified</span>}
            </div>
            <input type="url" value={instagram} onChange={e => setInstagram(e.target.value)}
              placeholder="https://www.instagram.com/username"
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
          </div>

          {/* YouTube */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-stone-900 font-semibold text-sm">YouTube</span>
              {isVerified && youtube && <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">Verified</span>}
            </div>
            <input type="url" value={youtube} onChange={e => setYoutube(e.target.value)}
              placeholder="https://www.youtube.com/@channel"
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
          </div>

          {/* X */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-stone-900 font-semibold text-sm">X (Twitter)</span>
              {isVerified && x && <span className="bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded-full">Verified</span>}
            </div>
            <input type="url" value={x} onChange={e => setX(e.target.value)}
              placeholder="https://x.com/username"
              className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm">
            {saving ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>
      </main>
    </div>
  )
}
