// Deploy: supabase functions deploy check-pesapal-status
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getPesapalToken, PESAPAL_BASE } from '../_shared/pesapal.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { orderTrackingId } = await req.json()
    if (!orderTrackingId) {
      return new Response(JSON.stringify({ error: 'orderTrackingId is required' }), { status: 400, headers: corsHeaders })
    }

    const token = await getPesapalToken()
    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      { headers: { Accept: 'application/json', Authorization: `Bearer ${token}` } }
    )
    const status = await statusRes.json()

    // status_code: 0=INVALID, 1=COMPLETED, 2=FAILED, 3=REVERSED
    if (status.status_code === 1) {
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
      const { data: deposit } = await admin
        .from('deposits')
        .select('*')
        .eq('pesapal_order_tracking_id', orderTrackingId)
        .single()

      if (deposit && deposit.status !== 'completed') {
        await admin.from('deposits').update({ status: 'completed' }).eq('id', deposit.id)
        await admin.from('campaigns').update({ status: 'live', starts_at: new Date().toISOString() }).eq('id', deposit.campaign_id)
      }
    }

    return new Response(JSON.stringify(status), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
