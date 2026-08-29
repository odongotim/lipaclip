import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Campaign = {
  id: string; title: string; type: string; thumbnail_url: string | null
  budget: number; spent: number; period_days: number; platforms: string[]
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: 'TikTok', instagram: 'Instagram', youtube: 'YouTube', x: 'X'
}

export default function Landing() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  useEffect(() => {
    supabase.from('campaigns').select('id, title, type, thumbnail_url, budget, spent, period_days, platforms')
      .eq('status', 'live').order('created_at', { ascending: false }).limit(6)
      .then(({ data }) => { if (data) setCampaigns(data) })
  }, [])

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  return (
    <div className="min-h-screen bg-[#0f0a06] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-yellow-900/30 sticky top-0 z-30 bg-[#0f0a06]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="LipaClip" className="w-10 h-10 rounded-full" />
          <span className="font-display text-yellow-500 text-2xl font-bold tracking-tight">Lipa<span className="text-white">Clip</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white text-sm transition-colors">Login</Link>
          <Link to="/signup" className="gold-shimmer bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-yellow-500/10 blur-[120px]" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-yellow-500 text-sm font-semibold tracking-wide uppercase mb-4">Built in Lira, for creators across Uganda</p>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] mb-6 tracking-tight">
              Clip it. Post it.<br /><span className="text-yellow-500">Get paid in shillings.</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-md mb-10">
              Brands post campaigns, creators cut and post the content, and payouts land straight in MTN Mobile Money. No middlemen, no waiting on invoices.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link to="/signup?role=brand" className="gold-shimmer bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition-colors text-sm shadow-lg shadow-yellow-500/10">I'm a Brand</Link>
              <Link to="/signup?role=influencer" className="border border-yellow-500/40 hover:border-yellow-500 hover:bg-yellow-500/5 text-yellow-400 font-bold px-8 py-3 rounded-xl transition-colors text-sm">I'm a Creator</Link>
            </div>
          </div>

          {/*
            REAL PHOTO GOES HERE.
            Drop an actual photo of a Ugandan creator filming or reviewing
            a clip on their phone into src/assets/hero-photo.jpg (portrait,
            roughly 900x1100px), then swap the placeholder below for:
            <img src={heroPhoto} alt="A creator filming content on their phone"
                 className="w-full h-full object-cover rounded-3xl" />
            Free, properly licensed options if you don't have one on hand yet:
            search "content creator phone Africa" on Pexels or Unsplash.
          */}
          <div className="relative aspect-[4/5] rounded-3xl border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-center overflow-hidden">
            <span className="text-gray-500 text-sm text-center px-6">Real photo of a creator at work goes here</span>
          </div>
        </div>
      </section>

      {/* Live Campaigns */}
      {campaigns.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Live Campaigns</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl overflow-hidden">
                {/* Thumbnail comes from the brand's own upload, so this is already a real image when set */}
                <div className="w-full h-36 bg-yellow-500/10 flex items-center justify-center overflow-hidden relative">
                  {camp.thumbnail_url
                    ? <img src={camp.thumbnail_url} alt={camp.title} className="w-full h-full object-cover" />
                    : <span className="text-gray-500 text-xs">No thumbnail yet</span>
                  }
                  <span className="absolute top-2 right-2 bg-black/60 text-yellow-400 text-xs px-2 py-0.5 rounded-full capitalize">{camp.type}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2">{camp.title}</h3>

                  {camp.platforms && (
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      {camp.platforms.map(p => (
                        <span key={p} className="text-[10px] uppercase tracking-wide bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">
                          {PLATFORM_LABELS[p] || p}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                    <span>{camp.period_days} days</span>
                    <span>{fmtUGX(camp.budget)} budget</span>
                  </div>

                  <div className="w-full bg-yellow-900/30 rounded-full h-1.5">
                    <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${Math.min(((camp.spent || 0) / camp.budget) * 100, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{fmtUGX(camp.spent || 0)} used</span>
                    <span>{fmtUGX(camp.budget - (camp.spent || 0))} left</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/signup?role=influencer" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition text-sm">Join and start earning</Link>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="grid grid-cols-3 gap-3 sm:gap-6 max-w-3xl mx-auto px-6 pb-16">
        {[{ label: 'Active Campaigns', value: '50+' }, { label: 'Creators Paid', value: 'UGX 2M+' }, { label: 'Verified Influencers', value: '100+' }].map(stat => (
          <div key={stat.label} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-3 sm:p-6 text-center min-w-0">
            <div className="text-yellow-500 text-xl sm:text-2xl md:text-3xl font-bold mb-1 leading-tight break-words">{stat.value}</div>
            <div className="text-gray-400 text-[10px] sm:text-xs leading-snug">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[{ step: '01', title: 'Brand Posts Campaign', desc: 'Set a budget, pick a campaign type and set the rate per 1,000 views.' }, { step: '02', title: 'Creator Makes Content', desc: 'Creators cut a video, post it on their own channel and submit the link.' }, { step: '03', title: 'Everyone Gets Paid', desc: 'Views are tracked, and payment lands in Mobile Money once verified.' }].map(item => (
            <div key={item.step} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
              <div className="text-yellow-500/40 text-5xl font-bold mb-4">{item.step}</div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-yellow-900/30 px-8 py-6 text-center text-gray-500 text-sm">
        2026 LipaClip. All rights reserved. lipaclip.site
        <span className="mx-2">·</span>
        <Link to="/terms" className="hover:text-gray-300">Terms</Link>
        <span className="mx-2">·</span>
        <Link to="/privacy" className="hover:text-gray-300">Privacy</Link>
      </footer>
    </div>
  )
}
