import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

type Deposit = {
  id: string; amount: number; service_fee: number; total_charged: number
  momo_reference_id: string; status: string; created_at: string
  brand_id: string
  profiles: { display_name: string; email: string }
  campaigns: { title: string }
}

type Withdrawal = {
  id: string; amount: number; fee: number; net_amount: number
  phone: string; status: string; requested_at: string
  profiles: { display_name: string; email: string }
}

export default function Withdrawals() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'deposits' | 'withdrawals'>('deposits')
  const [actionId, setActionId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'admin') { navigate('/'); return }
    setProfile(prof)

    const { data: deps } = await supabase.from('deposits').select('*, profiles(display_name, email), campaigns(title)').order('created_at', { ascending: false })
    if (deps) setDeposits(deps as any)

    const { data: wds } = await supabase.from('withdrawals').select('*, profiles(display_name, email)').order('requested_at', { ascending: false })
    if (wds) setWithdrawals(wds as any)

    setLoading(false)
  }

  const handleDepositApprove = async (dep: Deposit) => {
    setActionId(dep.id)
    // Approve deposit and activate campaign
    await supabase.from('deposits').update({ status: 'completed' }).eq('id', dep.id)
    await supabase.from('campaigns').update({
      status: 'live',
      starts_at: new Date().toISOString(),
    }).eq('id', (dep as any).campaign_id)
    setDeposits(deposits.map(d => d.id === dep.id ? { ...d, status: 'completed' } : d))
    setMessage('Payment verified! Campaign is now LIVE.')
    setTimeout(() => setMessage(''), 3000)
    setActionId(null)
  }

  const handleDepositReject = async (id: string) => {
    setActionId(id)
    await supabase.from('deposits').update({ status: 'failed' }).eq('id', id)
    setDeposits(deposits.map(d => d.id === id ? { ...d, status: 'failed' } : d))
    setMessage('Payment rejected.')
    setTimeout(() => setMessage(''), 3000)
    setActionId(null)
  }

  const handleWithdrawalDisburse = async (id: string) => {
    setActionId(id)
    setMessage('')
    const { data, error } = await supabase.functions.invoke('momo-disburse', { body: { withdrawalId: id } })
    if (error || data?.error) {
      setMessage(data?.error || error?.message || 'Failed to send MTN MoMo payout')
      setActionId(null)
      return
    }
    setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'processing' } as any : w))
    setMessage('Payout sent via MTN MoMo — polling for confirmation...')
    pollWithdrawalStatus(id, data.reference_id)
  }

  const pollWithdrawalStatus = async (id: string, referenceId: string, attempt = 0) => {
    if (attempt > 30) { setActionId(null); setMessage('Still processing — check back shortly.'); return }
    const { data } = await supabase.functions.invoke('momo-check-withdrawal-status', { body: { referenceId } })
    if (data?.status === 'SUCCESSFUL') {
      setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'approved' } : w))
      setMessage('Payout confirmed by MTN MoMo!')
      setTimeout(() => setMessage(''), 3000)
      setActionId(null)
      return
    }
    if (data?.status === 'FAILED') {
      setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'rejected' } : w))
      setMessage('MTN MoMo payout failed.')
      setActionId(null)
      return
    }
    setTimeout(() => pollWithdrawalStatus(id, referenceId, attempt + 1), 4000)
  }

  const handleWithdrawalReject = async (id: string) => {
    setActionId(id)
    await supabase.from('withdrawals').update({ status: 'rejected', processed_at: new Date().toISOString() }).eq('id', id)
    setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'rejected' } : w))
    setActionId(null)
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`
  const pendingDeposits = deposits.filter(d => d.status === 'pending').length
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Payments & Withdrawals</h1>
        <p className="text-stone-500 text-sm mb-6">Monitor MTN Mobile Money deposits (auto-verified) and disburse withdrawals</p>

        {message && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('deposits')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'deposits' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
            Deposits {pendingDeposits > 0 && <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingDeposits}</span>}
          </button>
          <button onClick={() => setTab('withdrawals')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'withdrawals' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
            Withdrawals {pendingWithdrawals > 0 && <span className="ml-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingWithdrawals}</span>}
          </button>
        </div>

        {tab === 'deposits' && (
          <div className="space-y-3">
            {deposits.map(dep => (
              <div key={dep.id} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <h3 className="text-stone-900 font-semibold text-sm">{dep.profiles?.display_name}</h3>
                    <div className="text-stone-400 text-xs mb-1">{dep.profiles?.email}</div>
                    <div className="text-stone-500 text-xs">Campaign: {dep.campaigns?.title}</div>
                    <div className="text-amber-600 text-xs mt-1 font-mono">Ref: {dep.momo_reference_id}</div>
                    <div className="text-stone-400 text-xs">{new Date(dep.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-600 font-bold">{fmtUGX(dep.total_charged)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${dep.status === 'completed' ? 'bg-green-50 text-green-700' : dep.status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-100 text-amber-600'}`}>{dep.status}</span>
                  </div>
                  {dep.status === 'pending' && (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => handleDepositApprove(dep)} disabled={actionId === dep.id}
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition disabled:opacity-50">
                        Manually Activate (fallback)
                      </button>
                      <button onClick={() => handleDepositReject(dep.id)} disabled={actionId === dep.id}
                        className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {deposits.length === 0 && <div className="text-center py-12"><p className="text-stone-500">No deposits yet</p></div>}
          </div>
        )}

        {tab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.map(wd => (
              <div key={wd.id} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <h3 className="text-stone-900 font-semibold text-sm">{wd.profiles?.display_name}</h3>
                    <div className="text-stone-400 text-xs">{wd.profiles?.email}</div>
                    <div className="text-stone-500 text-xs mt-1">{wd.phone}</div>
                    <div className="text-stone-400 text-xs">{new Date(wd.requested_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-700 font-bold">{fmtUGX(wd.net_amount)}</div>
                    <div className="text-stone-400 text-xs">fee: {fmtUGX(wd.fee)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${wd.status === 'approved' ? 'bg-green-50 text-green-700' : wd.status === 'rejected' ? 'bg-red-50 text-red-600' : wd.status === 'processing' ? 'bg-blue-50 text-blue-700' : 'bg-amber-100 text-amber-600'}`}>{wd.status}</span>
                  </div>
                  {wd.status === 'pending' && (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => handleWithdrawalDisburse(wd.id)} disabled={actionId === wd.id}
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition disabled:opacity-50">
                        {actionId === wd.id ? 'Sending...' : 'Disburse via MTN MoMo'}
                      </button>
                      <button onClick={() => handleWithdrawalReject(wd.id)} disabled={actionId === wd.id}
                        className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  )}
                  {wd.status === 'processing' && (
                    <div className="w-full text-xs text-blue-700">Waiting for MTN MoMo confirmation...</div>
                  )}
                </div>
              </div>
            ))}
            {withdrawals.length === 0 && <div className="text-center py-12"><p className="text-stone-500">No withdrawals yet</p></div>}
          </div>
        )}
      </main>
    </div>
  )
}
