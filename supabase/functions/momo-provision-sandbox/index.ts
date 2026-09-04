// One-time setup utility — NOT called by the app UI.
// Run once per product (collection / disbursement) to create the sandbox
// API user + API key, then save the output as secrets:
//   supabase secrets set MOMO_COLLECTION_API_USER=... MOMO_COLLECTION_API_KEY=...
//   supabase secrets set MOMO_DISBURSEMENT_API_USER=... MOMO_DISBURSEMENT_API_KEY=...
//
// Deploy:  supabase functions deploy momo-provision-sandbox
// Invoke:  supabase functions invoke momo-provision-sandbox --data '{"product":"collection"}'
//          supabase functions invoke momo-provision-sandbox --data '{"product":"disbursement"}'
//
// Requires MOMO_COLLECTION_SUBSCRIPTION_KEY / MOMO_DISBURSEMENT_SUBSCRIPTION_KEY
// to already be set (from the "Collections"/"Disbursements" products you
// subscribed to in the MTN MoMo Developer Portal).
import { provisionSandboxUser, type MomoProduct } from '../_shared/momo.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { product } = await req.json() as { product: MomoProduct }
    if (product !== 'collection' && product !== 'disbursement') {
      return new Response(JSON.stringify({ error: 'product must be "collection" or "disbursement"' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const referenceId = crypto.randomUUID()
    const result = await provisionSandboxUser(product, referenceId)

    return new Response(
      JSON.stringify({
        product,
        apiUser: result.apiUser,
        apiKey: result.apiKey,
        next_step: `supabase secrets set MOMO_${product.toUpperCase()}_API_USER=${result.apiUser} MOMO_${product.toUpperCase()}_API_KEY=${result.apiKey}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
})
