import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0f0a06] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-yellow-900/30">
        <div className="flex items-center gap-3">
    <img src="https://drive.google.com/uc?id=1F_ykFi9TIRjjaBooXOTPeuMmRSUjD64O" alt="LipaClip" className="w-10 h-10 rounded-full" />
    <span className="text-gold-400 text-2xl font-bold tracking-tight">Lipa<span className="text-white">Clip</span></span>
  </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white text-sm">Login</Link>
          <Link to="/signup" className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
          Clip. Post.<br />
          <span className="text-yellow-500">Get Paid.</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Connect brands with creators. Run campaigns, track views, and pay only for real results.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/signup?role=brand" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-3 rounded-xl transition text-sm">
            I'm a Brand
          </Link>
          <Link to="/signup?role=influencer" className="border border-yellow-500/40 hover:border-yellow-500 text-yellow-400 font-bold px-8 py-3 rounded-xl transition text-sm">
            I'm an Influencer
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6 max-w-3xl mx-auto px-6 pb-20">
        {[
          { label: 'Active Campaigns', value: '50+' },
          { label: 'Creators Paid', value: 'UGX 2M+' },
          { label: 'Verified Influencers', value: '100+' },
        ].map((stat) => (
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
          {[
            { step: '01', title: 'Brand Posts Campaign', desc: 'Set your budget, campaign type and pay per 1k views.' },
            { step: '02', title: 'Influencer Creates Content', desc: 'Creators post videos and submit their links.' },
            { step: '03', title: 'Get Paid Automatically', desc: 'Views are tracked and payments sent instantly.' },
          ].map((item) => (
            <div key={item.step} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
              <div className="text-yellow-500/40 text-5xl font-bold mb-4">{item.step}</div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-yellow-900/30 px-8 py-6 text-center text-gray-500 text-sm">
        © 2026 LipaClip. All rights reserved. — lipaclip.site
      </footer>
    </div>
  )
}