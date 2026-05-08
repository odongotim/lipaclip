import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
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
    const { data: { user } } = await supabase.auth.getUser()
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('profiles').update({
      tiktok_url: tiktok || null,
      instagram_url: instagram || null,
      youtube_url: youtube || null,
      x_url: x || null,
      tiktok_verified: false,
    }).eq('id', user.id)

    if (error) setError(error.message)
    else {
      setMessage('Social links saved! Admin will review and verify your profile.')
      setProfile((prev: any) => ({ ...prev, tiktok_url: tiktok, instagram_url: instagram, youtube_url: youtube, x_url: x, tiktok_verified: false }))
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0a06] flex">
      <InfluencerSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">My Socials</h1>
        <p className="text-gray-400 text-sm mb-8">Add your social media links. Admin will verify them manually.</p>

        {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

        {/* Verification status banner */}
        {profile?.tiktok_verified ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-green-400 font-semibold text-sm">Your profile is verified!</div>
              <div className="text-gray-400 text-xs mt-0.5">
                {profile.tiktok_followers?.toLocaleString()} followers · {profile.tiktok_engagement}% engagement
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="text-yellow-400 font-semibold text-sm">Pending admin verification</div>
              <div className="text-gray-400 text-xs mt-0.5">Add your social links below and our team will verify them shortly</div>
            </div>
          </div>
        )}

        <div className="max-w-xl space-y-4">
          {/* TikTok */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎵</span>
              <span className="text-white font-semibold text-sm">TikTok</span>
              {profile?.tiktok_verified && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full">✓ Verified</span>}
            </div>
            <input type="url" value={tiktok} onChange={e => setTiktok(e.target.value)}
              placeholder="https://www.tiktok.com/@username"
              className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
          </div>

          {/* Instagram */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📸</span>
              <span className="text-white font-semibold text-sm">Instagram</span>
            </div>
            <input type="url" value={instagram} onChange={e => setInstagram(e.target.value)}
              placeholder="https://www.instagram.com/username"
              className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
          </div>

          {/* YouTube */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">▶️</span>
              <span className="text-white font-semibold text-sm">YouTube</span>
            </div>
            <input type="url" value={youtube} onChange={e => setYoutube(e.target.value)}
              placeholder="https://www.youtube.com/@channel"
              className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
          </div>

          {/* X */}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🐦</span>
              <span className="text-white font-semibold text-sm">X (Twitter)</span>
            </div>
            <input type="url" value={x} onChange={e => setX(e.target.value)}
              placeholder="https://x.com/username"
              className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition text-sm">
            {saving ? 'Saving...' : 'Save Social Links'}
          </button>
        </div>
      </main>
    </div>
  )
}
