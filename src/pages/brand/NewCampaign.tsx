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

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'x', label: 'X (Twitter)', icon: '🐦' },
]

export default function NewCampaign() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('clipping')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [useLink, setUseLink] = useState(true)
  const [instructions, setInstructions] = useState('')
  const [payPer1k, setPayPer1k] = useState(0)
  const [periodDays, setPeriodDays] = useState(7)
  const [budget, setBudget] = useState(0)
  const [platforms, setPlatforms] = useState<string[]>(['tiktok'])
  const [txId, setTxId] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
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

  const togglePlatform = (id: string) => {
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 15 * 1024 * 1024) {
      setError('File exceeds 15MB. Please use a link instead (see Terms).')
      e.target.value = ''
      return
    }
    setSourceFile(file)
    setError('')
  }

  const handleProceedToPayment = () => {
    setError('')
    if (!title.trim()) { setError('Campaign title is required'); return }
    if (!instructions.trim()) { setError('Posting instructions are required'); return }
    if (type !== 'ugc') {
      if (useLink && !sourceUrl.trim()) { setError('Source URL is required'); return }
      if (!useLink && !sourceFile) { setError('Please upload a file or use a link'); return }
    }
    if (platforms.length === 0) { setError('Please select at least one platform'); return }
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
      let finalSourceUrl = sourceUrl

      // Upload file if provided
      if (!useLink && sourceFile && type !== 'ugc') {
        setUploading(true)
        const fileExt = sourceFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('campaign-files')
          .upload(fileName, sourceFile)

        if (uploadError) throw new Error('File upload failed: ' + uploadError.message)
        const { data: { publicUrl } } = supabase.storage.from('campaign-files').getPublicUrl(fileName)
        finalSourceUrl = publicUrl
        setUploading(false)
      }

      const { data: campaign, error: campError } = await supabase.from('campaigns').insert({
        brand_id: user.id, title, type,
        source_url: type !== 'ugc' ? finalSourceUrl : null,
        instructions, pay_per_1k: payPer1k, period_days: periodDays, budget,
        thumbnail_url: profile?.logo_url || null,
        platforms: platforms,
        status: 'pending',
      }).select().single()

      if (campError || !campaign) throw new Error(campError?.message || 'Failed to create campaign')

      await supabase.from('deposits').insert({
        brand_id: user.id, campaign_id: campaign.id,
        amount: budget, service_fee: fee, total_charged: total,
        pesapal_merchant_reference: txId,
        status: 'pending',
      })

      alert('Campaign submitted! Admin will verify your payment and activate it.')
      navigate('/brand')
    } catch (err: any) {
      setError(err.message || 'Failed to submit')
      setLoading(false)
      setUploading(false)
    }
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-[#0f0a06] flex">
        <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
        <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
          <h1 className="text-white text-2xl font-bold mb-1">Complete Payment</h1>
          <p className="text-gray-400 text-sm mb-8">Pay via Mobile Money to activate your campaign</p>
          <div className="max-w-lg">
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">📱 Payment Instructions</h2>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'Dial USSD code', desc: <span>On your phone dial <span className="text-yellow-500 font-bold text-base">*165*3#</span></span> },
                  { step: '2', title: 'Enter Merchant Code', desc: <span>Merchant code: <span className="text-yellow-500 font-bold text-base">934101</span></span> },
                  { step: '3', title: 'Enter Amount', desc: <span>Amount: <span className="text-yellow-500 font-bold text-base">{fmtUGX(total)}</span></span> },
                  { step: '4', title: 'Get Transaction ID', desc: <span>You will receive an SMS with a Transaction ID</span> },
                ].map(item => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="bg-yellow-500 text-black text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{item.step}</span>
                    <div><p className="text-white text-sm font-semibold">{item.title}</p><p className="text-gray-400 text-xs mt-0.5">{item.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-black/40 border border-yellow-500/20 rounded-xl p-4 space-y-2 mb-6">
              <h3 className="text-white font-semibold text-sm mb-3">Payment Summary</h3>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Campaign</span><span className="text-white truncate ml-4">{title}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Budget</span><span className="text-white">{fmtUGX(budget)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Service Fee ({settings?.deposit_fee_pct}%)</span><span className="text-yellow-500">{fmtUGX(fee)}</span></div>
              <div className="border-t border-yellow-900/30 pt-2 flex justify-between text-sm font-bold"><span className="text-white">Total</span><span className="text-yellow-500">{fmtUGX(total)}</span></div>
            </div>

            <div className="mb-4">
              <label className="text-gray-400 text-sm mb-1 block">Mobile Money Transaction ID</label>
              <input type="text" value={txId} onChange={e => setTxId(e.target.value)} placeholder="e.g. TXN1234567890"
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
              <p className="text-gray-500 text-xs mt-1">Enter the transaction ID from your Mobile Money SMS</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep('form')} className="flex-1 border border-yellow-500/30 text-gray-400 font-semibold py-3 rounded-xl text-sm hover:border-yellow-500/50 transition">← Back</button>
              <button onClick={handleSubmit} disabled={loading || uploading || !txId.trim()}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition text-sm">
                {uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit Campaign'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0a06] flex">
      <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">New Campaign</h1>
        <p className="text-gray-400 text-sm mb-8">Fill in the details to launch your campaign</p>
        <div className="max-w-2xl">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

          {/* Logo preview */}
          {profile?.logo_url && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-4 flex items-center gap-3">
              <img src={profile.logo_url} alt="Brand logo" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <p className="text-white text-sm font-semibold">Your logo will appear as the campaign thumbnail</p>
                <p className="text-gray-500 text-xs">Change it in Settings</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 space-y-5">
            {/* Campaign Type */}
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

            {/* Platforms */}
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Target Platforms <span className="text-gray-600">(select all that apply)</span></label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition ${platforms.includes(p.id) ? 'bg-yellow-500/20 border-yellow-500 text-white' : 'bg-black/40 border-yellow-500/20 text-gray-400 hover:border-yellow-500/50'}`}>
                    <span>{p.icon}</span><span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Campaign Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Promote Our New App"
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>

            {/* Source material - only for logo and clipping */}
            {type !== 'ugc' && (
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Campaign Material</label>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setUseLink(true)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${useLink ? 'bg-yellow-500/20 border-yellow-500 text-white' : 'bg-black/40 border-yellow-500/20 text-gray-400'}`}>🔗 Use Link</button>
                  <button onClick={() => setUseLink(false)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${!useLink ? 'bg-yellow-500/20 border-yellow-500 text-white' : 'bg-black/40 border-yellow-500/20 text-gray-400'}`}>📁 Upload File</button>
                </div>
                {useLink ? (
                  <input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://drive.google.com/..."
                    className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
                ) : (
                  <div>
                    <input type="file" accept="video/*,image/*,.zip" onChange={handleFileChange}
                      className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-yellow-500 file:text-black file:font-semibold" />
                    <p className="text-gray-500 text-xs mt-1">Max 15MB. For larger files, use a link (<a href="/terms" className="text-yellow-500 underline">see Terms</a>)</p>
                    {sourceFile && <p className="text-green-400 text-xs mt-1">✓ {sourceFile.name} ({(sourceFile.size / 1024 / 1024).toFixed(1)}MB)</p>}
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Posting Instructions</label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
                placeholder="Describe how influencers should post this campaign..."
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition resize-none" />
            </div>

            {/* Pay per 1k */}
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Pay per 1,000 views (UGX) {settings && <span className="text-gray-600 ml-2 text-xs">Min: {fmtUGX(getMinPerk())} — Max: {fmtUGX(getMaxPerk())}</span>}</label>
              <input type="number" value={payPer1k || ''} onChange={e => setPayPer1k(Number(e.target.value))}
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>

            {/* Period */}
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Campaign Period (days)</label>
              <input type="number" value={periodDays} min={1} max={90} onChange={e => setPeriodDays(Number(e.target.value))}
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
            </div>

            {/* Budget */}
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Budget (UGX) {settings && <span className="text-gray-600 ml-2 text-xs">Min: {fmtUGX(getMinBudget())} — Max: {fmtUGX(getMaxBudget())}</span>}</label>
              <input type="number" value={budget || ''} onChange={e => setBudget(Number(e.target.value))}
                className="w-full bg-black/40 border border-yellow-500/20 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-yellow-500 transition" />
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
