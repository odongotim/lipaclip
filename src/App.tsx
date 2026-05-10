import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import PesapalCallback from './pages/PesapalCallback'
import BrandDashboard from './pages/brand/Dashboard'
import NewCampaign from './pages/brand/NewCampaign'
import BrandSettings from './pages/brand/Settings'
import InfluencerHome from './pages/influencer/Home'
import InfluencerDashboard from './pages/influencer/Dashboard'
import Socials from './pages/influencer/Socials'
import Withdraw from './pages/influencer/Withdraw'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminWithdrawals from './pages/admin/Withdrawals'
import AdminVerifications from './pages/admin/Verifications'
import AdminSettings from './pages/admin/Settings'
import AdminViews from './pages/admin/Views'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/pesapal-callback" element={<PesapalCallback />} />
        <Route path="/brand" element={<BrandDashboard />} />
        <Route path="/brand/new-campaign" element={<NewCampaign />} />
        <Route path="/brand/settings" element={<BrandSettings />} />
        <Route path="/influencer" element={<InfluencerHome />} />
        <Route path="/influencer/dashboard" element={<InfluencerDashboard />} />
        <Route path="/influencer/socials" element={<Socials />} />
        <Route path="/influencer/withdraw" element={<Withdraw />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
        <Route path="/admin/verifications" element={<AdminVerifications />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/views" element={<AdminViews />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
