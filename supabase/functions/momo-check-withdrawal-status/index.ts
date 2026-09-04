// Deploy: supabase functions deploy momo-check-withdrawal-status
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getTransferStatus } from '../_shared/momo.ts'

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

    const { referenceId } = await req.json()
    if (!referenceId) {
      return new Response(JSON.stringify({ error: 'referenceId is required' }), { status: 400, headers: corsHeaders })
    }

    const { status, raw } = await getTransferStatus(referenceId)

    const { data: withdrawal } = await admin.from('withdrawals').select('*').eq('momo_reference_id', referenceId).single()
    if (withdrawal && withdrawal.status === 'processing') {
      if (status === 'SUCCESSFUL') {
        await admin.from('withdrawals').update({ status: 'approved', momo_status: status }).eq('id', withdrawal.id)
      } else if (status === 'FAILED') {
        await admin.from('withdrawals').update({ status: 'rejected', momo_status: status }).eq('id', withdrawal.id)
      } else {
        await admin.from('withdrawals').update({ momo_status: status }).eq('id', withdrawal.id)
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
