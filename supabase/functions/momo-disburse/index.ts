// Deploy: supabase functions deploy momo-disburse
// Secrets needed: MOMO_ENV, MOMO_DISBURSEMENT_SUBSCRIPTION_KEY,
//   MOMO_DISBURSEMENT_API_USER, MOMO_DISBURSEMENT_API_KEY, (MOMO_CURRENCY in prod)
//
// Called by an admin from the Withdrawals screen to actually push the payout
// to the influencer's MoMo phone number. Only users with role = 'admin' may
// call this — verified server-side, not just hidden in the UI.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { transfer } from '../_shared/momo.ts'

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

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: corsHeaders })
    }

    const { withdrawalId } = await req.json()
    if (!withdrawalId) {
      return new Response(JSON.stringify({ error: 'withdrawalId is required' }), { status: 400, headers: corsHeaders })
    }

    const { data: withdrawal, error: wErr } = await admin.from('withdrawals').select('*').eq('id', withdrawalId).single()
    if (wErr || !withdrawal) {
      return new Response(JSON.stringify({ error: 'Withdrawal not found' }), { status: 404, headers: corsHeaders })
    }
    if (withdrawal.status !== 'pending') {
      return new Response(JSON.stringify({ error: `Withdrawal is already ${withdrawal.status}` }), { status: 400, headers: corsHeaders })
    }

    const referenceId = crypto.randomUUID()
    const externalId = `LC-W-${withdrawalId.slice(0, 8)}-${Date.now()}`

    await transfer({
      referenceId,
      amount: withdrawal.net_amount,
      phone: withdrawal.phone,
      externalId,
      payerMessage: 'LipaClip withdrawal',
      payeeNote: 'LipaClip payout',
    })

    await admin.from('withdrawals').update({
      status: 'processing',
      momo_reference_id: referenceId,
      momo_external_id: externalId,
      momo_status: 'PENDING',
      processed_at: new Date().toISOString(),
    }).eq('id', withdrawalId)

    return new Response(JSON.stringify({ reference_id: referenceId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
