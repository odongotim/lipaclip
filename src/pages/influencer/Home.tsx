import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import InfluencerSidebar from '../../components/InfluencerSidebar'

type Campaign = {
  id: string; title: string; type: string; thumbnail_url: string | null
  pay_per_1k: number; budget: number; spent: number; period_days: number
  platforms: string[]; source_url: string | null; instructions: string | null
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', x: 'X'
}

export default function InfluencerHome() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  const [mySubmissions, setMySubmissions] = useState<Record<string, number>>({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'influencer') { navigate('/'); return }
    setProfile(prof)

    const { data: camps } = await supabase
      .from('campaigns')
      .select('id, title, type, thumbnail_url, pay_per_1k, budget, spent, period_days, platforms, source_url, instructions')
      .eq('status', 'live')
      .order('created_at', { ascending: false })

    if (camps) {
      setCampaigns(camps.filter((c: any) => (c.spent || 0) < c.budget))
    }

    // Count submissions per campaign for this influencer
    const { data: subs } = await supabase
      .from('submissions')
      .select('campaign_id')
      .eq('influencer_id', user.id)

    if (subs) {
      const counts: Record<string, number> = {}
      subs.forEach((s: any) => {
        counts[s.campaign_id] = (counts[s.campaign_id] || 0) + 1
      })
      setMySubmissions(counts)
    }

    setLoading(false)
  }

  const handleSubmit = async (campaignId: string) => {
    const url = videoUrls[campaignId]
    if (!url) return
    setSubmitting(campaignId)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check budget remaining
    const camp = campaigns.find(c => c.id === campaignId)
    if (camp && (camp.spent || 0) >= camp.budget) {
      alert('This campaign budget has been fully used!')
      setSubmitting(null)
      return
    }

    // Check for duplicate URL
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('influencer_id', user.id)
      .eq('video_url', url)
      .single()

    if (existing) {
      alert('You have already submitted this video URL!')
      setSubmitting(null)
      return
    }

    await supabase.from('submissions').insert({
      campaign_id: campaignId,
      influencer_id: user.id,
      video_url: url,
      status: 'pending',
    })

    setMySubmissions(prev => ({
      ...prev,
      [campaignId]: (prev[campaignId] || 0) + 1
    }))
    setVideoUrls(prev => ({ ...prev, [campaignId]: '' }))
    alert('Video submitted! Admin will track your views.')
    setSubmitting(null)
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`
  const budgetPct = (camp: Campaign) => Math.min(((camp.spent || 0) / camp.budget) * 100, 100)
  const remaining = (camp: Campaign) => camp.budget - (camp.spent || 0)

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <InfluencerSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Browse Campaigns</h1>
        <p className="text-stone-500 text-sm mb-8">Post multiple videos per campaign. All views add up!</p>

        {campaigns.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
            <div className="flex justify-center mb-3"><svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
            <p className="text-stone-500 text-sm">No live campaigns at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <div className="w-full h-40 bg-amber-50 flex items-center justify-center overflow-hidden relative">
                  {camp.thumbnail_url
                    ? <img src={camp.thumbnail_url} alt={camp.title} className="w-full h-full object-cover" />
                    : <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  }
                  <span className="absolute top-2 right-2 bg-stone-900/60 text-amber-600 text-xs px-2 py-0.5 rounded-full capitalize">{camp.type}</span>
                  {mySubmissions[camp.id] > 0 && (
                    <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {mySubmissions[camp.id]} video{mySubmissions[camp.id] > 1 ? 's' : ''} submitted
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-stone-900 font-semibold text-sm mb-2">{camp.title}</h3>

                  {camp.platforms && camp.platforms.length > 0 && (
                    <div className="flex gap-1 mb-3">
                      {camp.platforms.map(p => (
                        <span key={p} className="text-[10px] uppercase tracking-wide bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded" title={p}>{PLATFORM_LABELS[p] || p}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <div className="text-amber-600 font-bold">{fmtUGX(camp.pay_per_1k)}</div>
                      <div className="text-stone-400 text-xs">per 1,000 views</div>
                    </div>
                    <div>
                      <div className="text-green-700 font-bold">{camp.period_days} days</div>
                      <div className="text-stone-400 text-xs">campaign period</div>
                    </div>
                  </div>

                  {camp.source_url && (
                    <a
                      href={camp.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-amber-50 border border-stone-300 rounded-lg px-3 py-2 text-amber-600 text-xs font-semibold mb-3 hover:bg-amber-100 transition"
                    >
                      Download Campaign Material
                    </a>
                  )}

                  {camp.instructions && (
                    <div className="bg-stone-100 rounded-lg p-3 mb-3">
                      <p className="text-stone-500 text-xs font-semibold mb-1">Posting Instructions:</p>
                      <p className="text-stone-600 text-xs leading-relaxed whitespace-pre-line">{camp.instructions}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="w-full bg-stone-200 rounded-full h-2">
                      <div className="bg-amber-600 h-2 rounded-full transition-all" style={{ width: `${budgetPct(camp)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-stone-400 mt-1">
                      <span>{fmtUGX(camp.spent || 0)} used</span>
                      <span className="text-green-700">{fmtUGX(remaining(camp))} left</span>
                    </div>
                  </div>

                  {/* Multiple video submission */}
                  <div className="space-y-2">
                    {mySubmissions[camp.id] > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700 text-xs text-center mb-2">
                        {mySubmissions[camp.id]} video{mySubmissions[camp.id] > 1 ? 's' : ''} submitted. Keep posting more to earn more!
                      </div>
                    )}
                    <input
                      type="url"
                      value={videoUrls[camp.id] || ''}
                      onChange={e => setVideoUrls(prev => ({ ...prev, [camp.id]: e.target.value }))}
                      placeholder="Paste your video URL to submit..."
                      className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                    <button
                      onClick={() => handleSubmit(camp.id)}
                      disabled={!videoUrls[camp.id] || submitting === camp.id}
                      className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition text-sm"
                    >
                      {submitting === camp.id ? 'Submitting...' : '+ Submit Video'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
