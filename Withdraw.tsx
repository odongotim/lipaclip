import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

type Influencer = {
  id: string; display_name: string; email: string
  tiktok_url: string; tiktok_verified: boolean; tiktok_followers: number; tiktok_engagement: number
  instagram_url: string; youtube_url: string; x_url: string
}

export default function Verifications() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'admin') { navigate('/'); return }
    setProfile(prof)
    const { data: infs } = await supabase.from('profiles').select('*').eq('role', 'influencer').order('created_at', { ascending: false })
    if (infs) setInfluencers(infs)
    setLoading(false)
  }

  const handleVerify = async (id: string, verified: boolean) => {
    await supabase.from('profiles').update({ tiktok_verified: !verified }).eq('id', id)
    setInfluencers(influencers.map(i => i.id === id ? { ...i, tiktok_verified: !verified } : i))
    setMessage(`Influencer ${!verified ? 'verified' : 'unverified'} successfully!`)
    setTimeout(() => setMessage(''), 3000)
  }

  const startEdit = (inf: Influencer) => {
    setEditing(inf.id)
    setEditData({
      tiktok_url: inf.tiktok_url || '',
      instagram_url: inf.instagram_url || '',
      youtube_url: inf.youtube_url || '',
      x_url: inf.x_url || '',
      tiktok_followers: inf.tiktok_followers || 0,
      tiktok_engagement: inf.tiktok_engagement || 0,
    })
  }

  const handleSaveEdit = async (id: string) => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update(editData).eq('id', id)
    if (!error) {
      setInfluencers(influencers.map(i => i.id === id ? { ...i, ...editData } : i))
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
    setEditing(null)
    setSaving(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0a06] flex">
      <AdminSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">Verifications</h1>
        <p className="text-gray-400 text-sm mb-6">Verify and manage influencer social media profiles</p>

        {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 mb-6">
          <div className="text-yellow-400 font-semibold text-sm">{influencers.filter(i => !i.tiktok_verified).length} pending verification</div>
        </div>

        <div className="space-y-4">
          {influencers.map(inf => (
            <div key={inf.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <h3 className="text-white font-semibold text-sm">{inf.display_name}</h3>
                  <div className="text-gray-500 text-xs">{inf.email}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleVerify(inf.id, inf.tiktok_verified)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${inf.tiktok_verified ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'}`}>
                    {inf.tiktok_verified ? 'Unverify' : '✓ Verify'}
                  </button>
                  <button onClick={() => editing === inf.id ? setEditing(null) : startEdit(inf)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition">
                    {editing === inf.id ? 'Cancel' : '✏️ Edit'}
                  </button>
                </div>
              </div>

              {editing === inf.id ? (
                <div className="space-y-3 mt-3 border-t border-yellow-900/30 pt-3">
                  <h4 className="text-white text-xs font-semibold">Edit Social Links & Stats</h4>
                  {[
                    { label: '🎵 TikTok URL', key: 'tiktok_url', type: 'url' },
                    { label: '📸 Instagram URL', key: 'instagram_url', type: 'url' },
                    { label: '▶️ YouTube URL', key: 'youtube_url', type: 'url' },
                    { label: '🐦 X URL', key: 'x_url', type: 'url' },
                    { label: '👥 TikTok Followers', key: 'tiktok_followers', type: 'number' },
                    { label: '📊 Engagement Rate (%)', key: 'tiktok_engagement', type: 'number' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-gray-400 text-xs mb-1 block">{field.label}</label>
                      <input
                        type={field.type}
                        value={editData[field.key] || ''}
                        onChange={e => setEditData({ ...editData, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                        className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-yellow-500 transition"
                      />
                    </div>
                  ))}
                  <button onClick={() => handleSaveEdit(inf.id)} disabled={saving}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-2 rounded-lg transition text-sm">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  {inf.tiktok_url && <div className="flex items-center gap-2"><span>🎵</span><a href={inf.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline truncate">{inf.tiktok_url}</a><span className={inf.tiktok_verified ? 'text-green-400' : 'text-yellow-400'}>{inf.tiktok_verified ? '✓ Verified' : 'Pending'}</span></div>}
                  {inf.instagram_url && <div className="text-gray-400">📸 {inf.instagram_url}</div>}
                  {inf.youtube_url && <div className="text-gray-400">▶️ {inf.youtube_url}</div>}
                  {inf.x_url && <div className="text-gray-400">🐦 {inf.x_url}</div>}
                  {inf.tiktok_followers > 0 && <div className="text-gray-400 mt-1">👥 {inf.tiktok_followers.toLocaleString()} followers · 📊 {inf.tiktok_engagement}% engagement</div>}
                  {!inf.tiktok_url && !inf.instagram_url && !inf.youtube_url && <div className="text-gray-600 italic">No social links added yet</div>}
                </div>
              )}
            </div>
          ))}
          {influencers.length === 0 && <div className="text-center py-12"><p className="text-gray-400">No influencers found</p></div>}
        </div>
      </main>
    </div>
  )
}
