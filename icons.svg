import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BrandSidebar from '../../components/BrandSidebar'

type Settings = {
  logo_min_budget: number; logo_max_budget: number; logo_min_perk: number; logo_max_perk: number
  clip_min_budget: number; clip_max_budget: number; clip_min_perk: number; clip_max_perk: number
  ugc_min_budget: number; ugc_max_budget: number; ugc_min_perk: number; ugc_max_perk: number
  deposit_fee_pct: number
}

export default function NewCampaign() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('clipping')
  const [sourceUrl, setSourceUrl] = useState('')
  const [instructions, setInstructions] = useState('')
  const [payPer1k, setPayPer1k] = useState(0)
  const [periodDays, setPeriodDays] = useState(7)
  const [budget, setBudget] = useState(0)
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [txId, setTxId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'payment'>('form')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'brand') { navigate('/'); return }
    setProfile(prof)
    const { data } = await supabase.from('platform_settings').select('*').eq('id', 1).single()
    if (data) setSettings(data)
  }

  const getMinBudget = () => { if (!settings) return 0; if (type === 'logo') return settings.logo_min_budget; if (type === 'clipping') return settings.clip_min_budget; return settings.ugc_min_budget }
  const getMaxBudget = () => { if (!settings) return 0; if (type === 'logo') return settings.logo_max_budget; if (type === 'clipping') return settings.clip_max_budget; return settings.ugc_max_budget }
  const getMinPerk = () => { if (!settings) return 0; if (type === 'logo') return settings.logo_min_perk; if (type === 'clipping') return settings.clip_min_perk; return settings.ugc_min_perk }
  const getMaxPerk = () => { if (!settings) return 0; if (type === 'logo') return settings.logo_max_perk; if (type === 'clipping') return settings.clip_max_perk; return settings.ugc_max_perk }

  const fee = settings ? Math.round((budget * settings.deposit_fee_pct) / 100) : 0
  const total = budget + fee
  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  const handleProceedToPayment = () => {
    setError('')
    if (!title.trim()) { setError('Campaign title is required'); return }
    if (!instructions.trim()) { setError('Posting instructions are required'); return }
    if (type !== 'ugc' && !sourceUrl.trim()) { setError('Source URL is required'); return }
    if (payPer1k < getMinPerk()) { setError(`Min pay per 1k views is ${fmtUGX(getMinPerk())}`); return }
    if (payPer1k > getMaxPerk()) { setError(`Max pay per 1k views is ${fmtUGX(getMaxPerk())}`); return }
    if (budget < getMinBudget()) { setError(`Min budget is ${fmtUGX(getMinBudget())}`); return }
    if (budget > getMaxBudget()) { setError(`Max budget is ${fmtUGX(getMaxBudget())}`); return }
    setStep('payment')
  }

  const handleSubmit = async () => {
    setError('')
    if (!txId.trim()) { setError('Please enter your Mobile Money transaction ID'); return }
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    try {
      const { data: campaign, error: campError } = await supabase.from('campaigns').insert({
        brand_id: user.id, title, type,
        source_url: type !== 'ugc' ? sourceUrl : null,
        instructions, pay_per_1k: payPer1k, period_days: periodDays, budget,
        thumbnail_url: thumbnailUrl || null,
        status: 'pending',
      }).select().single()

      if (campError || !campaign) throw new Error(campError?.message || 'Failed to create campaign')

      await supabase.from('deposits').insert({
        brand_id: user.id, campaign_id: campaign.id,
        amount: budget, service_fee: fee, total_charged: total,
        pesapal_merchant_reference: txId,
        status: 'pending',
      })

      alert('Campaign submitted! Admin will verify your payment and activate the campaign.')
      navigate('/brand')
    } catch (err: any) {
      setError(err.message || 'Failed to submit')
      setLoading(false)
    }
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-[#0f0a06] flex">
        <BrandSidebar userName={profile?.display_name} />
        <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
          <h1 className="text-white text-2xl font-bold mb-1">Complete Payment</h1>
          <p className="text-gray-400 text-sm mb-8">Follow the steps below to pay via Mobile Money</p>
          <div className="max-w-lg">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

            {/* Payment instructions */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">📱 Payment Instructions</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Dial the USSD code</p>
                    <p className="text-gray-400 text-xs mt-0.5">On your phone, dial <span className="text-yellow-500 font-bold text-base">*165*3#</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Enter Merchant Code</p>
                    <p className="text-gray-400 text-xs mt-0.5">Merchant code: <span className="text-yellow-500 font-bold text-base">852760</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Enter Amount</p>
                    <p className="text-gray-400 text-xs mt-0.5">Amount to pay: <span className="text-yellow-500 font-bold text-base">{fmtUGX(total)}</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-yellow-500 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                  <div>
                    <p className="text-white text-sm font-semibold">Confirm & get Transaction ID</p>
                    <p className="text-gray-400 text-xs mt-0.5">You will receive an SMS with a Transaction ID</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-4 space-y-2 mb-6">
              <h3 className="text-white font-semibold text-sm mb-3">Payment Summary</h3>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Campaign</span><span className="text-white truncate ml-4">{title}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Budget</span><span className="text-white">{fmtUGX(budget)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Service Fee ({settings?.deposit_fee_pct}%)</span><span className="text-yellow-500">{fmtUGX(fee)}</span></div>
              <div className="border-t border-yellow-900/30 pt-2 flex justify-between text-sm font-bold">
                <span className="text-white">Total to Pay</span>
                <span className="text-yellow-500">{fmtUGX(total)}</span>
              </div>
            </div>

            {/* Transaction ID input */}
            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-1 block">Mobile Money Transaction ID</label>
              <input
                type="text"
                value={txId}
                onChange={e => setTxId(e.target.value)}
                placeholder="e.g. TXN1234567890"
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition"
              />
              <p className="text-gray-500 text-xs mt-1">Enter the transaction ID from your Mobile Money SMS</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="flex-1 border border-yellow-500/30 text-gray-400 font-semibold py-3 rounded-xl text-sm hover:border-yellow-500/50 transition">
                ← Back
              </button>
              <button onClick={handleSubmit} disabled={loading || !txId.trim()}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition text-sm">
                {loading ? 'Submitting...' : 'Submit Campaign'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0a06] flex">
      <BrandSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">New Campaign</h1>
        <p className="text-gray-400 text-sm mb-8">Fill in the details to launch your campaign</p>
        <div className="max-w-2xl">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 space-y-5">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Campaign Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[{ value: 'logo', label: '🏷️ Logo', desc: 'Brand logo promotion' }, { value: 'clipping', label: '✂️ Clipping', desc: 'Clip & repost content' }, { value: 'ugc', label: '🎨 UGC', desc: 'User generated content' }].map(t => (
                  <button key={t.value} onClick={() => setType(t.value)} className={`p-3 rounded-xl border text-left transition ${type === t.value ? 'bg-yellow-500/20 border-yellow-500 text-white' : 'bg-black/40 border-yellow-500/20 text-gray-400 hover:border-yellow-500/50'}`}>
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Campaign Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Promote Our New App" className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Thumbnail URL <span className="text-gray-600">(optional)</span></label>
              <input type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://example.com/image.jpg" className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            {type !== 'ugc' && (
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Source URL</label>
                <input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://drive.google.com/..." className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
              </div>
            )}
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Posting Instructions</label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4} placeholder="Describe how influencers should post this campaign..." className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition resize-none" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Pay per 1,000 views (UGX) {settings && <span className="text-gray-600 ml-2 text-xs">Min: {fmtUGX(getMinPerk())} — Max: {fmtUGX(getMaxPerk())}</span>}</label>
              <input type="number" value={payPer1k || ''} onChange={e => setPayPer1k(Number(e.target.value))} className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Campaign Period (days)</label>
              <input type="number" value={periodDays} min={1} max={90} onChange={e => setPeriodDays(Number(e.target.value))} className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Budget (UGX) {settings && <span className="text-gray-600 ml-2 text-xs">Min: {fmtUGX(getMinBudget())} — Max: {fmtUGX(getMaxBudget())}</span>}</label>
              <input type="number" value={budget || ''} onChange={e => setBudget(Number(e.target.value))} className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>
            {budget > 0 && (
              <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-4 space-y-2">
                <h3 className="text-white font-semibold text-sm mb-3">Payment Summary</h3>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Campaign Budget</span><span className="text-white">{fmtUGX(budget)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Service Fee ({settings?.deposit_fee_pct}%)</span><span className="text-yellow-500">{fmtUGX(fee)}</span></div>
                <div className="border-t border-yellow-900/30 pt-2 flex justify-between text-sm font-bold"><span className="text-white">Total to Pay</span><span className="text-yellow-500">{fmtUGX(total)}</span></div>
              </div>
            )}
            <button onClick={handleProceedToPayment} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition text-sm">
              Proceed to Payment →
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
