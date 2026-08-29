// Deploy: supabase functions deploy submit-pesapal-order
// Secrets needed (supabase secrets set ...):
//   PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_IPN_ID,
//   PESAPAL_ENV ("sandbox" | "live"), PESAPAL_CALLBACK_URL
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getPesapalToken, PESAPAL_BASE } from '../_shared/pesapal.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: corsHeaders })
    }

    const { campaignId, amount, email, phone } = await req.json()
    if (!campaignId || !amount) {
      return new Response(JSON.stringify({ error: 'campaignId and amount are required' }), { status: 400, headers: corsHeaders })
    }

    const merchantReference = `LC-${campaignId.slice(0, 8)}-${Date.now()}`
    const token = await getPesapalToken()

    const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: merchantReference,
        currency: 'UGX',
        amount,
        description: 'LipaClip campaign funding',
        callback_url: Deno.env.get('PESAPAL_CALLBACK_URL'),
        notification_id: Deno.env.get('PESAPAL_IPN_ID'),
        billing_address: {
          email_address: email || user.email,
          phone_number: phone || '',
          country_code: 'UG',
        },
      }),
    })

    const order = await orderRes.json()
    if (!orderRes.ok || !order.redirect_url) {
      throw new Error(order.message || 'Pesapal order submission failed')
    }

    // Record the pending deposit using service-role client (bypasses RLS for this write)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await admin.from('deposits').insert({
      brand_id: user.id,
      campaign_id: campaignId,
      amount,
      total_charged: amount,
      pesapal_merchant_reference: merchantReference,
      pesapal_order_tracking_id: order.order_tracking_id,
      status: 'pending',
    })

    return new Response(
      JSON.stringify({ redirect_url: order.redirect_url, order_tracking_id: order.order_tracking_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
