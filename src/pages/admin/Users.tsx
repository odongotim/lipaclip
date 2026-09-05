import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

type User = {
  id: string
  email: string
  display_name: string
  role: string
  is_suspended: boolean
  tiktok_verified: boolean
  created_at: string
}

export default function Users() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [actionUser, setActionUser] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'admin') { navigate('/'); return }
    setProfile(prof)

    const { data: allUsers } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', user.id) // Exclude self
      .order('created_at', { ascending: false })

    if (allUsers) setUsers(allUsers)
    setLoading(false)
  }

  const handleSuspend = async (userId: string, suspended: boolean) => {
    setActionUser(userId)
    await supabase.from('profiles').update({ is_suspended: !suspended }).eq('id', userId)
    setUsers(users.map(u => u.id === userId ? { ...u, is_suspended: !suspended } : u))
    setActionUser(null)
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return
    setActionUser(userId)
    await supabase.from('profiles').delete().eq('id', userId)
    setUsers(users.filter(u => u.id !== userId))
    setActionUser(null)
  }

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar userName={profile?.display_name} />

      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Manage Users</h1>
        <p className="text-stone-500 text-sm mb-8">View all users and manage their accounts</p>

        <div className="overflow-x-auto">
          <div className="space-y-3">
            {users.map(user => (
              <div key={user.id} className="bg-white border border-stone-200 rounded-xl p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-stone-900 font-semibold text-sm">{user.display_name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        user.role === 'brand' ? 'bg-amber-100 text-amber-600' :
                        user.role === 'influencer' ? 'bg-blue-50 text-blue-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>{user.role}</span>
                      {user.is_suspended && <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">Suspended</span>}
                      {user.tiktok_verified && user.role === 'influencer' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">TikTok Verified</span>}
                    </div>
                    <div className="text-stone-400 text-xs">{user.email}</div>
                    <div className="text-stone-400 text-xs mt-1">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => handleSuspend(user.id, user.is_suspended)}
                      disabled={actionUser === user.id}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50 ${
                        user.is_suspended
                          ? 'bg-green-50 hover:bg-green-100 text-green-700'
                          : 'bg-amber-100 hover:bg-amber-100 text-amber-600'
                      }`}
                    >
                      {user.is_suspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={actionUser === user.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-stone-500">No users found</p>
          </div>
        )}
      </main>
    </div>
  )
}