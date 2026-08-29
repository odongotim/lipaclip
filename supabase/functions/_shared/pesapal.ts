// Shared Pesapal API v3 helpers used by both edge functions.
// Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference

const PESAPAL_BASE = Deno.env.get('PESAPAL_ENV') === 'live'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3' // sandbox

export async function getPesapalToken(): Promise<string> {
  const consumer_key = Deno.env.get('PESAPAL_CONSUMER_KEY')
  const consumer_secret = Deno.env.get('PESAPAL_CONSUMER_SECRET')

  if (!consumer_key || !consumer_secret) {
    throw new Error('Missing PESAPAL_CONSUMER_KEY or PESAPAL_CONSUMER_SECRET secrets')
  }

  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ consumer_key, consumer_secret }),
  })

  const data = await res.json()
  if (!res.ok || !data.token) {
    throw new Error(`Pesapal auth failed: ${data.message || res.statusText}`)
  }
  return data.token as string
}

export { PESAPAL_BASE }
