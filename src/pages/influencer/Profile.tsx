import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import CreatorNav from '../../components/CreatorNav'
import PageLoader from '../../components/PageLoader'
import SocialLinksSection from '../../components/SocialLinksSection'
import LogoutButton from '../../components/LogoutButton'

export const CATEGORIES = ['Fashion', 'Food', 'Music', 'Comedy', 'Tech', 'Sports', 'Beauty', 'Business', 'Education', 'Lifestyle', 'Gaming', 'Faith']
export const AGE_RANGES = ['Under 18', '18-24', '25-34', '35-44', '45+']

type Form = {
  bio: string; location: string; categories: string[]
  tiktok_followers_reported: string; instagram_followers: string; youtube_subscribers: string; x_followers: string
  avg_views: string; audience_female_pct: string; audience_uganda_pct: string; audience_age_range: string
}

const EMPTY: Form = {
  bio: '', location: '', categories: [],
  tiktok_followers_reported: '', instagram_followers: '', youtube_subscribers: '', x_followers: '',
  avg_views: '', audience_female_pct: '', audience_uganda_pct: '', audience_age_range: '',
}

const toInt = (v: string): number | null => {
  if (v.trim() === '') return null
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n >= 0 ? n : null
}
const toPct = (v: string): number | null => {
  const n = toInt(v)
  return n === null ? null : Math.min(100, n)
}

export default function InfluencerProfile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [statsVerified, setStatsVerified] = useState(false)
  const [perf, setPerf] = useState({ videos: 0, approved: 0, views: 0, campaigns: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  // Links like /influencer/profile#social-accounts scroll to their section once the page has loaded
  useEffect(() => {
    if (loading || !window.location.hash) return
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [loading])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof) { navigate('/login'); return }
    if (prof.role !== 'influencer') { navigate('/'); return }
    setProfile(prof)

    const { data: cp } = await supabase.from('creator_profiles').select('*').eq('id', user.id).maybeSingle()
    if (cp) {
      const s = (v: number | null) => (v === null || v === undefined ? '' : String(v))
      setForm({
        bio: cp.bio || '', location: cp.location || '', categories: cp.categories || [],
        tiktok_followers_reported: s(cp.tiktok_followers_reported), instagram_followers: s(cp.instagram_followers),
        youtube_subscribers: s(cp.youtube_subscribers), x_followers: s(cp.x_followers),
        avg_views: s(cp.avg_views), audience_female_pct: s(cp.audience_female_pct),
        audience_uganda_pct: s(cp.audience_uganda_pct), audience_age_range: cp.audience_age_range || '',
      })
      setStatsVerified(!!cp.stats_verified)
    }

    // Performance on LipaClip, computed from this creator's own submissions
    const { data: subs } = await supabase.from('submissions').select('campaign_id, views, status').eq('influencer_id', user.id)
    if (subs) {
      const live = subs.filter((x: any) => x.status !== 'rejected')
      setPerf({
        videos: subs.length,
        approved: subs.filter((x: any) => x.status === 'approved').length,
        views: live.reduce((a: number, x: any) => a + (x.views || 0), 0),
        campaigns: new Set(subs.map((x: any) => x.campaign_id)).size,
      })
    }
    setLoading(false)
  }

  const set = (key: keyof Form, value: string) => setForm(prev => ({ ...prev, [key]: value }))
  const toggleCategory = (c: string) => setForm(prev => ({
    ...prev,
    categories: prev.categories.includes(c) ? prev.categories.filter(x => x !== c) : [...prev.categories, c].slice(0, 4),
  }))

  const handleSave = async () => {
    setSaving(true); setMessage(''); setError('')
    const user = await getCurrentUser()
    if (!user) { setSaving(false); return }

    const { error: err } = await supabase.from('creator_profiles').upsert({
      id: user.id,
      bio: form.bio.trim() || null,
      location: form.location.trim() || null,
      categories: form.categories,
      tiktok_followers_reported: toInt(form.tiktok_followers_reported),
      instagram_followers: toInt(form.instagram_followers),
      youtube_subscribers: toInt(form.youtube_subscribers),
      x_followers: toInt(form.x_followers),
      avg_views: toInt(form.avg_views),
      audience_female_pct: toPct(form.audience_female_pct),
      audience_uganda_pct: toPct(form.audience_uganda_pct),
      audience_age_range: form.audience_age_range || null,
      stats_verified: false, // any edit sends the stats back for admin re-verification
      updated_at: new Date().toISOString(),
    })

    if (err) setError(err.message)
    else {
      setStatsVerified(false)
      setMessage('Profile saved. Brands can see it once your social account is verified.')
    }
    setSaving(false)
  }

  const isVerified = profile?.is_verified || profile?.tiktok_verified
  const approvalRate = perf.videos > 0 ? Math.round((perf.approved / perf.videos) * 100) : null
  const avgPerVideo = perf.videos > 0 ? Math.round(perf.views / perf.videos) : 0

  const inputCls = 'w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-500 transition'

  if (loading) return (
    <PageLoader />
  )

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <CreatorNav userName={profile?.display_name} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-10">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">My profile</h1>
        <p className="text-stone-500 text-sm mb-8">Your social accounts, audience and track record. Brands use this to see who you are and who you reach.</p>

        {message && <div role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}
        {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

        {/* Status */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className={`text-xs px-3 py-1 rounded-full ${isVerified ? 'bg-green-50 text-green-700' : 'bg-brand-100 text-brand-700'}`}>
            {isVerified ? 'Account verified: visible to brands' : 'Account not verified yet: hidden from brands'}
          </span>
          <span className={`text-xs px-3 py-1 rounded-full ${statsVerified ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
            {statsVerified ? 'Audience stats verified' : 'Audience stats self-reported'}
          </span>
        </div>

        {/* Social accounts (moved here from the old My socials page) */}
        <SocialLinksSection profile={profile} onSaved={patch => setProfile((prev: any) => ({ ...prev, ...patch }))} />

        {/* Performance on LipaClip */}
        <h2 className="text-stone-900 font-semibold mb-3 text-sm">Your LipaClip track record</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-3xl">
          {[
            { label: 'Videos posted', value: perf.videos.toLocaleString() },
            { label: 'Campaigns', value: perf.campaigns.toLocaleString() },
            { label: 'Avg Views / Video', value: avgPerVideo.toLocaleString() },
            { label: 'Approval rate', value: approvalRate === null ? '—' : `${approvalRate}%` },
          ].map(st => (
            <div key={st.label} className="bg-white border border-stone-200 rounded-2xl p-4">
              <div className="text-xl font-bold text-brand-700">{st.value}</div>
              <div className="text-stone-500 text-xs">{st.label}</div>
            </div>
          ))}
        </div>

        <div className="max-w-xl space-y-4">
          {/* About */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
            <h2 className="text-stone-900 font-semibold text-sm">About you</h2>
            <div>
              <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-short-bio">Short bio</label>
              <textarea id="f-short-bio" value={form.bio} maxLength={240} rows={3} onChange={e => set('bio', e.target.value)}
                placeholder="What do you make, and who watches it?" className={`${inputCls} resize-none`} />
              <div className="text-stone-400 text-xs text-right mt-1">{form.bio.length}/240</div>
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-1 block" htmlFor="f-location">Location</label>
              <input id="f-location" type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Lira, Uganda" className={inputCls} />
            </div>
            <div>
              <label className="text-stone-500 text-sm mb-2 block">Content categories <span className="text-stone-400">(up to 4)</span></label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} type="button" onClick={() => toggleCategory(c)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${form.categories.includes(c) ? 'bg-brand-100 border-brand-500 text-stone-900' : 'bg-white border-stone-200 text-stone-500 hover:border-brand-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Followers */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <h2 className="text-stone-900 font-semibold text-sm mb-3">Followers</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['tiktok_followers_reported', 'TikTok followers'],
                ['instagram_followers', 'Instagram followers'],
                ['youtube_subscribers', 'YouTube subscribers'],
                ['x_followers', 'X followers'],
              ] as [keyof Form, string][]).map(([key, label]) => (
                <div key={key}>
                  <label className="text-stone-500 text-xs mb-1 block">{label}</label>
                  <input type="number" min={0} inputMode="numeric" value={form[key] as string} onChange={e => set(key, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <h2 className="text-stone-900 font-semibold text-sm mb-3">Audience</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-stone-500 text-xs mb-1 block" htmlFor="f-average-views-per-video">Average views per video</label>
                <input id="f-average-views-per-video" type="number" min={0} inputMode="numeric" value={form.avg_views} onChange={e => set('avg_views', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-stone-500 text-xs mb-1 block" htmlFor="f-top-audience-age">Top audience age</label>
                <select id="f-top-audience-age" value={form.audience_age_range} onChange={e => set('audience_age_range', e.target.value)} className={inputCls}>
                  <option value="">Select</option>
                  {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-stone-500 text-xs mb-1 block" htmlFor="f-female-audience">Female audience (%)</label>
                <input id="f-female-audience" type="number" min={0} max={100} inputMode="numeric" value={form.audience_female_pct} onChange={e => set('audience_female_pct', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-stone-500 text-xs mb-1 block" htmlFor="f-audience-in-uganda">Audience in Uganda (%)</label>
                <input id="f-audience-in-uganda" type="number" min={0} max={100} inputMode="numeric" value={form.audience_uganda_pct} onChange={e => set('audience_uganda_pct', e.target.value)} className={inputCls} />
              </div>
            </div>
            <p className="text-stone-400 text-xs">Use the numbers from your platform analytics. An admin can verify them. Editing your profile sends the stats back for re-verification.</p>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>

          <div className="pt-6 border-t border-stone-200 mt-6">
            <LogoutButton />
          </div>
        </div>
      </main>
    </div>
  )
}
