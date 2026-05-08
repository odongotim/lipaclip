import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import BrandSidebar from '../../components/BrandSidebar'

type Campaign = {
  id: string
  title: string
  type: string
  budget: number
  spent: number
  status: string
  thumbnail_url: string | null
}

type Stats = {
  totalSpent: number
  totalBudget: number
  activeCampaigns: number
  completedCampaigns: number
}

export default function BrandDashboard() {
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<Stats>({ totalSpent: 0, totalBudget: 0, activeCampaigns: 0, completedCampaigns: 0 })
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'brand') { navigate('/'); return }
    setProfile(prof)

    const { data: camps } = await supabase.from('campaigns').select('*').eq('brand_id', user.id).order('created_at', { ascending: false })
    if (camps) {
      setCampaigns(camps)
      setStats({
        totalSpent: camps.reduce((a, c) => a + (c.spent || 0), 0),
        totalBudget: camps.reduce((a, c) => a + (c.budget || 0), 0),
        activeCampaigns: camps.filter(c => c.status === 'live').length,
        completedCampaigns: camps.filter(c => c.status === 'completed').length,
      })
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
      <BrandSidebar userName={profile?.display_name} />

      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-white text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm mb-8">Welcome back, {profile?.display_name}</p>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Budget', value: fmtUGX(stats.totalBudget), color: 'text-yellow-500' },
            { label: 'Total Spent', value: fmtUGX(stats.totalSpent), color: 'text-green-400' },
            { label: 'Unspent', value: fmtUGX(stats.totalBudget - stats.totalSpent), color: 'text-blue-400' },
            { label: 'Active Campaigns', value: stats.activeCampaigns.toString(), color: 'text-purple-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-gray-400 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Campaigns header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Your Campaigns</h2>
          <Link to="/brand/new-campaign" className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-4 py-2 rounded-lg transition">
            + New Campaign
          </Link>
        </div>

        {/* Campaign list */}
        {campaigns.length === 0 ? (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">🎬</div>
            <p className="text-gray-400 text-sm">No campaigns yet. Create your first one!</p>
            <Link to="/brand/new-campaign" className="inline-block mt-4 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold px-6 py-2 rounded-lg transition">
              Create Campaign
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {camp.thumbnail_url
                    ? <img src={camp.thumbnail_url} alt={camp.title} className="w-full h-full object-cover rounded-xl" />
                    : <span className="text-2xl">🎬</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-white font-semibold text-sm">{camp.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      camp.status === 'live' ? 'bg-green-500/20 text-green-400' :
                      camp.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{camp.status}</span>
                  </div>
                  <div className="text-gray-400 text-xs mb-2 capitalize">{camp.type} campaign</div>
                  <div className="w-full bg-yellow-900/30 rounded-full h-1.5">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min((camp.spent / camp.budget) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{fmtUGX(camp.spent)} spent</span>
                    <span>{fmtUGX(camp.budget)} budget</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}