import TabNav from './TabNav'
import type { NavItem } from './TabNav'
import { IconDashboard, IconUsers, IconCreditCard, IconEye, IconShieldCheck, IconSettings } from './icons'

const items: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: IconDashboard, exact: true },
  { label: 'Users', to: '/admin/users', icon: IconUsers },
  { label: 'Payments', to: '/admin/withdrawals', icon: IconCreditCard },
  { label: 'Views', to: '/admin/views', icon: IconEye },
  { label: 'Verifications', to: '/admin/verifications', icon: IconShieldCheck },
  { label: 'Settings', to: '/admin/settings', icon: IconSettings },
]

export default function AdminNav({ userName }: { userName?: string }) {
  return <TabNav items={items} userName={userName} variant="scroll" showLogout />
}
