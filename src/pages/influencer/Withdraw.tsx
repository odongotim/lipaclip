import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import InfluencerSidebar from '../../components/InfluencerSidebar'

type Withdrawal = {
  id: string
  amount: number
  fee: number
  net_amount: number
  phone: string
  status: string
  requested_at: string
}

export default function Withdraw() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [available, setAvailable] = useState(0)
  const [amount, setAmount] = useState(0)
  const [phone, setPhone] = useState('')
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [minWithdrawal, setMinWithdrawal] = useState(10000)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof) { navigate('/'); return }
    setProfile(prof)

    // Get available earnings from approved submissions
    const { data: subs } = await supabase
      .from('submissions')
      .select('earnings')
      .eq('influencer_id', user.id)
      .eq('status', 'approved')

    const totalAvailable = (subs || []).reduce((a, s) => a + (s.earnings || 0), 0)

    // Subtract already requested withdrawals
    const { data: wds } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('influencer_id', user.id)
      .order('requested_at', { ascending: false })

    const pendingWithdrawn = (wds || [])
      .filter(w => w.status === 'pending' || w.status === 'processing' || w.status === 'approved')
      .reduce((a, w) => a + w.amount, 0)

    setAvailable(Math.max(0, totalAvailable - pendingWithdrawn))
    setWithdrawals(wds || [])

    // Get min withdrawal from settings
    const { data: settings } = await supabase.from('platform_settings').select('min_withdrawal, service_fee_pct').eq('id', 1).single()
    if (settings) setMinWithdrawal(settings.min_withdrawal)

    setLoading(false)
  }

  const fee = Math.round(amount * 0.15)
  const netAmount = amount - fee
  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  const handleWithdraw = async () => {
    setError('')
    setMessage('')
    if (amount < minWithdrawal) { setError(`Minimum withdrawal is ${fmtUGX(minWithdrawal)}`); return }
    if (amount > available) { setError('Amount exceeds available balance'); return }
    if (!phone) { setError('Please enter your mobile money number'); return }

    setSubmitting(true)
    const user = await getCurrentUser()
    if (!user) return

    const { error } = await supabase.from('withdrawals').insert({
      influencer_id: user.id,
      amount,
      fee,
      net_amount: netAmount,
      phone,
      status: 'pending',
    })

    if (error) { setError(error.message); setSubmitting(false); return }

    setMessage('Withdrawal request submitted! Admin will process it soon.')
    setAmount(0)
    setPhone('')
    loadData()
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <InfluencerSidebar userName={profile?.display_name} />

      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Withdraw</h1>
        <p className="text-stone-500 text-sm mb-8">Withdraw your earnings to Mobile Money</p>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="max-w-xl space-y-6">
          {/* Balance */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <div className="text-stone-500 text-sm mb-1">Available Balance</div>
            <div className="text-amber-600 text-4xl font-bold">{fmtUGX(available)}</div>
            <div className="text-stone-400 text-xs mt-1">From completed & approved campaigns only</div>
          </div>

          {/* Withdraw form */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-stone-900 font-semibold">Request Withdrawal</h2>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">
                Amount (UGX) <span className="text-stone-400">Min: {fmtUGX(minWithdrawal)}</span>
              </label>
              <input
                type="number"
                value={amount || ''}
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="e.g. 50000"
                max={available}
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="text-stone-500 text-sm mb-1 block">Mobile Money Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 0771234567"
                className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {amount > 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Amount</span>
                  <span className="text-stone-900">{fmtUGX(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Service Fee (15%)</span>
                  <span className="text-red-600">-{fmtUGX(fee)}</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-stone-900">You Receive</span>
                  <span className="text-green-700">{fmtUGX(netAmount)}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={submitting || amount < minWithdrawal || amount > available}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm"
            >
              {submitting ? 'Submitting...' : 'Request Withdrawal'}
            </button>
          </div>

          {/* Withdrawal history */}
          <div>
            <h2 className="text-stone-900 font-semibold mb-3">Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
                <p className="text-stone-500 text-sm">No withdrawals yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map(w => (
                  <div key={w.id} className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-stone-900 font-semibold text-sm">{fmtUGX(w.net_amount)}</div>
                      <div className="text-stone-400 text-xs">{w.phone} • {new Date(w.requested_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      w.status === 'approved' ? 'bg-green-50 text-green-700' :
                      w.status === 'rejected' ? 'bg-red-50 text-red-600' :
                      w.status === 'processing' ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-100 text-amber-600'
                    }`}>{w.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}