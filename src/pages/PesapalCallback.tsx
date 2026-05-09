import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getTransactionStatus } from '../lib/pesapal'

export default function PesapalCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'success' | 'failed' | 'pending'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    checkPayment()
  }, [])

  const checkPayment = async () => {
    const orderTrackingId = searchParams.get('OrderTrackingId')
    if (!orderTrackingId) {
      setStatus('failed')
      setMessage('No order tracking ID found')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/login'); return }

      // Find deposit by order tracking ID
      const { data: deposit } = await supabase
        .from('deposits')
        .select('*, campaigns(id)')
        .eq('pesapal_order_tracking_id', orderTrackingId)
        .eq('brand_id', user.id)
        .single()

      if (!deposit) {
        setStatus('failed')
        setMessage('Deposit not found')
        return
      }

      // Get Pesapal credentials
      const pesapalKey = import.meta.env.VITE_PESAPAL_CONSUMER_KEY
      const pesapalSecret = import.meta.env.VITE_PESAPAL_CONSUMER_SECRET

      if (!pesapalKey || !pesapalSecret) {
        setStatus('failed')
        setMessage('Pesapal credentials not configured')
        return
      }

      // Check transaction status
      const txStatus = await getTransactionStatus(pesapalKey, pesapalSecret, orderTrackingId)

      if (txStatus.status_code === 1) {
        // Payment successful
        await supabase.from('deposits').update({
          status: 'completed'
        }).eq('id', deposit.id)

        // Update campaign status to live
        await supabase.from('campaigns').update({
          status: 'live',
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + deposit.campaigns.period_days * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', deposit.campaigns.id)

        
        setStatus('success')
        setMessage('Payment successful! Your campaign is now live.')
      } else if (txStatus.status_code === 0) {
        // Pending
        setStatus('pending')
        setMessage('Payment is being processed. Please wait...')
      } else {
        // Failed
        await supabase.from('deposits').update({
          status: 'failed'
        }).eq('id', deposit.id)

        setStatus('failed')
        setMessage('Payment failed. Please try again.')
      }
    } catch (err: any) {
      setStatus('failed')
      setMessage(`Error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0a06] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="text-yellow-500 text-3xl font-bold mb-2">Lipa<span className="text-white">Clip</span></div>
          
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-8 mt-8">
            {status === 'checking' && (
              <>
                <div className="animate-spin text-yellow-500 text-4xl mb-4">⏳</div>
                <p className="text-gray-400 text-sm">Verifying payment...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="text-green-400 text-4xl mb-4">✅</div>
                <h2 className="text-white font-bold text-lg mb-2">Payment Successful!</h2>
                <p className="text-gray-400 text-sm mb-6">{message}</p>
                <Link
                  to="/brand"
                  className="block w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition text-sm text-center"
                >
                  Go to Dashboard
                </Link>
              </>
            )}

            {status === 'pending' && (
              <>
                <div className="text-yellow-500 text-4xl mb-4 animate-pulse">⏳</div>
                <h2 className="text-white font-bold text-lg mb-2">Payment Pending</h2>
                <p className="text-gray-400 text-sm mb-6">{message}</p>
                <button
                  onClick={checkPayment}
                  className="block w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition text-sm text-center"
                >
                  Check Status
                </button>
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="text-red-400 text-4xl mb-4">❌</div>
                <h2 className="text-white font-bold text-lg mb-2">Payment Failed</h2>
                <p className="text-gray-400 text-sm mb-6">{message}</p>
                <div className="space-y-2">
                  <button
                    onClick={checkPayment}
                    className="block w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-lg transition text-sm text-center"
                  >
                    Try Again
                  </button>
                  <Link
                    to="/brand"
                    className="block w-full border border-yellow-500/40 hover:border-yellow-500 text-yellow-400 font-bold py-3 rounded-lg transition text-sm text-center"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}