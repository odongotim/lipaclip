// Deploy: supabase functions deploy momo-check-deposit-status
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getRequestToPayStatus } from '../_shared/momo.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { referenceId } = await req.json()
    if (!referenceId) {
      return new Response(JSON.stringify({ error: 'referenceId is required' }), { status: 400, headers: corsHeaders })
    }

    const { status, raw } = await getRequestToPayStatus(referenceId)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: deposit } = await admin
      .from('deposits')
      .select('*')
      .eq('momo_reference_id', referenceId)
      .single()

    if (deposit && deposit.status === 'pending') {
      if (status === 'SUCCESSFUL') {
        await admin.from('deposits').update({ status: 'completed', momo_status: status }).eq('id', deposit.id)
        await admin.from('campaigns').update({ status: 'live', starts_at: new Date().toISOString() }).eq('id', deposit.campaign_id)
      } else if (status === 'FAILED') {
        await admin.from('deposits').update({ status: 'failed', momo_status: status }).eq('id', deposit.id)
        await admin.from('campaigns').update({ status: 'failed' }).eq('id', deposit.campaign_id)
      } else {
        await admin.from('deposits').update({ momo_status: status }).eq('id', deposit.id)
      }
    }

    return new Response(JSON.stringify({ status, reason: raw?.reason || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
