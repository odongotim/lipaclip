import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import BrandSidebar from '../../components/BrandSidebar'

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

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'brand') { navigate('/'); return }
    setProfile(prof)

    const { data: camps } = await supabase.from('campaigns').select('*').eq('brand_id', user.id).order('created_at', { ascending: false })
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

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-stone-500 text-sm mb-8">Welcome back, {profile?.display_name}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Budget', value: fmtUGX(stats.totalBudget), color: 'text-amber-600' },
            { label: 'Total Spent', value: fmtUGX(stats.totalSpent), color: 'text-green-700' },
            { label: 'Unspent', value: fmtUGX(stats.totalBudget - stats.totalSpent), color: 'text-blue-700' },
            { label: 'Active', value: stats.activeCampaigns.toString(), color: 'text-purple-700' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-stone-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Campaigns */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-stone-900 font-semibold">Your Campaigns</h2>
          <Link to="/brand/new-campaign" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition">+ New Campaign</Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <div className="flex justify-center mb-3"><svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
            <p className="text-stone-500 text-sm">No campaigns yet.</p>
            <Link to="/brand/new-campaign" className="inline-block mt-4 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-6 py-2 rounded-lg transition">Create Campaign</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-white border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {camp.thumbnail_url
                      ? <img src={camp.thumbnail_url} alt={camp.title} className="w-full h-full object-cover rounded-xl" />
                      : <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-stone-900 font-semibold text-sm">{camp.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${camp.status === 'live' ? 'bg-green-50 text-green-700' : camp.status === 'completed' ? 'bg-blue-50 text-blue-700' : 'bg-amber-100 text-amber-600'}`}>{camp.status}</span>
                    </div>

                    {/* Platform icons */}
                    {camp.platforms && (
                      <div className="flex gap-1 mb-1">
                        {camp.platforms.map(p => <span key={p} className="text-[10px] uppercase tracking-wide bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{PLATFORM_LABELS[p] || p}</span>)}
                      </div>
                    )}

                    <div className="text-stone-500 text-xs mb-2 capitalize">{camp.type} campaign</div>
                    <div className="w-full bg-stone-200 rounded-full h-1.5">
                      <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: `${Math.min(((camp.spent || 0) / camp.budget) * 100, 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-stone-400 mt-1">
                      <span>{fmtUGX(camp.spent || 0)} spent</span>
                      <span>{fmtUGX(camp.budget)} budget</span>
                    </div>
                  </div>

                  <button onClick={() => handleDelete(camp.id)} className="text-red-600 hover:text-red-700 flex-shrink-0"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M4 7h16M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" /></svg></button>
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
          label: 'Videos Posted',
          value: submissions[camp.id].length
        },
        {
          label: 'Total Views',
          value: submissions[camp.id].reduce((a: number, s: any) => a + (s.views || 0), 0).toLocaleString()
        },
      ].map(stat => (
        <div key={stat.label} className="bg-stone-100 rounded-lg p-2 text-center">
          <div className="text-amber-600 font-bold text-sm">{stat.value}</div>
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
                  <span className="text-blue-700">{inf.totalViews.toLocaleString()} views</span>
                  <span className="text-green-700">{fmtUGX(inf.totalEarnings)}</span>
                </div>
              </div>
              <div className="space-y-1">
                {inf.videos.map((sub: any, vidIdx: number) => (
                  <div key={sub.id} className="flex items-center gap-2">
                    <span className="text-stone-400 text-xs">Video {vidIdx + 1}:</span>
                    <a href={sub.video_url} target="_blank" rel="noopener noreferrer"
                      className="text-amber-600 text-xs hover:underline truncate flex-1">
                      {sub.video_url}
                    </a>
                    <button onClick={() => copyLink(sub.video_url, sub.id)}
                      className="text-stone-500 hover:text-amber-600 text-xs flex-shrink-0">
                      {copied === sub.id
                        ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      }
                    </button>
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
