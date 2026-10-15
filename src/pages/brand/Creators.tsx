import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import BrandSidebar from '../../components/BrandSidebar'
import { CATEGORIES } from '../influencer/Profile'
import PageLoader from '../../components/PageLoader'
import EmptyState from '../../components/EmptyState'

type LiveCampaign = { id: string; title: string }
type InviteRow = { campaign_id: string; influencer_id: string; status: string }

type Creator = {
  id: string; display_name: string; verified: boolean
  tiktok_url: string | null; instagram_url: string | null; youtube_url: string | null; x_url: string | null
  tiktok_followers: number | null; tiktok_engagement: number | null
  bio: string | null; location: string | null; categories: string[]
  instagram_followers: number | null; youtube_subscribers: number | null; x_followers: number | null
  avg_views: number | null; audience_female_pct: number | null; audience_uganda_pct: number | null; audience_age_range: string | null
  stats_verified: boolean
  videos: number; approved_videos: number; total_views: number; campaigns: number
}

const PLATFORMS = [
  { key: 'tiktok', label: 'TikTok', url: 'tiktok_url', count: 'tiktok_followers' },
  { key: 'instagram', label: 'Instagram', url: 'instagram_url', count: 'instagram_followers' },
  { key: 'youtube', label: 'YouTube', url: 'youtube_url', count: 'youtube_subscribers' },
  { key: 'x', label: 'X', url: 'x_url', count: 'x_followers' },
] as const

const compact = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n)
const totalFollowers = (c: Creator) => (c.tiktok_followers || 0) + (c.instagram_followers || 0) + (c.youtube_subscribers || 0) + (c.x_followers || 0)

function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-stone-500 mb-0.5"><span>{label}</span><span>{pct}%</span></div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export default function Creators() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [platform, setPlatform] = useState<'all' | 'tiktok' | 'instagram' | 'youtube' | 'x'>('all')
  const [category, setCategory] = useState('all')
  const [minFollowers, setMinFollowers] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'views' | 'followers' | 'avg'>('views')
  const [liveCampaigns, setLiveCampaigns] = useState<LiveCampaign[]>([])
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [inviting, setInviting] = useState<string | null>(null)
  const [inviteCampaign, setInviteCampaign] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof) { navigate('/login'); return }
    if (prof.role !== 'brand') { navigate('/'); return }
    setProfile(prof)

    const { data, error: err } = await supabase.rpc('list_creators')
    if (err) setError('Could not load creators. Make sure the creator profiles migration has been run.')
    else setCreators((data as Creator[]) || [])

    const { data: camps } = await supabase.from('campaigns').select('id, title, budget, spent').eq('brand_id', user.id).eq('status', 'live')
    if (camps) setLiveCampaigns(camps.filter((c: any) => (c.spent || 0) < c.budget).map((c: any) => ({ id: c.id, title: c.title })))
    const { data: inv } = await supabase.from('campaign_invites').select('campaign_id, influencer_id, status').eq('brand_id', user.id)
    if (inv) setInvites(inv as InviteRow[])
    setLoading(false)
  }

  const visible = useMemo(() => {
    const avgPerVideo = (c: Creator) => c.avg_views ?? (c.videos > 0 ? Math.round(c.total_views / c.videos) : 0)
    return creators
      .filter(c => platform === 'all' || !!c[`${platform}_url` as keyof Creator])
      .filter(c => category === 'all' || (c.categories || []).includes(category))
      .filter(c => totalFollowers(c) >= minFollowers)
      .filter(c => !verifiedOnly || c.stats_verified)
      .sort((a, b) =>
        sortBy === 'followers' ? totalFollowers(b) - totalFollowers(a)
        : sortBy === 'avg' ? avgPerVideo(b) - avgPerVideo(a)
        : b.total_views - a.total_views)
  }, [creators, platform, category, minFollowers, verifiedOnly, sortBy])

  const openInvite = (creatorId: string) => {
    setInviting(creatorId)
    setInviteCampaign(liveCampaigns[0]?.id || '')
    setInviteMessage('')
  }

  const sendInvite = async (creatorId: string) => {
    if (!inviteCampaign) return
    setSending(true)
    setError('')
    const { error: err } = await supabase.rpc('invite_creator', {
      p_campaign_id: inviteCampaign, p_influencer_id: creatorId, p_message: inviteMessage || null,
    })
    if (err) setError(err.message)
    else {
      setInvites(prev => [...prev, { campaign_id: inviteCampaign, influencer_id: creatorId, status: 'pending' }])
      setNotice('Invitation sent!')
      setTimeout(() => setNotice(''), 3000)
      setInviting(null)
    }
    setSending(false)
  }

  const selectCls = 'bg-white border border-stone-200 text-stone-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500'

  if (loading) return (
    <PageLoader />
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Creators</h1>
        <p className="text-stone-500 text-sm mb-6">Verified creators on LipaClip, with audience stats and track record.</p>

        {notice && <div role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{notice}</div>}
        {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <select aria-label="Platform" value={platform} onChange={e => setPlatform(e.target.value as any)} className={selectCls}>
            <option value="all">All platforms</option>
            {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>
            <option value="all">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select aria-label="Minimum followers" value={minFollowers} onChange={e => setMinFollowers(Number(e.target.value))} className={selectCls}>
            <option value={0}>Any followers</option>
            <option value={1000}>1K+ followers</option>
            <option value={10000}>10K+ followers</option>
            <option value={50000}>50K+ followers</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs text-stone-600 bg-white border border-stone-200 rounded-lg px-3 py-2 cursor-pointer">
            <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)} className="accent-brand-600" />
            Verified stats only
          </label>
          <select aria-label="Sort" value={sortBy} onChange={e => setSortBy(e.target.value as any)} className={`${selectCls} ml-auto`}>
            <option value="views">Most views delivered</option>
            <option value="followers">Most followers</option>
            <option value="avg">Highest avg views</option>
          </select>
        </div>

        {visible.length === 0 ? (
          <EmptyState title={creators.length === 0 ? 'No verified creators yet' : 'No creators match these filters'} description={creators.length === 0 ? 'Creators appear here once their social account is verified.' : 'Try removing a filter or lowering the follower minimum.'} />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {visible.map(c => {
              const approval = c.videos > 0 ? Math.round((c.approved_videos / c.videos) * 100) : null
              const avgVideo = c.videos > 0 ? Math.round(c.total_views / c.videos) : 0
              return (
                <div key={c.id} className="bg-white border border-stone-200 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="text-stone-900 font-semibold text-sm">{c.display_name}</h3>
                      {c.location && <div className="text-stone-400 text-xs">{c.location}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full">Verified account</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.stats_verified ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                        {c.stats_verified ? 'Stats verified' : 'Stats self-reported'}
                      </span>
                    </div>
                  </div>

                  {c.bio && <p className="text-stone-600 text-xs mt-2 mb-3">{c.bio}</p>}

                  {c.categories?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.categories.map(cat => <span key={cat} className="text-[11px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{cat}</span>)}
                    </div>
                  )}

                  {/* Platforms */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {PLATFORMS.filter(p => c[p.url as keyof Creator]).map(p => {
                      const count = c[p.count as keyof Creator] as number | null
                      return (
                        <a key={p.key} href={c[p.url as keyof Creator] as string} target="_blank" rel="noopener noreferrer"
                          className="bg-stone-50 border border-stone-200 hover:border-brand-400 rounded-lg px-3 py-2 transition">
                          <div className="text-[10px] uppercase tracking-wide text-stone-400">{p.label}</div>
                          <div className="text-stone-900 text-sm font-semibold">{count ? compact(count) : '—'}</div>
                        </a>
                      )
                    })}
                  </div>

                  {/* Audience */}
                  {(c.audience_female_pct !== null || c.audience_uganda_pct !== null || c.audience_age_range || c.tiktok_engagement) && (
                    <div className="space-y-2 mb-3">
                      {c.audience_female_pct !== null && <Bar label="Female audience" pct={c.audience_female_pct} />}
                      {c.audience_uganda_pct !== null && <Bar label="Audience in Uganda" pct={c.audience_uganda_pct} />}
                      <div className="flex gap-4 text-[11px] text-stone-500">
                        {c.audience_age_range && <span>Top age: <span className="text-stone-900">{c.audience_age_range}</span></span>}
                        {c.tiktok_engagement ? <span>TikTok engagement: <span className="text-stone-900">{c.tiktok_engagement}%</span></span> : null}
                      </div>
                    </div>
                  )}

                  {/* Invite */}
                  {(() => {
                    const mine = invites.filter(i => i.influencer_id === c.id)
                    const available = liveCampaigns.filter(lc => !mine.some(i => i.campaign_id === lc.id))
                    return (
                      <div className="mb-3">
                        {mine.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {mine.map(i => {
                              const title = liveCampaigns.find(lc => lc.id === i.campaign_id)?.title || 'Campaign'
                              return <span key={i.campaign_id} className={`text-[11px] px-2 py-0.5 rounded-full ${i.status === 'accepted' ? 'bg-green-50 text-green-700' : i.status === 'declined' ? 'bg-stone-100 text-stone-500' : 'bg-brand-100 text-brand-700'}`}>{title}: {i.status}</span>
                            })}
                          </div>
                        )}
                        {inviting === c.id ? (
                          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 space-y-2">
                            <select aria-label="Campaign" value={inviteCampaign} onChange={e => setInviteCampaign(e.target.value)} className={`${selectCls} w-full`}>
                              {available.map(lc => <option key={lc.id} value={lc.id}>{lc.title}</option>)}
                            </select>
                            <textarea value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} maxLength={200} rows={2}
                              placeholder="Optional note, e.g. why you picked them"
                              className="w-full bg-white border border-stone-200 text-stone-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500 resize-none" />
                            <div className="flex gap-2">
                              <button disabled={sending || !inviteCampaign} onClick={() => sendInvite(c.id)}
                                className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition">{sending ? 'Sending...' : 'Send invitation'}</button>
                              <button onClick={() => setInviting(null)} className="px-3 text-xs text-stone-500 hover:text-stone-900">Cancel</button>
                            </div>
                          </div>
                        ) : available.length > 0 ? (
                          <button onClick={() => openInvite(c.id)}
                            className="w-full border border-brand-500 text-brand-700 hover:bg-brand-50 text-xs font-bold py-2 rounded-lg transition">Invite to a campaign</button>
                        ) : (
                          <p className="text-stone-400 text-xs">{liveCampaigns.length === 0 ? 'Launch a live campaign to invite creators.' : 'Invited to all your live campaigns.'}</p>
                        )}
                      </div>
                    )
                  })()}

                  {/* LipaClip track record (computed from real submissions) */}
                  <div className="grid grid-cols-4 gap-2 border-t border-stone-200 pt-3 text-center">
                    {[
                      { l: 'Views delivered', v: compact(c.total_views) },
                      { l: 'Avg / video', v: compact(avgVideo) },
                      { l: 'Campaigns', v: String(c.campaigns) },
                      { l: 'Approved', v: approval === null ? '—' : `${approval}%` },
                    ].map(st => (
                      <div key={st.l}>
                        <div className="text-stone-900 text-sm font-semibold">{st.v}</div>
                        <div className="text-stone-400 text-[10px]">{st.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
