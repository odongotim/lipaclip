import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import InfluencerSidebar from '../../components/InfluencerSidebar'

type Submission = {
  id: string; video_url: string; views: number; earnings: number
  status: string; submitted_at: string
  campaigns: { id: string; title: string; type: string; pay_per_1k: number; status: string }
}

type CampaignSummary = {
  id: string; title: string; totalViews: number; totalEarnings: number; videos: number
}

export default function InfluencerDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [campaignSummaries, setCampaignSummaries] = useState<CampaignSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

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
  .select('*, campaigns(id, title, type, pay_per_1k, status)')
  .eq('influencer_id', user.id)
  .order('submitted_at', { ascending: false })

    if (subs) {
      setSubmissions(subs as any)

      // Group by campaign
      const grouped: Record<string, CampaignSummary> = {}
      subs.forEach((s: any) => {
        const campId = s.campaigns?.id || s.campaign_id
        const campTitle = s.campaigns?.title || 'Unknown'
        if (!grouped[campId]) {
          grouped[campId] = { id: campId, title: campTitle, totalViews: 0, totalEarnings: 0, videos: 0 }
        }
        grouped[campId].totalViews += s.views || 0
        grouped[campId].totalEarnings += s.earnings || 0
        grouped[campId].videos += 1
      })
      setCampaignSummaries(Object.values(grouped))
    }

    setLoading(false)
  }

  const totalEarned = submissions.reduce((a, s) => a + (s.earnings || 0), 0)
  const availableForWithdraw = submissions
  .filter(s => s.status === 'approved' && s.campaigns?.status === 'completed')
  .reduce((a, s) => a + (s.earnings || 0), 0)
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
        <p className="text-gray-400 text-sm mb-8">Track your earnings across all videos</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Earned', value: fmtUGX(totalEarned), color: 'text-yellow-500' },
            { label: 'Available to Withdraw', value: fmtUGX(availableForWithdraw), color: 'text-green-400' },
            { label: 'Total Views', value: totalViews.toLocaleString(), color: 'text-blue-400' },
            { label: 'Total Videos', value: submissions.length.toString(), color: 'text-purple-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-gray-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Campaign summaries */}
        <h2 className="text-white font-semibold mb-4">Earnings by Campaign</h2>
        {campaignSummaries.length === 0 ? (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📹</div>
            <p className="text-gray-400 text-sm">No submissions yet. Browse campaigns and start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaignSummaries.map(camp => (
              <div key={camp.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl overflow-hidden">
                {/* Campaign summary row */}
                <button
                  onClick={() => setExpanded(expanded === camp.id ? null : camp.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-yellow-500/5 transition"
                >
                  <div>
                    <h3 className="text-white font-semibold text-sm">{camp.title}</h3>
                    <div className="flex gap-4 mt-1">
                      <span className="text-gray-400 text-xs">🎬 {camp.videos} video{camp.videos > 1 ? 's' : ''}</span>
                      <span className="text-blue-400 text-xs">👁 {camp.totalViews.toLocaleString()} views</span>
                      <span className="text-green-400 text-xs">💰 {fmtUGX(camp.totalEarnings)}</span>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm">{expanded === camp.id ? '▲' : '▼'}</span>
                </button>

                {/* Individual videos */}
                {expanded === camp.id && (
                  <div className="border-t border-yellow-900/20 px-5 pb-4">
                    <p className="text-gray-500 text-xs mb-3 pt-3">Individual videos:</p>
                    <div className="space-y-2">
                      {submissions
                        .filter(s => s.campaigns?.id === camp.id || (s as any).campaign_id === camp.id)
                        .map((sub, idx) => (
                          <div key={sub.id} className="bg-black/20 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-400 text-xs font-semibold">Video {idx + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                sub.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>{sub.status}</span>
                            </div>
                            <a href={sub.video_url} target="_blank" rel="noopener noreferrer"
                              className="text-yellow-500 text-xs hover:underline truncate block mb-2">
                              {sub.video_url}
                            </a>
                            <div className="flex gap-4 text-xs">
                              <span className="text-blue-400">👁 {(sub.views || 0).toLocaleString()} views</span>
                              <span className="text-green-400">💰 {fmtUGX(sub.earnings || 0)}</span>
                              <span className="text-gray-500">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
