import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase, subscribeToTable } from '../lib/supabase'
import heroPhoto from '../assets/hero-photo.jpg'
import logo from '../assets/logo.jpg'

type Campaign = {
  id: string; title: string; type: string; thumbnail_url: string | null
  budget: number; spent: number; period_days: number; platforms: string[]
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', x: 'X'
}

const FAQS = [
  { q: 'How does pay-per-view work?', a: 'You set a campaign budget and a rate per 1,000 views. Creators post your campaign on their own channels and earn only for the views their posts get. You never pay for views that were not delivered.' },
  { q: 'Can I spend more than my budget?', a: 'No. Your campaign budget is the ceiling. Once it is used up, the campaign stops earning creators money and you are not charged for anything beyond it.' },
  { q: 'How do I pay, and how do creators get paid?', a: 'Brands fund campaigns with MTN Mobile Money. Creators withdraw their earnings to MTN Mobile Money once their views are verified.' },
  { q: 'What does LipaClip charge?', a: 'Brands pay a small service fee on top of the campaign budget when they fund it, and creators pay a service fee when they withdraw. The brand fee is shown to you before you pay, with no hidden extras.' },
  { q: 'Which platforms are supported?', a: 'TikTok, Instagram, YouTube and X. You choose which ones your campaign targets.' },
  { q: 'What kinds of campaigns can I run?', a: 'Logo campaigns, clipping campaigns where creators cut and repost your content, and UGC campaigns where creators make original content for your brand.' },
]

const CAMPAIGN_TYPES = [
  { title: 'Clipping', desc: 'Creators cut your long videos, podcasts or events into short clips and post them.' },
  { title: 'UGC', desc: 'Creators make original content about your product in their own voice.' },
  { title: 'Logo', desc: 'Creators feature your brand logo in their content to build everyday visibility.' },
]

const BRAND_POINTS = [
  { title: 'Pay only for views', desc: 'Your rate is set per 1,000 views. No flat fees, no paying for promises.' },
  { title: 'Your budget is a hard cap', desc: 'Once the budget is spent, that is it. Never a shilling over.' },
  { title: 'Mobile Money, start to finish', desc: 'Fund with MTN MoMo and see spend and views update on your dashboard.' },
  { title: 'Real Ugandan voices', desc: 'Creators speak to local audiences, in the way local audiences actually talk.' },
]

export default function Landing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [fees, setFees] = useState<{ deposit: number | null; minPerk: number | null }>({ deposit: null, minPerk: null })
  const [liveStats, setLiveStats] = useState<{ campaigns: number; creators: number; paid: number; views: number } | null>(null)

  // Payout slip (hero calculator): what a budget buys at a chosen rate
  const [budget, setBudget] = useState(500000)
  const [rate, setRate] = useState('3000')
  const [rateTouched, setRateTouched] = useState(false)

  useEffect(() => {
    // Real numbers from the database. If the RPC isn't installed yet (or returns nothing useful) we keep the static fallback below.
    supabase.rpc('public_platform_stats').then(({ data, error }) => {
      if (error || !data) return
      const d = data as any
      const next = { campaigns: Number(d.total_campaigns) || 0, creators: Number(d.creators) || 0, paid: Number(d.paid_out) || 0, views: Number(d.total_views) || 0 }
      if (next.campaigns > 0 && next.creators > 0) setLiveStats(next)
    })
  }, [])

  useEffect(() => {
    supabase.from('platform_settings').select('deposit_fee_pct, clip_min_perk, ugc_min_perk, logo_min_perk').eq('id', 1).single()
      .then(({ data }) => {
        if (!data) return
        const perks = [data.clip_min_perk, data.ugc_min_perk, data.logo_min_perk].filter((n: number | null) => typeof n === 'number' && n > 0)
        const minPerk = perks.length ? Math.min(...perks) : null
        setFees({ deposit: data.deposit_fee_pct ?? null, minPerk })
        if (minPerk && !rateTouched) setRate(String(minPerk))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCampaigns = () => {
    supabase.from('campaigns').select('id, title, type, thumbnail_url, budget, spent, period_days, platforms')
      .eq('status', 'live').order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setCampaigns(data) })
  }

  useEffect(() => {
    loadCampaigns()
    // Keep budget/spent progress live as admins update view counts and campaigns go live/complete
    const unsub = subscribeToTable('campaigns', loadCampaigns)
    return () => unsub()
  }, [])

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`
  const rateNum = Number(rate)
  const views = rateNum > 0 ? Math.floor((budget / rateNum) * 1000) : 0
  const fee = fees.deposit !== null ? Math.round((budget * fees.deposit) / 100) : null

  const stats = liveStats
    ? [
        { label: 'campaigns run', value: liveStats.campaigns.toLocaleString() },
        { label: 'views delivered', value: liveStats.views.toLocaleString() },
        { label: 'paid to creators', value: fmtUGX(liveStats.paid) },
      ]
    : [
        { label: 'active campaigns', value: '50+' },
        { label: 'paid to creators', value: 'UGX 2M+' },
        { label: 'verified creators', value: '100+' },
      ]

  const cta = 'gold-shimmer inline-block bg-brand-700 hover:bg-brand-800 text-white font-bold px-7 py-3 rounded-xl text-sm transition-colors'

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-stone-200 sticky top-0 z-30 bg-stone-50/90 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="LipaClip" className="w-9 h-9 rounded-full" />
          <span className="font-display text-brand-700 text-xl font-bold tracking-tight">Lipa<span className="text-stone-900">Clip</span></span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <a href="#how" className="hidden md:inline text-stone-600 hover:text-stone-900 text-sm transition-colors">How it works</a>
          <a href="#pricing" className="hidden md:inline text-stone-600 hover:text-stone-900 text-sm transition-colors">Pricing</a>
          <a href="#faq" className="hidden md:inline text-stone-600 hover:text-stone-900 text-sm transition-colors">FAQ</a>
          <Link to="/login" className="text-stone-600 hover:text-stone-900 text-sm transition-colors">Log in</Link>
          <Link to="/signup" className="gold-shimmer bg-brand-700 hover:bg-brand-800 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Sign up</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-6 pt-12 md:pt-20 pb-16 grid md:grid-cols-[1.05fr_1fr] gap-10 md:gap-14 items-center">
        <div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
            Pay creators for the views they deliver.
          </h1>
          <p className="text-stone-600 text-lg max-w-md mb-8">
            Set a budget and a rate per 1,000 views. Ugandan creators post your campaign, and you fund it and pay out with MTN Mobile Money.
          </p>
          <div className="flex gap-3 flex-wrap mb-6">
            <Link to="/signup?role=brand" className={cta}>Launch a campaign</Link>
            <Link to="/signup?role=influencer" className="border border-stone-300 hover:border-brand-500 hover:bg-white text-stone-900 font-bold px-7 py-3 rounded-xl transition-colors text-sm">Earn as a creator</Link>
          </div>
          <p className="text-stone-500 text-sm max-w-md">
            Your budget is a hard cap, so you never pay for more than you set. Works on TikTok, Instagram, YouTube and X.
          </p>
        </div>

        {/* Photo + payout slip */}
        <div className="relative">
          {/* Drop your photo at src/assets/hero-photo.jpg (portrait, ~900x1125px) */}
          <div className="aspect-[5/4] md:aspect-[4/5] rounded-3xl border border-stone-200 overflow-hidden">
            <img src={heroPhoto} alt="A creator filming content on their phone" className="w-full h-full object-cover" />
          </div>

          <div className="relative md:absolute md:-left-10 md:-bottom-8 -mt-14 md:mt-0 mx-3 md:mx-0 md:w-[19rem] bg-white rounded-2xl border border-stone-200 shadow-xl shadow-stone-900/10 p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-display font-bold text-sm">What your budget buys</h2>
              <span className="text-stone-400 text-xs">Example</span>
            </div>

            <label htmlFor="budget" className="flex justify-between text-xs text-stone-500 mb-1">
              <span>Budget</span><span className="text-stone-900 font-semibold tabular-nums">{fmtUGX(budget)}</span>
            </label>
            <input id="budget" type="range" min={50000} max={2000000} step={50000} value={budget}
              onChange={e => setBudget(Number(e.target.value))} className="w-full accent-brand-600 mb-3" />

            <label htmlFor="rate" className="flex justify-between items-center text-xs text-stone-500 mb-4">
              <span>Your rate per 1,000 views</span>
              <span className="flex items-center gap-1">
                UGX
                <input id="rate" type="number" min={100} step={100} inputMode="numeric" value={rate}
                  onChange={e => { setRate(e.target.value); setRateTouched(true) }}
                  className="w-20 border border-stone-200 rounded-md px-2 py-1 text-right text-stone-900 text-xs tabular-nums focus:outline-none focus:border-brand-500" />
              </span>
            </label>

            <div className="border-t border-dashed border-stone-300 pt-3" aria-live="polite">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-stone-500">Views you get</span>
                <span className="font-display text-2xl font-extrabold text-stone-900 tabular-nums">{views.toLocaleString()}</span>
              </div>
              {fee !== null && (
                <div className="flex justify-between text-xs text-stone-500 mt-2">
                  <span>Service fee ({fees.deposit}%)</span><span className="tabular-nums">{fmtUGX(fee)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-stone-500 mt-1">
                <span>You pay at most</span><span className="text-stone-900 font-semibold tabular-nums">{fmtUGX(budget + (fee || 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-stone-200 bg-white">
        <dl className="max-w-4xl mx-auto grid grid-cols-3 px-5 sm:px-6">
          {stats.map((st, i) => (
            <div key={st.label} className={`py-6 px-3 sm:px-6 min-w-0 ${i > 0 ? 'border-l border-stone-200' : ''}`}>
              <dt className="sr-only">{st.label}</dt>
              <dd className="font-display text-lg sm:text-2xl font-extrabold text-stone-900 leading-tight break-words tabular-nums">{st.value}</dd>
              <dd className="text-stone-500 text-xs sm:text-sm mt-0.5">{st.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Live campaigns */}
      {campaigns.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 sm:px-6 pt-20">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Campaigns paying right now</h2>
          <p className="text-stone-500 text-sm mb-8">Sign up as a creator to post these and earn per view.</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <div className="w-full h-36 bg-brand-50 flex items-center justify-center overflow-hidden relative">
                  {camp.thumbnail_url
                    ? <img src={camp.thumbnail_url} alt={camp.title} loading="lazy" className="w-full h-full object-cover" />
                    : <span className="text-stone-400 text-xs">No thumbnail yet</span>}
                  <span className="absolute top-2 right-2 bg-white/90 text-stone-700 text-xs font-medium px-2 py-0.5 rounded-full capitalize">{camp.type}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-stone-900 font-semibold text-sm mb-1">{camp.title}</h3>
                  <p className="text-stone-500 text-xs mb-3">
                    {camp.platforms?.map(p => PLATFORM_LABELS[p] || p).join(', ')}{camp.platforms?.length ? ' for ' : ''}{camp.period_days} days
                  </p>
                  <div className="w-full bg-stone-200 rounded-full h-1.5" role="progressbar" aria-label="Budget used"
                    aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(((camp.spent || 0) / camp.budget) * 100, 100))}>
                    <div className="bg-brand-600 h-1.5 rounded-full" style={{ width: `${Math.min(((camp.spent || 0) / camp.budget) * 100, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-stone-500 mt-1.5">
                    <span>{fmtUGX(camp.spent || 0)} earned</span>
                    <span className="text-stone-900 font-medium">{fmtUGX(Math.max(0, camp.budget - (camp.spent || 0)))} left</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how" className="max-w-5xl mx-auto px-5 sm:px-6 pt-24 scroll-mt-20">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-10">How it works</h2>
        <ol className="grid md:grid-cols-3 gap-x-10 gap-y-8">
          {[
            { title: 'A brand posts a campaign', desc: 'Choose a type, set a budget and the rate per 1,000 views, and pay the deposit with Mobile Money.' },
            { title: 'Creators make and post', desc: 'A creator cuts a video, posts it on their own channel and submits the link.' },
            { title: 'Views are counted, everyone is paid', desc: 'Views are verified, earnings are added up, and creators withdraw to Mobile Money.' },
          ].map((item, i) => (
            <li key={item.title} className="border-t-2 border-stone-900 pt-4">
              <div className="font-display text-brand-700 font-extrabold text-lg mb-1">{i + 1}</div>
              <h3 className="text-stone-900 font-semibold mb-1.5">{item.title}</h3>
              <p className="text-stone-600 text-sm leading-relaxed">{item.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why brands choose LipaClip */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pt-24">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Marketing spend you can check</h2>
        <p className="text-stone-600 text-sm mb-8 max-w-lg">Most influencer budgets go on trust. These go on views you can see on your dashboard.</p>
        <dl className="grid sm:grid-cols-2 border-t border-stone-200">
          {BRAND_POINTS.map((pt, i) => (
            <div key={pt.title} className={`py-5 border-b border-stone-200 ${i % 2 === 0 ? 'sm:pr-8' : 'sm:pl-8 sm:border-l'}`}>
              <dt className="text-stone-900 font-semibold mb-1">{pt.title}</dt>
              <dd className="text-stone-600 text-sm leading-relaxed">{pt.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Campaign types */}
      <section className="max-w-5xl mx-auto px-5 sm:px-6 pt-24">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">Three ways to run a campaign</h2>
        <dl className="border-t border-stone-200">
          {CAMPAIGN_TYPES.map(t => (
            <div key={t.title} className="grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-6 py-5 border-b border-stone-200">
              <dt className="font-display font-bold text-stone-900">{t.title}</dt>
              <dd className="text-stone-600 text-sm leading-relaxed">{t.desc}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* For creators: the one dark block */}
      <section className="mt-24 bg-stone-900 text-stone-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 grid md:grid-cols-[1.3fr_1fr] gap-8 items-center">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">Your views are worth money</h2>
            <p className="text-stone-300 text-sm leading-relaxed max-w-lg">
              Pick a live campaign, post it on your own channel and submit the link. You earn for every verified view and withdraw to MTN Mobile Money. Joining is free.
            </p>
          </div>
          <div className="md:text-right">
            <Link to="/signup?role=influencer" className={cta}>Start earning</Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-5 sm:px-6 pt-24 scroll-mt-20">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">Pricing</h2>
        <p className="text-stone-600 text-sm mb-8 max-w-lg">No subscription. Brands fund a budget and pay a small service fee. Creators join free.</p>
        <div className="grid md:grid-cols-2 border-t border-stone-200">
          <div className="py-6 md:pr-10 border-b border-stone-200">
            <h3 className="text-stone-500 text-sm mb-1">Brands</h3>
            <div className="font-display text-4xl font-extrabold text-stone-900 mb-3 tabular-nums">{fees.deposit !== null ? `${fees.deposit}%` : 'Small fee'}</div>
            <ul className="text-stone-600 text-sm space-y-1.5">
              <li>Charged on top of your campaign budget</li>
              <li>You set the budget and the rate per 1,000 views</li>
              <li>Spend can never go above your budget</li>
              <li>Shown to you before you pay</li>
            </ul>
          </div>
          <div className="py-6 md:pl-10 md:border-l border-b border-stone-200">
            <h3 className="text-stone-500 text-sm mb-1">Creators</h3>
            <div className="font-display text-4xl font-extrabold text-stone-900 mb-3">Free to join</div>
            <ul className="text-stone-600 text-sm space-y-1.5">
              <li>Earn for every verified view</li>
              <li>A service fee applies when you withdraw</li>
              <li>Payouts go to MTN Mobile Money</li>
            </ul>
          </div>
        </div>
        <p className="text-stone-500 text-xs mt-4">Full details are in the <Link to="/terms" className="underline hover:text-stone-900">Terms</Link>.</p>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-5 sm:px-6 pt-24 scroll-mt-20">
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-8">Questions</h2>
        <div className="border-t border-stone-200">
          {FAQS.map((f, i) => (
            <details key={f.q} open={i === 0} className="group border-b border-stone-200">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-4 text-sm font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span aria-hidden="true" className="text-brand-700 text-xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-4 text-stone-600 text-sm leading-relaxed max-w-prose">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-3xl mx-auto px-5 sm:px-6 py-24 text-center">
        <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">Set a budget. Pay for views.</h2>
        <p className="text-stone-600 text-sm mb-6">Your first campaign takes a few minutes to set up.</p>
        <Link to="/signup?role=brand" className={cta}>Launch a campaign</Link>
      </section>

      <footer className="border-t border-stone-200 px-5 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-3 text-stone-500 text-sm">
        <span>2026 LipaClip. lipaclip.site</span>
        <span className="flex gap-5">
          <Link to="/terms" className="hover:text-stone-900">Terms</Link>
          <Link to="/privacy" className="hover:text-stone-900">Privacy</Link>
        </span>
      </footer>
    </div>
  )
}
