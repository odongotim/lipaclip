import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'

type Settings = {
  id: number
  deposit_fee_pct: number
  service_fee_pct: number
  min_withdrawal: number
  logo_min_budget: number
  logo_max_budget: number
  logo_min_perk: number
  logo_max_perk: number
  clip_min_budget: number
  clip_max_budget: number
  clip_min_perk: number
  clip_max_perk: number
  ugc_min_budget: number
  ugc_max_budget: number
  ugc_min_perk: number
  ugc_max_perk: number
}

export default function Settings() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'admin') { navigate('/'); return }
    setProfile(prof)

    const { data: sett } = await supabase.from('platform_settings').select('*').eq('id', 1).single()
    if (sett) setSettings(sett)
    setLoading(false)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('platform_settings')
      .update(settings)
      .eq('id', 1)

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('Settings saved successfully!')
    }
    setSaving(false)
  }

  const handleChange = (field: keyof Settings, value: number) => {
    if (settings) {
      setSettings({ ...settings, [field]: value })
    }
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  if (loading || !settings) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-amber-600 animate-pulse text-xl">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar userName={profile?.display_name} />

      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Settings</h1>
        <p className="text-stone-500 text-sm mb-8">Configure platform fees and campaign limits</p>

        {message && (
          <div className={`mb-6 text-sm px-4 py-3 rounded-lg border ${
            message.includes('Error')
              ? 'bg-red-50 border-red-200 text-red-600'
              : 'bg-green-50 border-green-200 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="max-w-2xl space-y-6">

          {/* Global Fees */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6">
            <h2 className="text-stone-900 font-semibold mb-4">Global Fees</h2>
            <div className="space-y-4">
              <div>
                <label className="text-stone-500 text-sm mb-1 block">Deposit Fee (%)</label>
                <input
                  type="number"
                  value={settings.deposit_fee_pct}
                  onChange={e => handleChange('deposit_fee_pct', Number(e.target.value))}
                  step={0.1}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-stone-400 text-xs mt-1">Charged when brands deposit money</p>
              </div>

              <div>
                <label className="text-stone-500 text-sm mb-1 block">Service Fee (%) - Withdrawal</label>
                <input
                  type="number"
                  value={settings.service_fee_pct}
                  onChange={e => handleChange('service_fee_pct', Number(e.target.value))}
                  step={0.1}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
                />
                <p className="text-stone-400 text-xs mt-1">Charged when influencers withdraw earnings</p>
              </div>

              <div>
                <label className="text-stone-500 text-sm mb-1 block">Minimum Withdrawal {fmtUGX(settings.min_withdrawal)}</label>
                <input
                  type="number"
                  value={settings.min_withdrawal}
                  onChange={e => handleChange('min_withdrawal', Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Campaign Types */}
          {[
            { type: 'Logo', prefix: 'logo' },
            { type: 'Clipping', prefix: 'clip' },
            { type: 'UGC', prefix: 'ugc' },
          ].map(camp => (
            <div key={camp.prefix} className="bg-white border border-stone-200 rounded-2xl p-6">
              <h2 className="text-stone-900 font-semibold mb-4">{camp.type} Campaign Settings</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-stone-500 text-sm mb-1 block">Min Budget</label>
                  <input
                    type="number"
                    value={settings[`${camp.prefix}_min_budget` as keyof Settings]}
                    onChange={e => handleChange(`${camp.prefix}_min_budget` as keyof Settings, Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="text-stone-500 text-sm mb-1 block">Max Budget</label>
                  <input
                    type="number"
                    value={settings[`${camp.prefix}_max_budget` as keyof Settings]}
                    onChange={e => handleChange(`${camp.prefix}_max_budget` as keyof Settings, Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="text-stone-500 text-sm mb-1 block">Min Pay per 1k Views</label>
                  <input
                    type="number"
                    value={settings[`${camp.prefix}_min_perk` as keyof Settings]}
                    onChange={e => handleChange(`${camp.prefix}_min_perk` as keyof Settings, Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="text-stone-500 text-sm mb-1 block">Max Pay per 1k Views</label>
                  <input
                    type="number"
                    value={settings[`${camp.prefix}_max_perk` as keyof Settings]}
                    onChange={e => handleChange(`${camp.prefix}_max_perk` as keyof Settings, Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  )
}