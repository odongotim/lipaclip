import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BrandSidebar from '../../components/BrandSidebar'
import { isValidMomoPhone } from '../../lib/momo'

type Settings = {
  logo_min_budget: number; logo_max_budget: number; logo_min_perk: number; logo_max_perk: number
  clip_min_budget: number; clip_max_budget: number; clip_min_perk: number; clip_max_perk: number
  ugc_min_budget: number; ugc_max_budget: number; ugc_min_perk: number; ugc_max_perk: number
  deposit_fee_pct: number
}

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'x', label: 'X (Twitter)' },
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
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'payment' | 'waiting'>('form')
  const [campaignId, setCampaignId] = useState<string | null>(null)
  const [momoPhone, setMomoPhone] = useState('')
  const [momoState, setMomoState] = useState<'polling' | 'success' | 'failed'>('polling')
  const [momoMessage, setMomoMessage] = useState('')

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

  const handleValidate = () => {
    setError('')
    if (!title.trim()) { setError('Campaign title is required'); return false }
    if (!instructions.trim()) { setError('Posting instructions are required'); return false }
    if (type !== 'ugc') {
      if (useLink && !sourceUrl.trim()) { setError('Source URL is required'); return false }
      if (!useLink && !sourceFile) { setError('Please upload a file or use a link'); return false }
    }
    if (platforms.length === 0) { setError('Please select at least one platform'); return false }
    if (payPer1k < getMinPerk()) { setError(`Min pay per 1k views is ${fmtUGX(getMinPerk())}`); return false }
    if (payPer1k > getMaxPerk()) { setError(`Max pay per 1k views is ${fmtUGX(getMaxPerk())}`); return false }
    if (budget < getMinBudget()) { setError(`Min budget is ${fmtUGX(getMinBudget())}`); return false }
    if (budget > getMaxBudget()) { setError(`Max budget is ${fmtUGX(getMaxBudget())}`); return false }
    return true
  }

  const handleProceedToPayment = async () => {
    if (!handleValidate()) return
    setLoading(true)
    setError('')

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

      // Create campaign as pending — goes live only after admin verifies payment
      const { data: campaign, error: campError } = await supabase.from('campaigns').insert({
        brand_id: user.id, title, type,
        source_url: type !== 'ugc' ? finalSourceUrl : null,
        instructions, pay_per_1k: payPer1k, period_days: periodDays, budget,
        thumbnail_url: profile?.logo_url || null,
        platforms,
        status: 'pending',
      }).select().single()

      if (campError || !campaign) throw new Error(campError?.message || 'Failed to create campaign')

      setCampaignId(campaign.id)
      setStep('payment')
      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to proceed')
      setLoading(false)
      setUploading(false)
    }
  }

  const handleSubmitPayment = async () => {
    if (!campaignId) { setError('Campaign not found. Please go back and try again.'); return }
    if (!isValidMomoPhone(momoPhone)) { setError('Enter a valid MTN Mobile Money number, e.g. 0771234567'); return }
    setLoading(true)
    setError('')

    try {
      const { data, error: fnError } = await supabase.functions.invoke('momo-request-to-pay', {
        body: { campaignId, amount: total, phone: momoPhone },
      })

      if (fnError || !data?.reference_id) {
        throw new Error(data?.error || fnError?.message || 'Could not start MTN Mobile Money payment')
      }

      setLoading(false)
      setStep('waiting')
      setMomoState('polling')
      setMomoMessage('Approve the payment prompt sent to your phone...')
      pollDepositStatus(data.reference_id)
    } catch (err: any) {
      setError(err.message || 'Failed to start payment')
      setLoading(false)
    }
  }

  const pollDepositStatus = async (referenceId: string, attempt = 0) => {
    // MTN sandbox usually resolves within a few seconds; poll for up to ~2 minutes.
    if (attempt > 30) {
      setMomoState('failed')
      setMomoMessage('This is taking longer than expected. Check back shortly — an admin can also verify it manually.')
      return
    }

    try {
      const { data } = await supabase.functions.invoke('momo-check-deposit-status', {
        body: { referenceId },
      })

      if (data?.status === 'SUCCESSFUL') {
        setMomoState('success')
        setMomoMessage('Payment received! Your campaign is now LIVE.')
        return
      }
      if (data?.status === 'FAILED') {
        setMomoState('failed')
        setMomoMessage('The payment was not completed. You can try again.')
        return
      }
    } catch {
      // network hiccup — just retry
    }

    setTimeout(() => pollDepositStatus(referenceId, attempt + 1), 4000)
  }

  // Payment step
  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-stone-50 flex">
        <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
        <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
          <h1 className="text-stone-900 text-2xl font-bold mb-1">Complete Payment</h1>
          <p className="text-stone-500 text-sm mb-8">Pay via MTN Mobile Money to activate your campaign</p>
          <div className="max-w-lg">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
            )}

            {/* Checkout preview */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0"><svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-9 4h16a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
              <div>
                <h2 className="text-stone-900 font-bold text-lg">MTN Mobile Money</h2>
                <p className="text-stone-500 text-xs mt-0.5">You'll get a prompt on your phone to approve the payment.</p>
              </div>
            </div>

            {/* Phone number */}
            <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-6">
              <label className="text-stone-500 text-sm mb-1 block">MTN Mobile Money Number</label>
              <input
                type="tel"
                value={momoPhone}
                onChange={e => setMomoPhone(e.target.value)}
                placeholder="e.g. 0771234567"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Payment summary */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2 mb-6">
              <h3 className="text-stone-900 font-semibold text-sm mb-3">Payment Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Campaign</span>
                <span className="text-stone-900 truncate ml-4">{title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Budget</span>
                <span className="text-stone-900">{fmtUGX(budget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">Service Fee ({settings?.deposit_fee_pct}%)</span>
                <span className="text-amber-600">{fmtUGX(fee)}</span>
              </div>
              <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold">
                <span className="text-stone-900">Total to Pay</span>
                <span className="text-amber-600">{fmtUGX(total)}</span>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <p className="text-blue-700 text-xs">A payment prompt will be sent to your phone via MTN Mobile Money. Your campaign goes <strong>LIVE</strong> automatically the moment you approve it.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('form'); setError('') }}
                className="flex-1 border border-stone-300 text-stone-500 font-semibold py-3 rounded-xl text-sm hover:border-amber-400 transition"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={loading}
                className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm"
              >
                {loading ? 'Sending prompt...' : 'Pay with MTN MoMo'}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Waiting step — polling MTN MoMo for the request-to-pay outcome
  if (step === 'waiting') {
    return (
      <div className="min-h-screen bg-stone-50 flex">
        <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
        <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
          <div className="max-w-lg mx-auto text-center pt-12">
            <div className="bg-white border border-stone-200 rounded-2xl p-8">
              {momoState === 'polling' && (
                <>
                  <svg className="w-12 h-12 text-amber-600 mx-auto mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  <h2 className="text-stone-900 font-bold text-xl mb-2">Check your phone</h2>
                  <p className="text-stone-500 text-sm">{momoMessage}</p>
                </>
              )}
              {momoState === 'success' && (
                <>
                  <svg className="w-12 h-12 text-green-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h2 className="text-stone-900 font-bold text-xl mb-2">Payment Successful!</h2>
                  <p className="text-stone-500 text-sm mb-6">{momoMessage}</p>
                  <button onClick={() => navigate('/brand')} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition text-sm">
                    Go to Dashboard
                  </button>
                </>
              )}
              {momoState === 'failed' && (
                <>
                  <svg className="w-12 h-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  <h2 className="text-stone-900 font-bold text-xl mb-2">Payment Not Completed</h2>
                  <p className="text-stone-500 text-sm mb-6">{momoMessage}</p>
                  <div className="space-y-2">
                    <button onClick={() => { setStep('payment'); setError('') }} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-lg transition text-sm">
                      Try Again
                    </button>
                    <button onClick={() => navigate('/brand')} className="w-full border border-stone-300 text-stone-500 font-semibold py-3 rounded-lg transition text-sm hover:border-amber-400">
                      Back to Dashboard
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Form step
  return (
    <div className="min-h-screen bg-stone-50 flex">
      <BrandSidebar userName={profile?.display_name} logoUrl={profile?.logo_url} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">New Campaign</h1>
        <p className="text-stone-500 text-sm mb-8">Fill in the details to launch your campaign</p>
        <div className="max-w-2xl">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
          )}

          {/* Logo preview */}
          {profile?.logo_url && (
            <div className="bg-white border border-stone-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <img src={profile.logo_url} alt="Brand logo" className="w-12 h-12 rounded-xl object-cover" />
              <div>
                <p className="text-stone-900 text-sm font-semibold">Your logo will appear as the campaign thumbnail</p>
                <p className="text-stone-400 text-xs">Change it in Settings</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-5">

            {/* Campaign Type */}
            <div>
              <label className="text-stone-500 text-sm mb-2 block">Campaign Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'logo', label: 'Logo', desc: 'Brand logo promotion' },
                  { value: 'clipping', label: 'Clipping', desc: 'Clip and repost content' },
                  { value: 'ugc', label: 'UGC', desc: 'User generated content' },
                ].map(t => (
                  <button key={t.value} onClick={() => setType(t.value)}
                    className={`p-3 rounded-xl border text-left transition ${type === t.value ? 'bg-amber-100 border-amber-500 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-400'}`}>
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs mt-0.5 opacity-70">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <label className="text-stone-500 text-sm mb-2 block">Target Platforms <span className="text-stone-400">(select all that apply)</span></label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition ${platforms.includes(p.id) ? 'bg-amber-100 border-amber-500 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-amber-400'}`}>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Campaign Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Promote Our New App"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>

            {/* Source material */}
            {type !== 'ugc' && (
              <div>
                <label className="text-stone-500 text-sm mb-2 block">Campaign Material</label>
                <div className="flex gap-2 mb-3">
                  <button onClick={() => setUseLink(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${useLink ? 'bg-amber-100 border-amber-500 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                    Use Link
                  </button>
                  <button onClick={() => setUseLink(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${!useLink ? 'bg-amber-100 border-amber-500 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-500'}`}>
                    Upload File
                  </button>
                </div>
                {useLink ? (
                  <input type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
                ) : (
                  <div>
                    <input type="file" accept="video/*,image/*,.zip" onChange={handleFileChange}
                      className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-amber-600 file:text-white file:font-semibold" />
                    <p className="text-stone-400 text-xs mt-1">Max 15MB. For larger files, use a link (<a href="/terms" className="text-amber-600 underline">see Terms</a>)</p>
                    {sourceFile && <p className="text-green-700 text-xs mt-1">{sourceFile.name} ({(sourceFile.size / 1024 / 1024).toFixed(1)}MB)</p>}
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Posting Instructions</label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
                placeholder="Describe how influencers should post this campaign..."
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition resize-none" />
            </div>

            {/* Pay per 1k */}
            <div>
              <label className="text-stone-500 text-sm mb-1 block">
                Pay per 1,000 views (UGX)
                {settings && <span className="text-stone-400 ml-2 text-xs">Min: {fmtUGX(getMinPerk())}, Max: {fmtUGX(getMaxPerk())}</span>}
              </label>
              <input type="number" value={payPer1k || ''} onChange={e => setPayPer1k(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>

            {/* Period */}
            <div>
              <label className="text-stone-500 text-sm mb-1 block">Campaign Period (days)</label>
              <input type="number" value={periodDays} min={1} max={90} onChange={e => setPeriodDays(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>

            {/* Budget */}
            <div>
              <label className="text-stone-500 text-sm mb-1 block">
                Budget (UGX)
                {settings && <span className="text-stone-400 ml-2 text-xs">Min: {fmtUGX(getMinBudget())}, Max: {fmtUGX(getMaxBudget())}</span>}
              </label>
              <input type="number" value={budget || ''} onChange={e => setBudget(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>

            {/* Summary */}
            {budget > 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <h3 className="text-stone-900 font-semibold text-sm mb-3">Payment Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Campaign Budget</span>
                  <span className="text-stone-900">{fmtUGX(budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Service Fee ({settings?.deposit_fee_pct}%)</span>
                  <span className="text-amber-600">{fmtUGX(fee)}</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-stone-900">Total to Pay</span>
                  <span className="text-amber-600">{fmtUGX(total)}</span>
                </div>
              </div>
            )}

            {/* Proceed button */}
            <button
              onClick={handleProceedToPayment}
              disabled={loading || uploading}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition text-sm"
            >
              {uploading ? 'Uploading file...' : loading ? 'Processing...' : 'Proceed to Payment →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
