// Shared MTN Mobile Money (MoMo) Open API helpers used by both edge functions.
// Docs: https://momodeveloper.mtn.com
//
// MTN MoMo has two separate "products", each with its own subscription key and
// its own API user / API key pair:
//   - Collections   -> used to pull money IN from a brand's phone (deposits)
//   - Disbursements -> used to push money OUT to an influencer's phone (withdrawals)
//
// Secrets needed (supabase secrets set ...):
//   MOMO_ENV                        "sandbox" | "production"   (default sandbox)
//   MOMO_CURRENCY                   sandbox only supports "EUR" — leave unset in sandbox
//   MOMO_CALLBACK_HOST              e.g. your Supabase project ref host, used for provisioning
//
//   MOMO_COLLECTION_SUBSCRIPTION_KEY
//   MOMO_COLLECTION_API_USER        (a UUID you generate once during setup)
//   MOMO_COLLECTION_API_KEY         (returned by MTN when you provision the api user)
//
//   MOMO_DISBURSEMENT_SUBSCRIPTION_KEY
//   MOMO_DISBURSEMENT_API_USER
//   MOMO_DISBURSEMENT_API_KEY

export type MomoProduct = 'collection' | 'disbursement'

const MOMO_BASE = Deno.env.get('MOMO_ENV') === 'production'
  ? 'https://proxy.momoapi.mtn.com' // replace with your live MTN-issued base URL
  : 'https://sandbox.momodeveloper.mtn.com'

export const MOMO_TARGET_ENV = Deno.env.get('MOMO_ENV') === 'production' ? 'production' : 'sandbox'

// Sandbox only ever settles in EUR regardless of the "real" currency you plan
// to go live with (UGX, etc). Override with MOMO_CURRENCY once you're live.
export const MOMO_CURRENCY = Deno.env.get('MOMO_CURRENCY') || (MOMO_TARGET_ENV === 'sandbox' ? 'EUR' : 'UGX')

function requireEnv(name: string): string {
  const v = Deno.env.get(name)
  if (!v) throw new Error(`Missing required secret: ${name}`)
  return v
}

function subscriptionKeyFor(product: MomoProduct): string {
  return product === 'collection'
    ? requireEnv('MOMO_COLLECTION_SUBSCRIPTION_KEY')
    : requireEnv('MOMO_DISBURSEMENT_SUBSCRIPTION_KEY')
}

function apiUserFor(product: MomoProduct): string {
  return product === 'collection'
    ? requireEnv('MOMO_COLLECTION_API_USER')
    : requireEnv('MOMO_DISBURSEMENT_API_USER')
}

function apiKeyFor(product: MomoProduct): string {
  return product === 'collection'
    ? requireEnv('MOMO_COLLECTION_API_KEY')
    : requireEnv('MOMO_DISBURSEMENT_API_KEY')
}

/**
 * One-time sandbox provisioning helper: creates an API user + API key for a
 * given product. You normally run this once (e.g. via `supabase functions
 * invoke momo-provision-sandbox`) and then save the returned apiUser/apiKey
 * as secrets — you do NOT need to call this on every request.
 */
export async function provisionSandboxUser(product: MomoProduct, referenceId: string) {
  const subscriptionKey = subscriptionKeyFor(product === 'collection' ? 'collection' : 'disbursement')
  const callbackHost = Deno.env.get('MOMO_CALLBACK_HOST') || 'example.com'

  const createRes = await fetch(`${MOMO_BASE}/v1_0/apiuser`, {
    method: 'POST',
    headers: {
      'X-Reference-Id': referenceId,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ providerCallbackHost: callbackHost }),
  })
  if (!createRes.ok && createRes.status !== 201) {
    const text = await createRes.text()
    throw new Error(`apiuser creation failed (${createRes.status}): ${text}`)
  }

  const keyRes = await fetch(`${MOMO_BASE}/v1_0/apiuser/${referenceId}/apikey`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': subscriptionKey },
  })
  const keyData = await keyRes.json()
  if (!keyRes.ok || !keyData.apiKey) {
    throw new Error(`apikey creation failed: ${JSON.stringify(keyData)}`)
  }

  return { apiUser: referenceId, apiKey: keyData.apiKey as string }
}

/** Gets a short-lived Bearer token for the Collections or Disbursements product. */
export async function getMomoToken(product: MomoProduct): Promise<string> {
  const subscriptionKey = subscriptionKeyFor(product)
  const apiUser = apiUserFor(product)
  const apiKey = apiKeyFor(product)
  const basic = btoa(`${apiUser}:${apiKey}`)

  const res = await fetch(`${MOMO_BASE}/${product}/token/`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error(`MoMo ${product} auth failed: ${data.message || res.statusText}`)
  }
  return data.access_token as string
}

/** Normalizes a Uganda mobile number ("0771234567" / "+256771234567") to MSISDN "256771234567". */
export function formatMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('256')) return digits
  if (digits.startsWith('0')) return `256${digits.slice(1)}`
  if (digits.length === 9) return `256${digits}`
  return digits
}

export type MomoStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED'

/** Collections: pushes a "request to pay" prompt to the payer's phone (brand deposit). */
export async function requestToPay(params: {
  referenceId: string
  amount: number
  phone: string
  externalId: string
  payerMessage?: string
  payeeNote?: string
}): Promise<void> {
  const token = await getMomoToken('collection')
  const subscriptionKey = subscriptionKeyFor('collection')

  const res = await fetch(`${MOMO_BASE}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Reference-Id': params.referenceId,
      'X-Target-Environment': MOMO_TARGET_ENV,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: MOMO_CURRENCY,
      externalId: params.externalId,
      payer: { partyIdType: 'MSISDN', partyId: formatMsisdn(params.phone) },
      payerMessage: params.payerMessage || 'LipaClip campaign funding',
      payeeNote: params.payeeNote || 'LipaClip deposit',
    }),
  })

  if (res.status !== 202) {
    const text = await res.text().catch(() => '')
    throw new Error(`requestToPay failed (${res.status}): ${text || res.statusText}`)
  }
}

export async function getRequestToPayStatus(referenceId: string): Promise<{ status: MomoStatus; raw: any }> {
  const token = await getMomoToken('collection')
  const subscriptionKey = subscriptionKeyFor('collection')

  const res = await fetch(`${MOMO_BASE}/collection/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Target-Environment': MOMO_TARGET_ENV,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`requestToPay status check failed: ${JSON.stringify(data)}`)
  return { status: data.status as MomoStatus, raw: data }
}

/** Disbursements: pushes money out to an influencer's phone (withdrawal payout). */
export async function transfer(params: {
  referenceId: string
  amount: number
  phone: string
  externalId: string
  payerMessage?: string
  payeeNote?: string
}): Promise<void> {
  const token = await getMomoToken('disbursement')
  const subscriptionKey = subscriptionKeyFor('disbursement')

  const res = await fetch(`${MOMO_BASE}/disbursement/v1_0/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Reference-Id': params.referenceId,
      'X-Target-Environment': MOMO_TARGET_ENV,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: MOMO_CURRENCY,
      externalId: params.externalId,
      payee: { partyIdType: 'MSISDN', partyId: formatMsisdn(params.phone) },
      payerMessage: params.payerMessage || 'LipaClip withdrawal',
      payeeNote: params.payeeNote || 'LipaClip payout',
    }),
  })

  if (res.status !== 202) {
    const text = await res.text().catch(() => '')
    throw new Error(`transfer failed (${res.status}): ${text || res.statusText}`)
  }
}

export async function getTransferStatus(referenceId: string): Promise<{ status: MomoStatus; raw: any }> {
  const token = await getMomoToken('disbursement')
  const subscriptionKey = subscriptionKeyFor('disbursement')

  const res = await fetch(`${MOMO_BASE}/disbursement/v1_0/transfer/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Target-Environment': MOMO_TARGET_ENV,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(`transfer status check failed: ${JSON.stringify(data)}`)
  return { status: data.status as MomoStatus, raw: data }
}
