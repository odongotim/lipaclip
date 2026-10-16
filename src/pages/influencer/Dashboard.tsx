import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser, subscribeToTable } from '../../lib/supabase'
import CreatorNav from '../../components/CreatorNav'
import PageLoader from '../../components/PageLoader'
import StatCard from '../../components/StatCard'
import EmptyState from '../../components/EmptyState'
import StatusBadge from '../../components/StatusBadge'
import { timeAgo } from '../../lib/timeAgo'

type Submission = {
  id: string; video_url: string; views: number; earnings: number
  status: string; submitted_at: string; last_checked_at?: string | null
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
    <PageLoader />
  )

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <CreatorNav userName={profile?.display_name} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-10">
        <h1 className="font-display text-stone-900 text-2xl font-extrabold tracking-tight mb-1">My dashboard</h1>
        <p className="text-stone-500 text-sm mb-8">Track your earnings across all videos</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard label="Total earned" value={fmtUGX(totalEarned)} tone="money" />
          <StatCard label="Available to withdraw" value={fmtUGX(availableForWithdraw)} tone="good" />
          <StatCard label="Total views" value={totalViews.toLocaleString()} />
          <StatCard label="Total videos" value={submissions.length.toString()} />
        </div>

        {/* Campaign summaries */}
        <h2 className="text-stone-900 font-semibold mb-4">Earnings by Campaign</h2>
        {campaignSummaries.length === 0 ? (
          <EmptyState title="No videos submitted yet" description="Pick a live campaign, post it on your channel and submit the link. Earnings show up here." actionLabel="Browse campaigns" actionTo="/influencer" />
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
                        <span className="bg-brand-100 text-brand-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">Budget fully earned — extra views won't add more earnings</span>
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
                              <StatusBadge status={sub.status} />
                            </div>
                            <a href={sub.video_url} target="_blank" rel="noopener noreferrer"
                              className="text-brand-700 text-xs hover:underline break-all block mb-2">
                              {sub.video_url}
                            </a>
                            <div className="flex gap-4 text-xs">
                              <span className="text-blue-700">{(sub.views || 0).toLocaleString()} views</span>
                              <span className="text-green-700">{fmtUGX(sub.earnings || 0)}</span>
                              <span className="text-stone-400">{new Date(sub.submitted_at).toLocaleDateString()}</span>
                            {sub.status === 'approved' && sub.last_checked_at && <span className="text-stone-400">Views updated {timeAgo(sub.last_checked_at)}</span>}
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
