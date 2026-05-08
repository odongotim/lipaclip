import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

type Submission = {
  id: string; video_url: string; views: number; earnings: number; status: string
  submitted_at: string
  influencer_id: string
  campaign_id: string
  profiles: { display_name: string; email: string }
  campaigns: { title: string; pay_per_1k: number; budget: number; spent: number }
}

export default function Views() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newViews, setNewViews] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'admin') { navigate('/'); return }
    setProfile(prof)

    const { data: subs } = await supabase
      .from('submissions')
      .select('*, profiles(display_name, email), campaigns(title, pay_per_1k, budget, spent)')
      .order('submitted_at', { ascending: false })

    if (subs) setSubmissions(subs as any)
    setLoading(false)
  }

  const handleUpdateViews = async (sub: Submission) => {
    setSaving(true)
    const payPer1k = sub.campaigns?.pay_per_1k || 0
    const earnings = Math.round((newViews / 1000) * payPer1k)

    await supabase.from('submissions').update({
      views: newViews,
      earnings,
      last_checked_at: new Date().toISOString(),
    }).eq('id', sub.id)

    // Update campaign spent
    const { data: allSubs } = await supabase.from('submissions').select('earnings').eq('campaign_id', sub.campaign_id)
    const totalSpent = (allSubs || []).reduce((a: number, s: any) => a + (s.earnings || 0), 0)
    await supabase.from('campaigns').update({ spent: totalSpent }).eq('id', sub.campaign_id)

    setSubmissions(submissions.map(s => s.id === sub.id ? { ...s, views: newViews, earnings } : s))
    setMessage('Views updated successfully!')
    setTimeout(() => setMessage(''), 3000)
    setEditing(null)
    setSaving(false)
  }

  const handleApprove = async (id: string) => {
    await supabase.from('submissions').update({ status: 'approved' }).eq('id', id)
    setSubmissions(submissions.map(s => s.id === id ? { ...s, status: 'approved' } : s))
    setMessage('Submission approved!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleReject = async (id: string) => {
    await supabase.from('submissions').update({ status: 'rejected' }).eq('id', id)
    setSubmissions(submissions.map(s => s.id === id ? { ...s, status: 'rejected' } : s))
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  if (loading) return (
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0a06] flex">
      <AdminSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">Manage Views</h1>
        <p className="text-gray-400 text-sm mb-6">Manually update view counts for influencer submissions</p>

        {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}

        <div className="space-y-4">
          {submissions.map(sub => (
            <div key={sub.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <h3 className="text-white font-semibold text-sm">{sub.profiles?.display_name}</h3>
                  <div className="text-gray-500 text-xs mb-1">{sub.campaigns?.title}</div>
                  <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 text-xs hover:underline truncate block max-w-xs">{sub.video_url}</a>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${sub.status === 'approved' ? 'bg-green-500/20 text-green-400' : sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{sub.status}</span>
              </div>

              <div className="flex gap-6 mb-3">
                <div><div className="text-white font-bold text-sm">{(sub.views || 0).toLocaleString()}</div><div className="text-gray-500 text-xs">views</div></div>
                <div><div className="text-green-400 font-bold text-sm">{fmtUGX(sub.earnings || 0)}</div><div className="text-gray-500 text-xs">earned</div></div>
                <div><div className="text-gray-300 font-bold text-sm">{fmtUGX(sub.campaigns?.pay_per_1k || 0)}</div><div className="text-gray-500 text-xs">per 1k views</div></div>
              </div>

              {editing === sub.id ? (
                <div className="flex gap-2 items-center mt-2">
                  <input type="number" value={newViews} onChange={e => setNewViews(Number(e.target.value))}
                    className="flex-1 bg-black/40 border border-yellow-500/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                    placeholder="Enter view count" />
                  <button onClick={() => handleUpdateViews(sub)} disabled={saving}
                    className="bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50">
                    {saving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="bg-red-500/20 text-red-400 text-xs font-semibold px-3 py-2 rounded-lg">Cancel</button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap mt-2">
                  <button onClick={() => { setEditing(sub.id); setNewViews(sub.views || 0) }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 transition">
                    📊 Update Views
                  </button>
                  {sub.status === 'pending' && <>
                    <button onClick={() => handleApprove(sub.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition">✓ Approve</button>
                    <button onClick={() => handleReject(sub.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition">Reject</button>
                  </>}
                </div>
              )}
            </div>
          ))}
          {submissions.length === 0 && <div className="text-center py-12"><p className="text-gray-400">No submissions yet</p></div>}
        </div>
      </main>
    </div>
  )
}
