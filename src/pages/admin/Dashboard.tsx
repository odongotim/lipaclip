import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser, subscribeToTable } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ totalDeposited: 0, totalEarned: 0, totalProfit: 0, totalUsers: 0, brands: 0, influencers: 0, pendingWithdrawals: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const unsub1 = subscribeToTable('submissions', loadData)
    const unsub2 = subscribeToTable('campaigns', loadData)
    const unsub3 = subscribeToTable('deposits', loadData)
    const unsub4 = subscribeToTable('withdrawals', loadData)
    return () => { unsub1(); unsub2(); unsub3(); unsub4() }
  }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'admin') { navigate('/'); return }
    setProfile(prof)

    try {
      const [depositsRes, subsRes, profilesRes, withdrawalsRes] = await Promise.all([
        supabase.from('deposits').select('amount, total_charged, status'),
        supabase.from('submissions').select('earnings, status'),
        supabase.from('profiles').select('id, role'),
        supabase.from('withdrawals').select('amount, fee, status'),
      ])

      const deposits = depositsRes.data || []
      const subs = subsRes.data || []
      const profiles = profilesRes.data || []
      const withdrawals = withdrawalsRes.data || []

      // Money brands have deposited into campaigns (excluding the platform's deposit fee)
      const completedDeposits = deposits.filter((d: any) => d.status === 'completed')
      const totalDepositedGross = completedDeposits.reduce((a: number, d: any) => a + (d.amount || 0), 0)
      const depositFees = completedDeposits.reduce((a: number, d: any) => a + ((d.total_charged || 0) - (d.amount || 0)), 0)

      // Money that has actually become influencer earnings (approved submissions only)
      const approvedEarnings = subs.filter((s: any) => s.status === 'approved').reduce((a: number, s: any) => a + (s.earnings || 0), 0)

      // Earnings already claimed (requested, processing, or paid out) — mirrors the
      // "available balance" calculation on the influencer Withdraw page
      const claimedEarnings = withdrawals
        .filter((w: any) => w.status === 'pending' || w.status === 'processing' || w.status === 'approved')
        .reduce((a: number, w: any) => a + (w.amount || 0), 0)

      const withdrawalFees = withdrawals.filter((w: any) => w.status === 'approved').reduce((a: number, w: any) => a + (w.fee || 0), 0)

      setStats({
        // Deposited by brands, still sitting in escrow (not yet turned into influencer earnings)
        totalDeposited: Math.max(0, totalDepositedGross - approvedEarnings),
        // Earned by influencers but still sitting in their account (not yet withdrawn)
        totalEarned: Math.max(0, approvedEarnings - claimedEarnings),
        // Platform revenue: deposit fees + withdrawal fees actually collected
        totalProfit: depositFees + withdrawalFees,
        totalUsers: profiles.filter((p: any) => p.role !== 'admin').length,
        brands: profiles.filter((p: any) => p.role === 'brand').length,
        influencers: profiles.filter((p: any) => p.role === 'influencer').length,
        pendingWithdrawals: withdrawals.filter((w: any) => w.status === 'pending').length,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
    setLoading(false)
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-stone-500 text-sm mb-8">Platform overview and management</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Deposited', value: fmtUGX(stats.totalDeposited), color: 'text-amber-600' },
            { label: 'Total Earned', value: fmtUGX(stats.totalEarned), color: 'text-green-700' },
            { label: 'Profit', value: fmtUGX(stats.totalProfit), color: 'text-blue-700' },
            { label: 'Total Users', value: stats.totalUsers.toString(), color: 'text-purple-700' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-stone-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Brands', value: stats.brands, color: 'text-amber-600' },
            { label: 'Influencers', value: stats.influencers, color: 'text-green-700' },
            { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: 'text-red-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white border border-stone-200 rounded-2xl p-6 text-center">
              <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-stone-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="text-stone-900 font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { href: '/admin/users', title: 'Manage Users', desc: 'View, suspend, or delete users' },
              { href: '/admin/withdrawals', title: 'Process Withdrawals', desc: `${stats.pendingWithdrawals} pending approval` },
              { href: '/admin/verifications', title: 'Verify Influencers', desc: 'Approve influencer socials' },
              { href: '/admin/settings', title: 'Settings', desc: 'Configure platform settings' },
            ].map(item => (
              <a key={item.href} href={item.href} className="block bg-amber-50 hover:bg-amber-100 border border-stone-300 rounded-lg p-4 transition">
                <div className="text-amber-600 font-semibold text-sm">{item.title}</div>
                <div className="text-stone-400 text-xs mt-1">{item.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
