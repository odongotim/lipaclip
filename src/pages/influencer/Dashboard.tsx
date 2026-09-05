import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser, subscribeToTable } from '../../lib/supabase'
import InfluencerSidebar from '../../components/InfluencerSidebar'

type Submission = {
  id: string; video_url: string; views: number; earnings: number
  status: string; submitted_at: string
  campaigns: { id: string; title: string; type: string; pay_per_1k: number; status: string; budget: number; spent: number }
}

type CampaignSummary = {
  id: string; title: string; totalViews: number; totalEarnings: number; videos: number
  budget: number; spent: number
}

export default function InfluencerDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [campaignSummaries, setCampaignSummaries] = useState<CampaignSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    const unsub1 = subscribeToTable('submissions', loadData)
    const unsub2 = subscribeToTable('campaigns', loadData)
    return () => { unsub1(); unsub2() }
  }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof) { navigate('/login'); return }
    if (prof.role !== 'influencer') { navigate('/'); return }
    setProfile(prof)

    const { data: subs } = await supabase
  .from('submissions')
  .select('*, campaigns(id, title, type, pay_per_1k, status, budget, spent)')
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
          grouped[campId] = { id: campId, title: campTitle, totalViews: 0, totalEarnings: 0, videos: 0, budget: s.campaigns?.budget || 0, spent: s.campaigns?.spent || 0 }
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
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <InfluencerSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">My Dashboard</h1>
        <p className="text-stone-500 text-sm mb-8">Track your earnings across all videos</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Earned', value: fmtUGX(totalEarned), color: 'text-amber-600' },
            { label: 'Available to Withdraw', value: fmtUGX(availableForWithdraw), color: 'text-green-700' },
            { label: 'Total Views', value: totalViews.toLocaleString(), color: 'text-blue-700' },
            { label: 'Total Videos', value: submissions.length.toString(), color: 'text-purple-700' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-stone-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Campaign summaries */}
        <h2 className="text-stone-900 font-semibold mb-4">Earnings by Campaign</h2>
        {campaignSummaries.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <div className="flex justify-center mb-3"><svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
            <p className="text-stone-500 text-sm">No submissions yet. Browse campaigns and start earning!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {campaignSummaries.map(camp => (
              <div key={camp.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                {/* Campaign summary row */}
                <button
                  onClick={() => setExpanded(expanded === camp.id ? null : camp.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white transition"
                >
                  <div>
                    <h3 className="text-stone-900 font-semibold text-sm">{camp.title}</h3>
                    <div className="flex gap-4 mt-1 items-center flex-wrap">
                      <span className="text-stone-500 text-xs">{camp.videos} video{camp.videos > 1 ? 's' : ''}</span>
                      <span className="text-blue-700 text-xs">{camp.totalViews.toLocaleString()} views</span>
                      <span className="text-green-700 text-xs">{fmtUGX(camp.totalEarnings)}</span>
                      {camp.budget > 0 && camp.spent >= camp.budget && (
                        <span className="bg-amber-100 text-amber-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">Budget fully earned — extra views won't add more earnings</span>
                      )}
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-stone-500 transition-transform ${expanded === camp.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Individual videos */}
                {expanded === camp.id && (
                  <div className="border-t border-stone-200 px-5 pb-4">
                    <p className="text-stone-400 text-xs mb-3 pt-3">Individual videos:</p>
                    <div className="space-y-2">
                      {submissions
                        .filter(s => s.campaigns?.id === camp.id || (s as any).campaign_id === camp.id)
                        .map((sub, idx) => (
                          <div key={sub.id} className="bg-stone-100 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-stone-500 text-xs font-semibold">Video {idx + 1}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                sub.status === 'approved' ? 'bg-green-50 text-green-700' :
                                sub.status === 'rejected' ? 'bg-red-50 text-red-600' :
                                'bg-amber-100 text-amber-600'
                              }`}>{sub.status}</span>
                            </div>
                            <a href={sub.video_url} target="_blank" rel="noopener noreferrer"
                              className="text-amber-600 text-xs hover:underline truncate block mb-2">
                              {sub.video_url}
                            </a>
                            <div className="flex gap-4 text-xs">
                              <span className="text-blue-700">{(sub.views || 0).toLocaleString()} views</span>
                              <span className="text-green-700">{fmtUGX(sub.earnings || 0)}</span>
                              <span className="text-stone-400">{new Date(sub.submitted_at).toLocaleDateString()}</span>
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
