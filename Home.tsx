import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ totalDeposited: 0, totalEarned: 0, totalProfit: 0, totalUsers: 0, brands: 0, influencers: 0, pendingWithdrawals: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (!prof || prof.role !== 'admin') { navigate('/'); return }
    setProfile(prof)

    try {
      const [depositsRes, subsRes, profilesRes, withdrawalsRes] = await Promise.all([
        supabase.from('deposits').select('total_charged, status'),
        supabase.from('submissions').select('earnings'),
        supabase.from('profiles').select('id, role'),
        supabase.from('withdrawals').select('id').eq('status', 'pending'),
      ])

      const deposits = depositsRes.data || []
      const subs = subsRes.data || []
      const profiles = profilesRes.data || []
      const withdrawals = withdrawalsRes.data || []

      const totalDep = deposits.filter((d: any) => d.status === 'completed').reduce((a: number, d: any) => a + (d.total_charged || 0), 0)
      const totalEarn = subs.reduce((a: number, s: any) => a + (s.earnings || 0), 0)

      setStats({
        totalDeposited: totalDep,
        totalEarned: totalEarn,
        totalProfit: totalDep - totalEarn,
        totalUsers: profiles.filter((p: any) => p.role !== 'admin').length,
        brands: profiles.filter((p: any) => p.role === 'brand').length,
        influencers: profiles.filter((p: any) => p.role === 'influencer').length,
        pendingWithdrawals: withdrawals.length,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
    setLoading(false)
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  if (loading) return (
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center">
      <div className="text-yellow-500 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0a06] flex">
      <AdminSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mb-8">Platform overview and management</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Deposited', value: fmtUGX(stats.totalDeposited), color: 'text-yellow-500' },
            { label: 'Total Earned', value: fmtUGX(stats.totalEarned), color: 'text-green-400' },
            { label: 'Profit', value: fmtUGX(stats.totalProfit), color: 'text-blue-400' },
            { label: 'Total Users', value: stats.totalUsers.toString(), color: 'text-purple-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-gray-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Brands', value: stats.brands, color: 'text-yellow-500' },
            { label: 'Influencers', value: stats.influencers, color: 'text-green-400' },
            { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, color: 'text-red-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 text-center">
              <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { href: '/admin/users', icon: '👥', title: 'Manage Users', desc: 'View, suspend, or delete users' },
              { href: '/admin/withdrawals', icon: '💰', title: 'Process Withdrawals', desc: `${stats.pendingWithdrawals} pending approval` },
              { href: '/admin/verifications', icon: '✅', title: 'Verify Influencers', desc: 'Approve influencer socials' },
              { href: '/admin/settings', icon: '⚙️', title: 'Settings', desc: 'Configure platform settings' },
            ].map(item => (
              <a key={item.href} href={item.href} className="block bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 transition">
                <div className="text-yellow-400 font-semibold text-sm">{item.icon} {item.title}</div>
                <div className="text-gray-500 text-xs mt-1">{item.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
