// Deploy: supabase functions deploy momo-request-to-pay
// Secrets needed: MOMO_ENV, MOMO_COLLECTION_SUBSCRIPTION_KEY,
//   MOMO_COLLECTION_API_USER, MOMO_COLLECTION_API_KEY, (MOMO_CURRENCY in prod)
//
// Pushes an MTN MoMo "request to pay" prompt to the brand's phone for the
// campaign deposit and records a pending deposit row. The frontend then
// polls momo-check-deposit-status with the returned reference_id.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { requestToPay } from '../_shared/momo.ts'

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

    const { campaignId, amount, phone } = await req.json()
    if (!campaignId || !amount || !phone) {
      return new Response(JSON.stringify({ error: 'campaignId, amount and phone are required' }), { status: 400, headers: corsHeaders })
    }

    const referenceId = crypto.randomUUID()
    const externalId = `LC-${campaignId.slice(0, 8)}-${Date.now()}`

    await requestToPay({
      referenceId,
      amount,
      phone,
      externalId,
      payerMessage: 'LipaClip campaign funding',
      payeeNote: 'LipaClip deposit',
    })

    // Record the pending deposit using service-role client (bypasses RLS for this write)
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    await admin.from('deposits').insert({
      brand_id: user.id,
      campaign_id: campaignId,
      amount,
      total_charged: amount,
      phone,
      momo_reference_id: referenceId,
      momo_external_id: externalId,
      momo_status: 'PENDING',
      status: 'pending',
    })

    return new Response(
      JSON.stringify({ reference_id: referenceId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
