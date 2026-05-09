import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

type Deposit = {
  id: string; amount: number; service_fee: number; total_charged: number
  pesapal_merchant_reference: string; status: string; created_at: string
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
    const { data: { user } } = await supabase.auth.getUser()
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

  const handleWithdrawalApprove = async (id: string) => {
    setActionId(id)
    await supabase.from('withdrawals').update({ status: 'approved', processed_at: new Date().toISOString() }).eq('id', id)
    setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: 'approved' } : w))
    setMessage('Withdrawal approved!')
    setTimeout(() => setMessage(''), 3000)
    setActionId(null)
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
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0a06] flex">
      <AdminSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">Payments & Withdrawals</h1>
        <p className="text-gray-400 text-sm mb-6">Verify mobile money payments and process withdrawals</p>

        {message && <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('deposits')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'deposits' ? 'bg-yellow-500 text-black' : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'}`}>
            💰 Deposits {pendingDeposits > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingDeposits}</span>}
          </button>
          <button onClick={() => setTab('withdrawals')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'withdrawals' ? 'bg-yellow-500 text-black' : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'}`}>
            🏧 Withdrawals {pendingWithdrawals > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingWithdrawals}</span>}
          </button>
        </div>

        {tab === 'deposits' && (
          <div className="space-y-3">
            {deposits.map(dep => (
              <div key={dep.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">{dep.profiles?.display_name}</h3>
                    <div className="text-gray-500 text-xs mb-1">{dep.profiles?.email}</div>
                    <div className="text-gray-400 text-xs">Campaign: {dep.campaigns?.title}</div>
                    <div className="text-yellow-400 text-xs mt-1 font-mono">TX ID: {dep.pesapal_merchant_reference}</div>
                    <div className="text-gray-500 text-xs">{new Date(dep.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-500 font-bold">{fmtUGX(dep.total_charged)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${dep.status === 'completed' ? 'bg-green-500/20 text-green-400' : dep.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{dep.status}</span>
                  </div>
                  {dep.status === 'pending' && (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => handleDepositApprove(dep)} disabled={actionId === dep.id}
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition disabled:opacity-50">
                        ✓ Verify & Activate Campaign
                      </button>
                      <button onClick={() => handleDepositReject(dep.id)} disabled={actionId === dep.id}
                        className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {deposits.length === 0 && <div className="text-center py-12"><p className="text-gray-400">No deposits yet</p></div>}
          </div>
        )}

        {tab === 'withdrawals' && (
          <div className="space-y-3">
            {withdrawals.map(wd => (
              <div key={wd.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">{wd.profiles?.display_name}</h3>
                    <div className="text-gray-500 text-xs">{wd.profiles?.email}</div>
                    <div className="text-gray-400 text-xs mt-1">📱 {wd.phone}</div>
                    <div className="text-gray-500 text-xs">{new Date(wd.requested_at).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">{fmtUGX(wd.net_amount)}</div>
                    <div className="text-gray-500 text-xs">fee: {fmtUGX(wd.fee)}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full inline-block mt-1 ${wd.status === 'approved' ? 'bg-green-500/20 text-green-400' : wd.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{wd.status}</span>
                  </div>
                  {wd.status === 'pending' && (
                    <div className="flex gap-2 w-full">
                      <button onClick={() => handleWithdrawalApprove(wd.id)} disabled={actionId === wd.id}
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition disabled:opacity-50">
                        ✓ Approve
                      </button>
                      <button onClick={() => handleWithdrawalReject(wd.id)} disabled={actionId === wd.id}
                        className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {withdrawals.length === 0 && <div className="text-center py-12"><p className="text-gray-400">No withdrawals yet</p></div>}
          </div>
        )}
      </main>
    </div>
  )
}
