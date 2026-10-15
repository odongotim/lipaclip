import { useEffect, useState } from 'react'
import { supabase, getCurrentUser, subscribeToTable } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import BrandSidebar from '../../components/BrandSidebar'
import PageLoader from '../../components/PageLoader'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'

type Campaign = {
  id: string; title: string; type: string; budget: number; spent: number
  status: string; thumbnail_url: string | null; platforms: string[]
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', x: 'X'
}

export default function BrandDashboard() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState({ totalSpent: 0, totalBudget: 0, activeCampaigns: 0, completedCampaigns: 0 })
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Record<string, any[]>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState('')

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
    if (prof?.role !== 'brand') { navigate('/'); return }
    setProfile(prof)

    const { data: camps } = await supabase.from('campaigns').select('*').eq('brand_id', user.id).neq('status', 'failed').order('created_at', { ascending: false })
    if (camps) {
      setCampaigns(camps)
      setStats({
        totalSpent: camps.reduce((a: number, c: any) => a + (c.spent || 0), 0),
        totalBudget: camps.reduce((a: number, c: any) => a + (c.budget || 0), 0),
        activeCampaigns: camps.filter((c: any) => c.status === 'live').length,
        completedCampaigns: camps.filter((c: any) => c.status === 'completed').length,
      })

      // Load submissions for each campaign
      for (const camp of camps) {
        const { data: subs } = await supabase
  .from('submissions')
  .select('*, profiles(display_name)')
  .eq('campaign_id', camp.id)
  .order('submitted_at', { ascending: false })
        if (subs) setSubmissions(prev => ({ ...prev, [camp.id]: subs }))
      }
    }
    setLoading(false)
  }

  const handleDelete = async (campId: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    await supabase.from('deposits').delete().eq('campaign_id', campId)
    await supabase.from('submissions').delete().eq('campaign_id', campId)
    await supabase.from('campaigns').delete().eq('id', campId)
    setCampaigns(campaigns.filter(c => c.id !== campId))
  }

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`
  const totalViews = Object.values(submissions).flat().reduce((a: number, s: any) => a + (s.views || 0), 0)
  const pendingReview = Object.values(submissions).flat().filter((x: any) => x.status === 'pending').length
  const costPer1k = totalViews > 0 ? Math.round((stats.totalSpent / totalViews) * 1000) : 0

  const reviewSubmission = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !confirm('Reject this video? Its earnings are removed and the budget is freed up.')) return
    setReviewing(id)
    setReviewError('')
    const { error } = await supabase.rpc('brand_review_submission', { p_submission_id: id, p_status: status })
    if (error) setReviewError(error.message || 'Could not update this video')
    else await loadData()
    setReviewing(null)
  }

  if (loading) return (
    <PageLoader />
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="font-display text-stone-900 text-2xl font-extrabold tracking-tight mb-1">Dashboard</h1>
            <p className="text-stone-500 text-sm">Welcome back, {profile?.display_name}</p>
          </div>
          <Link to="/brand/new-campaign" className="gold-shimmer bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">New campaign</Link>
        </div>
        {reviewError && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">{reviewError}</div>}

        {pendingReview > 0 && (
          <div role="status" className="bg-brand-50 border border-brand-200 rounded-2xl px-4 py-3 mb-6 text-sm text-stone-800">
            <span className="font-semibold">{pendingReview} video{pendingReview > 1 ? 's' : ''} waiting for your review.</span>{' '}
            Approve or reject {pendingReview > 1 ? 'them' : 'it'} in the campaign below.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
          <StatCard label="Total budget" value={fmtUGX(stats.totalBudget)} tone="money" />
          <StatCard label="Total spent" value={fmtUGX(stats.totalSpent)} />
          <StatCard label="Unspent" value={fmtUGX(stats.totalBudget - stats.totalSpent)} />
          <StatCard label="Active campaigns" value={stats.activeCampaigns.toString()} />
          <StatCard label="Total views" value={totalViews.toLocaleString()} />
          <StatCard label="Average cost per 1,000 views" value={costPer1k > 0 ? fmtUGX(costPer1k) : 'No views yet'} tone="good" />
        </div>

        {/* Campaigns */}
        <h2 className="font-display text-stone-900 font-bold text-lg mb-4">Your campaigns</h2>

        {campaigns.length === 0 ? (
          <EmptyState title="No campaigns yet" description="Set a budget and a rate per 1,000 views, and creators can start posting." actionLabel="Create your first campaign" actionTo="/brand/new-campaign" />
        ) : (
          <div className="space-y-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-white border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {camp.thumbnail_url
                      ? <img src={camp.thumbnail_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      : <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-stone-900 font-semibold text-sm">{camp.title}</h3>
                      {camp.status === 'pending' ? <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">Awaiting payment</span> : <StatusBadge status={camp.status} />}
                    </div>

                    {/* Platform icons */}
                    {camp.platforms && (
                      <div className="flex gap-1 mb-1">
                        {camp.platforms.map(p => <span key={p} className="text-xs bg-brand-50 text-brand-800 px-2 py-0.5 rounded-full">{PLATFORM_LABELS[p] || p}</span>)}
                      </div>
                    )}

                    <div className="text-stone-500 text-xs mb-2 capitalize">{camp.type} campaign</div>
                    <div className="w-full bg-stone-200 rounded-full h-1.5" role="progressbar" aria-label="Budget spent" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(((camp.spent || 0) / camp.budget) * 100, 100))}>
                      <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${Math.min(((camp.spent || 0) / camp.budget) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-stone-400 mt-1">
                      <span>{fmtUGX(camp.spent || 0)} spent</span>
                      <span>{fmtUGX(camp.budget)} budget</span>
                    </div>
                  </div>

                  <button onClick={() => handleDelete(camp.id)} aria-label={`Delete ${camp.title}`} title="Delete campaign" className="text-red-600 hover:text-red-700 flex-shrink-0 p-2 -m-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg></button>
                </div>

                {/* Campaign stats and submissions */}
{submissions[camp.id] && (
  <div className="mt-4 border-t border-stone-200 pt-3">
    {/* Summary stats */}
    <div className="grid grid-cols-3 gap-3 mb-3">
      {[
        {
          label: 'Influencers',
          value: new Set(submissions[camp.id].map((s: any) => s.influencer_id)).size
        },
        {
          label: 'Videos posted',
          value: submissions[camp.id].length
        },
        {
          label: 'Total views',
          value: submissions[camp.id].reduce((a: number, s: any) => a + (s.views || 0), 0).toLocaleString()
        },
      ].map(stat => (
        <div key={stat.label} className="bg-stone-100 rounded-lg p-2 text-center">
          <div className="text-brand-700 font-bold text-sm">{stat.value}</div>
          <div className="text-stone-400 text-xs">{stat.label}</div>
        </div>
      ))}
    </div>

    {/* Per influencer breakdown */}
    {submissions[camp.id].length > 0 && (() => {
      // Group by influencer
      const byInfluencer: Record<string, any> = {}
      submissions[camp.id].forEach((sub: any) => {
        const id = sub.influencer_id
        if (!byInfluencer[id]) {
          byInfluencer[id] = {
            name: sub.profiles?.display_name || 'Unknown',
            videos: [],
            totalViews: 0,
            totalEarnings: 0,
          }
        }
        byInfluencer[id].videos.push(sub)
        byInfluencer[id].totalViews += sub.views || 0
        byInfluencer[id].totalEarnings += sub.earnings || 0
      })

      return (
        <div className="space-y-2">
          <p className="text-stone-400 text-xs font-semibold mb-2">Influencer Breakdown:</p>
          {Object.values(byInfluencer).map((inf: any, idx: number) => (
            <div key={idx} className="bg-stone-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-stone-900 text-xs font-semibold">{inf.name}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-stone-500">{inf.videos.length ? Math.round(inf.totalViews / inf.videos.length).toLocaleString() : 0} avg/video</span>
                  <span className="text-blue-700">{inf.totalViews.toLocaleString()} views</span>
                  <span className="text-green-700">{fmtUGX(inf.totalEarnings)}</span>
                </div>
              </div>
              <div className="space-y-1">
                {inf.videos.map((sub: any, vidIdx: number) => (
                  <div key={sub.id} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 py-1">
                    <span className="text-stone-500 text-xs">Video {vidIdx + 1}</span>
                    <StatusBadge status={sub.status} />
                    <button onClick={() => copyLink(sub.video_url, sub.id)} className="ml-auto text-stone-500 hover:text-brand-700 text-xs flex items-center gap-1 p-1">
                      {copied === sub.id ? 'Copied' : 'Copy link'}
                    </button>
                    <a href={sub.video_url} target="_blank" rel="noopener noreferrer"
                      className="basis-full text-brand-700 text-xs hover:underline break-all">
                      {sub.video_url}
                    </a>
                    {sub.status === 'pending' && (
                      <div className="basis-full flex gap-2">
                        <button disabled={reviewing === sub.id} onClick={() => reviewSubmission(sub.id, 'approved')}
                          className="text-xs font-semibold bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg">Approve</button>
                        <button disabled={reviewing === sub.id} onClick={() => reviewSubmission(sub.id, 'rejected')}
                          className="text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 px-4 py-2 rounded-lg">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    })()}
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
