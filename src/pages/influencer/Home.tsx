import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, getCurrentUser, subscribeToTable } from '../../lib/supabase'
import CreatorNav from '../../components/CreatorNav'
import { toast } from '../../lib/toast'
import PageLoader from '../../components/PageLoader'
import EmptyState from '../../components/EmptyState'

type Campaign = {
  id: string; title: string; type: string; thumbnail_url: string | null
  pay_per_1k: number; budget: number; spent: number; period_days: number
  platforms: string[]; source_url: string | null; instructions: string | null
  hashtags?: string[] | null; dos?: string | null; donts?: string | null
}

type Invite = {
  id: string; campaign_id: string; message: string | null; status: string
  campaigns: { title: string; pay_per_1k: number } | null
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
  const [invites, setInvites] = useState<Invite[]>([])
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'clipping' | 'ugc' | 'logo'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'pay' | 'budget'>('newest')

  useEffect(() => {
    loadData()
    const unsub1 = subscribeToTable('submissions', loadData)
    const unsub2 = subscribeToTable('campaigns', loadData)
    const unsub3 = subscribeToTable('campaign_invites', loadData)
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'influencer') { navigate('/'); return }
    setProfile(prof)

    const { data: camps } = await supabase
      .from('campaigns')
      .select('id, title, type, thumbnail_url, pay_per_1k, budget, spent, period_days, platforms, source_url, instructions, hashtags, dos, donts')
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

    // Invitations from brands (table may not exist until the invites migration is run)
    const { data: inv, error: invErr } = await supabase
      .from('campaign_invites')
      .select('id, campaign_id, message, status, campaigns(title, pay_per_1k)')
      .eq('influencer_id', user.id)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
    if (!invErr && inv) setInvites(inv as any)

    setLoading(false)
  }

  const respondToInvite = async (inviteId: string, campaignId: string, status: 'accepted' | 'declined') => {
    setRespondingTo(inviteId)
    const { error } = await supabase.rpc('respond_to_invite', { p_invite_id: inviteId, p_status: status })
    if (error) { toast(error.message, 'error'); setRespondingTo(null); return }
    setInvites(prev => status === 'declined'
      ? prev.filter(i => i.id !== inviteId)
      : prev.map(i => i.id === inviteId ? { ...i, status: 'accepted' } : i))
    setRespondingTo(null)
    if (status === 'accepted') {
      setTypeFilter('all')
      setTimeout(() => document.getElementById(`camp-${campaignId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
  }

  const handleSubmit = async (campaignId: string) => {
    if (!isVerified) { toast('Add and verify a social account before submitting videos.', 'error'); return }
    const url = videoUrls[campaignId]
    if (!url) return
    setSubmitting(campaignId)

    const user = await getCurrentUser()
    if (!user) return

    // Check budget remaining
    const camp = campaigns.find(c => c.id === campaignId)
    if (camp && (camp.spent || 0) >= camp.budget) {
      toast('This campaign budget has been fully used.', 'error')
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
      toast('You have already submitted this video link.', 'error')
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
    toast('Video submitted. It is pending review, and views are tracked once it is approved.', 'success')
    setSubmitting(null)
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`
  const visibleCampaigns = campaigns
    .filter(c => typeFilter === 'all' || c.type === typeFilter)
    .sort((a, b) => sortBy === 'pay' ? b.pay_per_1k - a.pay_per_1k : sortBy === 'budget' ? (b.budget - (b.spent || 0)) - (a.budget - (a.spent || 0)) : 0)
  const budgetPct = (camp: Campaign) => Math.min(((camp.spent || 0) / camp.budget) * 100, 100)
  const remaining = (camp: Campaign) => camp.budget - (camp.spent || 0)
  const isVerified = profile?.is_verified || profile?.tiktok_verified

  if (loading) return (
    <PageLoader />
  )

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <CreatorNav userName={profile?.display_name} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-10">
        <h1 className="font-display text-stone-900 text-2xl font-extrabold tracking-tight mb-1">Browse campaigns</h1>
        <p className="text-stone-500 text-sm mb-8">Post as many videos as you like per campaign. All their views add up.</p>

        {!isVerified && (
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <svg className="w-6 h-6 text-brand-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div className="flex-1">
              <div className="text-brand-700 font-semibold text-sm">Verify a social account to start submitting</div>
              <div className="text-stone-500 text-xs mt-0.5">Add at least one social link and wait for admin verification before you can submit videos.</div>
            </div>
            <Link to="/influencer/profile#social-accounts" className="bg-brand-700 hover:bg-brand-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition flex-shrink-0">Add socials</Link>
          </div>
        )}

        {invites.filter(i => i.status === 'pending').length > 0 && (
          <div className="mb-6">
            <h2 className="text-stone-900 font-semibold text-sm mb-3">Invitations for you</h2>
            <div className="space-y-3">
              {invites.filter(i => i.status === 'pending').map(inv => (
                <div key={inv.id} className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="text-stone-900 font-semibold text-sm">A brand invited you to “{inv.campaigns?.title || 'a campaign'}”</div>
                    {inv.campaigns && <div className="text-stone-500 text-xs mt-0.5">{fmtUGX(inv.campaigns.pay_per_1k)} per 1,000 views</div>}
                    {inv.message && <p className="text-stone-600 text-xs mt-2 whitespace-pre-line">{inv.message}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button disabled={respondingTo === inv.id} onClick={() => respondToInvite(inv.id, inv.campaign_id, 'accepted')}
                      className="bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg transition">Accept</button>
                    <button disabled={respondingTo === inv.id} onClick={() => respondToInvite(inv.id, inv.campaign_id, 'declined')}
                      className="border border-stone-300 text-stone-600 hover:bg-white disabled:opacity-50 text-xs font-semibold px-4 py-2 rounded-lg transition">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {campaigns.length === 0 ? (
          <EmptyState title="No live campaigns right now" description="New campaigns appear here as brands launch them. Fill in your profile so brands can find and invite you." actionLabel="Complete your profile" actionTo="/influencer/profile" />
        ) : (
          <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {(['all', 'clipping', 'ugc', 'logo'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize transition ${typeFilter === t ? 'bg-brand-100 border-brand-500 text-stone-900' : 'bg-white border-stone-200 text-stone-500 hover:border-brand-400'}`}>
                {t === 'all' ? 'All' : t === 'ugc' ? 'UGC' : t}
              </button>
            ))}
            <select value={sortBy} onChange={e => setSortBy(e.target.value as 'newest' | 'pay' | 'budget')}
              aria-label="Sort campaigns"
              className="ml-auto bg-white border border-stone-200 text-stone-600 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-brand-500">
              <option value="newest">Newest</option>
              <option value="pay">Highest pay per 1,000</option>
              <option value="budget">Most budget left</option>
            </select>
          </div>
          {visibleCampaigns.length === 0 && <p className="text-stone-500 text-sm text-center py-8">No campaigns match this filter.</p>}
          <div className="grid md:grid-cols-2 gap-4">
            {visibleCampaigns.map(camp => (
              <div key={camp.id} id={`camp-${camp.id}`} className="bg-white border border-stone-200 rounded-2xl overflow-hidden scroll-mt-6">
                <div className="w-full h-40 bg-brand-50 flex items-center justify-center overflow-hidden relative">
                  {camp.thumbnail_url
                    ? <img src={camp.thumbnail_url} alt={camp.title} className="w-full h-full object-cover" />
                    : <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.45.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  }
                  <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-xs px-2 py-0.5 rounded-full capitalize">{camp.type}</span>
                  {invites.some(i => i.campaign_id === camp.id) && !(mySubmissions[camp.id] > 0) && (
                    <span className="absolute top-2 left-2 bg-brand-700 text-white text-xs px-2 py-0.5 rounded-full">Invited</span>
                  )}
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
                        <span key={p} className="text-[10px] uppercase tracking-wide bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded" title={p}>{PLATFORM_LABELS[p] || p}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-3">
                    <div>
                      <div className="text-brand-700 font-bold">{fmtUGX(camp.pay_per_1k)}</div>
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
                      className="flex items-center gap-2 bg-brand-50 border border-stone-300 rounded-lg px-3 py-2 text-brand-700 text-xs font-semibold mb-3 hover:bg-brand-100 transition"
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

                  {camp.hashtags && camp.hashtags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      {camp.hashtags.map(h => <span key={h} className="text-[11px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{h}</span>)}
                    </div>
                  )}

                  {(camp.dos || camp.donts) && (
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {camp.dos && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-green-700 text-xs font-semibold mb-1">Do</p>
                          <p className="text-stone-600 text-xs leading-relaxed whitespace-pre-line">{camp.dos}</p>
                        </div>
                      )}
                      {camp.donts && (
                        <div className="bg-red-50 rounded-lg p-3">
                          <p className="text-red-600 text-xs font-semibold mb-1">Don't</p>
                          <p className="text-stone-600 text-xs leading-relaxed whitespace-pre-line">{camp.donts}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="w-full bg-stone-200 rounded-full h-2">
                      <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${budgetPct(camp)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-stone-400 mt-1">
                      <span>{fmtUGX(camp.spent || 0)} used</span>
                      <span className="text-green-700">{fmtUGX(remaining(camp))} left</span>
                    </div>
                  </div>

                  {/* Multiple video submission */}
                  <div className="space-y-2">
                    {mySubmissions[camp.id] > 0 && (
                      <div role="status" className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700 text-xs text-center mb-2">
                        {mySubmissions[camp.id]} video{mySubmissions[camp.id] > 1 ? 's' : ''} submitted. Keep posting more to earn more!
                      </div>
                    )}
                    {isVerified ? (
                      <>
                        <input
                          type="url"
                          value={videoUrls[camp.id] || ''}
                          onChange={e => setVideoUrls(prev => ({ ...prev, [camp.id]: e.target.value }))}
                          placeholder="Paste your video URL to submit..."
                          className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                        />
                        <button
                          onClick={() => handleSubmit(camp.id)}
                          disabled={!videoUrls[camp.id] || submitting === camp.id}
                          className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition text-sm"
                        >
                          {submitting === camp.id ? 'Submitting...' : '+ Submit Video'}
                        </button>
                      </>
                    ) : (
                      <Link to="/influencer/profile#social-accounts" className="block w-full text-center bg-stone-100 hover:bg-stone-200 text-stone-500 font-semibold py-2 rounded-lg transition text-sm">
                        Verify a social account to submit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </main>
    </div>
  )
}
