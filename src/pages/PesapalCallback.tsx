import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PesapalCallback() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => { checkPayment() }, [])

  const checkPayment = async () => {
    const orderTrackingId = searchParams.get('OrderTrackingId')
    const merchantRef = searchParams.get('OrderMerchantReference')

    if (!orderTrackingId) {
      setStatus('failed')
      setMessage('No order tracking ID found')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setStatus('failed'); setMessage('Not logged in'); return }

      // Check status via Edge Function
      const { data, error } = await supabase.functions.invoke('check-pesapal-status', {
        body: { orderTrackingId }
      })

      if (error || !data) {
        // If no check function, just check our deposit record
        const { data: deposit } = await supabase
          .from('deposits')
          .select('*, campaigns(id, period_days)')
          .eq('pesapal_order_tracking_id', orderTrackingId)
          .single()

        if (!deposit) {
          // Try by merchant reference
          const { data: dep2 } = await supabase
            .from('deposits')
            .select('*, campaigns(id, period_days)')
            .eq('pesapal_merchant_reference', merchantRef || '')
            .single()

          if (!dep2) { setStatus('pending'); setMessage('Payment is being processed...'); return }

          // Activate campaign
          await activateCampaign(dep2)
          return
        }

        await activateCampaign(deposit)
        return
      }

      if (data.status_code === 1) {
        const { data: deposit } = await supabase
          .from('deposits')
          .select('*, campaigns(id, period_days)')
          .eq('pesapal_order_tracking_id', orderTrackingId)
          .single()

        if (deposit) await activateCampaign(deposit)
        else { setStatus('success'); setMessage('Payment successful! Your campaign will be activated shortly.') }
      } else if (data.status_code === 0) {
        setStatus('pending')
        setMessage('Payment is being processed. Please wait...')
      } else {
        setStatus('failed')
        setMessage('Payment was not completed. Please try again.')
      }
    } catch (err: any) {
      // Fallback - just mark as pending and let admin verify
      setStatus('pending')
      setMessage('Payment submitted! Admin will verify and activate your campaign.')
    }
  }

  const activateCampaign = async (deposit: any) => {
    await supabase.from('deposits').update({ status: 'completed' }).eq('id', deposit.id)
    await supabase.from('campaigns').update({
      status: 'live',
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + (deposit.campaigns?.period_days || 7) * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', deposit.campaigns?.id || deposit.campaign_id)

    setStatus('success')
    setMessage('Payment successful! Your campaign is now LIVE.')
  }

  return (
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-yellow-500 text-3xl font-bold">Lipa<span className="text-white">Clip</span></Link>
        </div>

        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-8 text-center">
          {status === 'checking' && (
            <>
              <div className="text-yellow-500 text-4xl mb-4 animate-pulse">⏳</div>
              <p className="text-gray-400">Verifying payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-400 text-5xl mb-4">✅</div>
              <h2 className="text-white font-bold text-xl mb-2">Payment Successful!</h2>
              <p className="text-gray-400 text-sm mb-6">{message}</p>
              <Link to="/brand" className="block w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition text-sm">
                Go to Dashboard
              </Link>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="text-yellow-500 text-5xl mb-4 animate-pulse">⏳</div>
              <h2 className="text-white font-bold text-xl mb-2">Payment Pending</h2>
              <p className="text-gray-400 text-sm mb-6">{message}</p>
              <div className="space-y-2">
                <button onClick={checkPayment}
                  className="block w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition text-sm">
                  Check Again
                </button>
                <Link to="/brand" className="block w-full border border-yellow-500/30 text-gray-400 font-semibold py-3 rounded-lg transition text-sm hover:border-yellow-500/50">
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="text-red-400 text-5xl mb-4">❌</div>
              <h2 className="text-white font-bold text-xl mb-2">Payment Failed</h2>
              <p className="text-gray-400 text-sm mb-6">{message}</p>
              <div className="space-y-2">
                <Link to="/brand/new-campaign" className="block w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition text-sm">
                  Try Again
                </Link>
                <Link to="/brand" className="block w-full border border-yellow-500/30 text-gray-400 font-semibold py-3 rounded-lg transition text-sm">
                  Back to Dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
