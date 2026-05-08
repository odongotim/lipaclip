import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import InfluencerSidebar from '../../components/InfluencerSidebar'

type Submission = {
  id: string
  video_url: string
  views: number
  earnings: number
  status: string
  submitted_at: string
  campaigns: { title: string; type: string; pay_per_1k: number }
}

export default function InfluencerDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof) { navigate('/login'); return }
    if (prof.role !== 'influencer') { navigate('/'); return }
    setProfile(prof)

    const { data: subs } = await supabase
      .from('submissions')
      .select('*, campaigns(title, type, pay_per_1k)')
      .eq('influencer_id', user.id)
      .order('submitted_at', { ascending: false })

    if (subs) setSubmissions(subs as any)
    setLoading(false)
  }

  const totalEarned = submissions.reduce((a, s) => a + (s.earnings || 0), 0)
  const availableForWithdraw = submissions.filter(s => s.status === 'approved').reduce((a, s) => a + (s.earnings || 0), 0)
  const totalViews = submissions.reduce((a, s) => a + (s.views || 0), 0)
  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  if (loading) return (
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0a06] flex">
      <InfluencerSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">My Dashboard</h1>
        <p className="text-gray-400 text-sm mb-8">Track your earnings and submissions</p>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Earned', value: fmtUGX(totalEarned), color: 'text-yellow-500' },
            { label: 'Available to Withdraw', value: fmtUGX(availableForWithdraw), color: 'text-green-400' },
            { label: 'Total Views', value: totalViews.toLocaleString(), color: 'text-blue-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-gray-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-white font-semibold mb-4">My Submissions</h2>
        {submissions.length === 0 ? (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📹</div>
            <p className="text-gray-400 text-sm">No submissions yet. Browse campaigns and start earning!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-white font-semibold text-sm mb-1">{sub.campaigns?.title}</h3>
                    <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 text-xs hover:underline truncate block max-w-xs">{sub.video_url}</a>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${sub.status === 'approved' ? 'bg-green-500/20 text-green-400' : sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{sub.status}</span>
                </div>
                <div className="flex gap-6 mt-3">
                  <div><div className="text-white font-bold text-sm">{(sub.views || 0).toLocaleString()}</div><div className="text-gray-500 text-xs">views</div></div>
                  <div><div className="text-green-400 font-bold text-sm">{fmtUGX(sub.earnings || 0)}</div><div className="text-gray-500 text-xs">earned</div></div>
                  <div><div className="text-gray-300 font-bold text-sm">{fmtUGX(sub.campaigns?.pay_per_1k || 0)}</div><div className="text-gray-500 text-xs">per 1k views</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
