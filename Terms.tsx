import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import InfluencerSidebar from '../../components/InfluencerSidebar'

type Campaign = {
  id: string
  title: string
  type: string
  thumbnail_url: string | null
  pay_per_1k: number
  budget: number
  spent: number
  period_days: number
}

export default function InfluencerHome() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'influencer') { navigate('/'); return }
    setProfile(prof)

    const { data: camps } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'live')
      .order('created_at', { ascending: false })

    if (camps) setCampaigns(camps)
    setLoading(false)
  }

  const handleSubmit = async (campaignId: string) => {
    const url = videoUrls[campaignId]
    if (!url) return
    setSubmitting(campaignId)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if already submitted
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('influencer_id', user.id)
      .single()

    if (existing) {
      alert('You have already submitted to this campaign!')
      setSubmitting(null)
      return
    }

    await supabase.from('submissions').insert({
      campaign_id: campaignId,
      influencer_id: user.id,
      video_url: url,
      status: 'pending',
    })

    alert('Submission successful! Views will be tracked automatically.')
    setVideoUrls(prev => ({ ...prev, [campaignId]: '' }))
    setSubmitting(null)
  }

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
        <h1 className="text-white text-2xl font-bold mb-1">Browse Campaigns</h1>
        <p className="text-gray-400 text-sm mb-8">Pick a campaign, post your video and get paid!</p>

        {campaigns.length === 0 ? (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-gray-400 text-sm">No live campaigns at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl overflow-hidden">
                {/* Thumbnail */}
                <div className="w-full h-40 bg-yellow-500/10 flex items-center justify-center overflow-hidden">
                  {camp.thumbnail_url
                    ? <img src={camp.thumbnail_url} alt={camp.title} className="w-full h-full object-cover" />
                    : <span className="text-5xl">🎬</span>
                  }
                </div>

                <div className="p-5">
                  {/* Title and type */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-semibold text-sm">{camp.title}</h3>
                    <span className="bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5 rounded-full capitalize">
                      {camp.type}
                    </span>
                  </div>

                  {/* Pay */}
                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <div className="text-yellow-500 font-bold text-lg">{fmtUGX(camp.pay_per_1k)}</div>
                      <div className="text-gray-500 text-xs">per 1,000 views</div>
                    </div>
                    <div>
                      <div className="text-green-400 font-bold text-lg">{camp.period_days} days</div>
                      <div className="text-gray-500 text-xs">campaign period</div>
                    </div>
                  </div>

                  {/* Budget progress */}
                  <div className="mb-4">
                    <div className="w-full bg-yellow-900/30 rounded-full h-1.5">
                      <div
                        className="bg-yellow-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min((camp.spent / camp.budget) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{fmtUGX(camp.spent)} earned</span>
                      <span>{fmtUGX(camp.budget)} budget</span>
                    </div>
                  </div>

                  {/* Submit video */}
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={videoUrls[camp.id] || ''}
                      onChange={e => setVideoUrls(prev => ({ ...prev, [camp.id]: e.target.value }))}
                      placeholder="Paste your TikTok video URL..."
                      className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-500 transition"
                    />
                    <button
                      onClick={() => handleSubmit(camp.id)}
                      disabled={!videoUrls[camp.id] || submitting === camp.id}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-2 rounded-lg transition text-sm"
                    >
                      {submitting === camp.id ? 'Submitting...' : 'Submit Video'}
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