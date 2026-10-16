import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Landing from './pages/Landing'
import ToastHost from './components/ToastHost'
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './pages/NotFound'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Signup from './pages/Signup'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import BrandDashboard from './pages/brand/Dashboard'
import NewCampaign from './pages/brand/NewCampaign'
import BrandSettings from './pages/brand/Settings'
import Creators from './pages/brand/Creators'
import InfluencerHome from './pages/influencer/Home'
import InfluencerDashboard from './pages/influencer/Dashboard'
import InfluencerProfile from './pages/influencer/Profile'
import Withdraw from './pages/influencer/Withdraw'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminWithdrawals from './pages/admin/Withdrawals'
import AdminVerifications from './pages/admin/Verifications'
import AdminSettings from './pages/admin/Settings'
import AdminViews from './pages/admin/Views'

const TITLES: Record<string, string> = {
  '/login': 'Log in',
  '/signup': 'Sign up',
  '/forgot-password': 'Reset password',
  '/reset-password': 'Choose a new password',
  '/terms': 'Terms',
  '/privacy': 'Privacy',
  '/brand': 'Dashboard',
  '/brand/new-campaign': 'New campaign',
  '/brand/creators': 'Creators',
  '/brand/settings': 'Brand settings',
  '/influencer': 'Browse campaigns',
  '/influencer/dashboard': 'My dashboard',
  '/influencer/profile': 'My profile',
  '/influencer/withdraw': 'Withdraw',
  '/admin': 'Admin',
  '/admin/users': 'Users',
  '/admin/withdrawals': 'Payments',
  '/admin/verifications': 'Verifications',
  '/admin/settings': 'Settings',
  '/admin/views': 'Views',
}

// Keeps the browser tab title and scroll position in step with the page.
function RouteEffects() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  // Safety net: if a sign-in or reset link lands on the home page (this happens when the
  // redirect URL is missing from Supabase's allow-list), forward it to the right screen.
  useEffect(() => {
    if (pathname !== '/') return
    const { hash, search } = window.location
    if (hash.includes('type=recovery')) navigate('/reset-password' + hash, { replace: true })
    else if (hash.includes('access_token=') || search.includes('code=')) navigate('/auth/callback' + search + hash, { replace: true })
  }, [pathname, navigate])

  useEffect(() => {
    const t = TITLES[pathname]
    document.title = t ? `${t} | LipaClip` : 'LipaClip: Pay-per-view creator campaigns in Uganda'
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <RouteEffects />
      <ToastHost />
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/brand" element={<BrandDashboard />} />
        <Route path="/brand/new-campaign" element={<NewCampaign />} />
        <Route path="/brand/settings" element={<BrandSettings />} />
        <Route path="/brand/creators" element={<Creators />} />
        <Route path="/influencer" element={<InfluencerHome />} />
        <Route path="/influencer/dashboard" element={<InfluencerDashboard />} />
        <Route path="/influencer/profile" element={<InfluencerProfile />} />
        <Route path="/influencer/socials" element={<Navigate to="/influencer/profile#social-accounts" replace />} />
        <Route path="/influencer/withdraw" element={<Withdraw />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
        <Route path="/admin/verifications" element={<AdminVerifications />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/views" element={<AdminViews />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
