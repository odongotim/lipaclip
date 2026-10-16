import TabNav from './TabNav'
import type { NavItem } from './TabNav'
import { IconDashboard, IconPlusCircle, IconUsers, IconSettings } from './icons'
import { supabase, getCurrentUser } from '../lib/supabase'
import { useTabBadge } from '../lib/useTabBadge'

export default function BrandNav({ userName }: { userName?: string }) {
  // Videos creators have submitted that are waiting for this brand's review
  const toReview = useTabBadge('submissions', async () => {
    const user = await getCurrentUser()
    if (!user) return 0
    const { count } = await supabase
      .from('submissions')
      .select('id, campaigns!inner(brand_id)', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('campaigns.brand_id', user.id)
    return count || 0
  })

  const items: NavItem[] = [
    { label: 'Dashboard', to: '/brand', icon: IconDashboard, exact: true, badge: toReview },
    { label: 'New campaign', to: '/brand/new-campaign', icon: IconPlusCircle, highlight: true },
    { label: 'Creators', to: '/brand/creators', icon: IconUsers },
    { label: 'Settings', to: '/brand/settings', icon: IconSettings },
  ]

  return <TabNav items={items} userName={userName} />
}
