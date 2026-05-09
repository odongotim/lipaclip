import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Campaign = {
  id: string; title: string; type: string; thumbnail_url: string | null
  budget: number; spent: number; period_days: number; platforms: string[]
}

const PLATFORM_ICONS: Record<string, string> = {
  tiktok: '🎵', instagram: '📸', youtube: '▶️', x: '🐦'
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
      <nav className="flex items-center justify-between px-8 py-5 border-b border-yellow-900/30">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="LipaClip" className="w-10 h-10 rounded-full" />
          <span className="text-yellow-500 text-2xl font-bold tracking-tight">Lipa<span className="text-white">Clip</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white text-sm">Login</Link>
          <Link to="/signup" className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-block bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-widest uppercase">
          Uganda's #1 Influencer Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Clip. Post.<br /><span className="text-yellow-500">Get Paid.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Connect brands with creators. Run campaigns, track views, and pay only for real results.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/signup?role=brand" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition text-sm">I'm a Brand</Link>
          <Link to="/signup?role=influencer" className="border border-yellow-500/40 hover:border-yellow-500 text-yellow-400 font-bold px-8 py-3 rounded-xl transition text-sm">I'm an Influencer</Link>
        </div>
      </section>

      {/* Live Campaigns */}
      {campaigns.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Live Campaigns</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl overflow-hidden">
                {/* Thumbnail - brand logo */}
                <div className="w-full h-36 bg-yellow-500/10 flex items-center justify-center overflow-hidden relative">
                  {camp.thumbnail_url
                    ? <img src={camp.thumbnail_url} alt={camp.title} className="w-full h-full object-cover" />
                    : <span className="text-4xl">🎬</span>
                  }
                  <span className="absolute top-2 right-2 bg-black/60 text-yellow-400 text-xs px-2 py-0.5 rounded-full capitalize">{camp.type}</span>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-2">{camp.title}</h3>

                  {/* Platform icons */}
                  {camp.platforms && (
                    <div className="flex gap-1 mb-2">
                      {camp.platforms.map(p => <span key={p} className="text-base">{PLATFORM_ICONS[p]}</span>)}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
                    <span>⏱ {camp.period_days} days</span>
                    <span>💰 {fmtUGX(camp.budget)}</span>
                  </div>

                  {/* Budget progress */}
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
            <Link to="/signup?role=influencer" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition text-sm">Join & Start Earning →</Link>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6 max-w-3xl mx-auto px-6 pb-16">
        {[{ label: 'Active Campaigns', value: '50+' }, { label: 'Creators Paid', value: 'UGX 2M+' }, { label: 'Verified Influencers', value: '100+' }].map(stat => (
          <div key={stat.label} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 text-center">
            <div className="text-yellow-500 text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-gray-400 text-xs">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[{ step: '01', title: 'Brand Posts Campaign', desc: 'Set budget, campaign type and pay per 1k views.' }, { step: '02', title: 'Influencer Creates Content', desc: 'Creators post videos and submit their links.' }, { step: '03', title: 'Get Paid', desc: 'Admin tracks views and processes payments.' }].map(item => (
            <div key={item.step} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
              <div className="text-yellow-500/40 text-5xl font-bold mb-4">{item.step}</div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-yellow-900/30 px-8 py-6 text-center text-gray-500 text-sm">
        © 2026 LipaClip. All rights reserved. — lipaclip.site
        <span className="mx-2">·</span>
        <Link to="/terms" className="hover:text-gray-300">Terms</Link>
        <span className="mx-2">·</span>
        <Link to="/privacy" className="hover:text-gray-300">Privacy</Link>
      </footer>
    </div>
  )
}
