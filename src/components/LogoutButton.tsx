import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { IconLogout } from './icons'

/** Ends the session and returns to the home page. Lives on the Profile and Settings pages. */
export default function LogoutButton() {
  const navigate = useNavigate()
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }
  return (
    <button onClick={logout}
      className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-700 hover:bg-red-50 font-semibold py-3 rounded-xl transition text-sm">
      <IconLogout className="w-4 h-4" />
      Log out
    </button>
  )
}
