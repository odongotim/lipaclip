import TabNav from './TabNav'
import type { NavItem } from './TabNav'
import { IconHome, IconDashboard, IconWallet, IconUsers } from './icons'
import { supabase, getCurrentUser } from '../lib/supabase'
import { useTabBadge } from '../lib/useTabBadge'

export default function CreatorNav({ userName }: { userName?: string }) {
  // Invitations from brands that this creator has not answered yet
  const invites = useTabBadge('campaign_invites', async () => {
    const user = await getCurrentUser()
    if (!user) return 0
    const { count } = await supabase
      .from('campaign_invites')
      .select('id', { count: 'exact', head: true })
      .eq('influencer_id', user.id)
      .eq('status', 'pending')
    return count || 0
  })

  const items: NavItem[] = [
    { label: 'Browse', to: '/influencer', icon: IconHome, exact: true, badge: invites },
    { label: 'Dashboard', to: '/influencer/dashboard', icon: IconDashboard },
    { label: 'Withdraw', to: '/influencer/withdraw', icon: IconWallet },
    { label: 'Profile', to: '/influencer/profile', icon: IconUsers },
  ]

  return <TabNav items={items} userName={userName} />
}
