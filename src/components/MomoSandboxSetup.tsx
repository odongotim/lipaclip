import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { functionError } from '../lib/functions'
import { toast } from '../lib/toast'

type Result = { product: string; secrets: Record<string, string> }

/**
 * Sandbox helper for admins: creates a fresh MTN MoMo API user and key.
 * If this fails, the subscription key is wrong or inactive. If it works but payments still
 * fail, replace the old API user and key secrets with the new ones shown here.
 */
export default function MomoSandboxSetup() {
  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')

  const run = async (product: 'collection' | 'disbursement') => {
    setBusy(product); setError(''); setResult(null)
    const { data, error: fnError } = await supabase.functions.invoke('momo-provision-sandbox', { body: { product } })
    if (fnError || data?.error) setError(await functionError(fnError, data, 'Could not create sandbox credentials'))
    else setResult(data as Result)
    setBusy(null)
  }

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast('Copied', 'success') }
    catch { toast('Could not copy. Press and hold the value to copy it.', 'error') }
  }

  return (
    <section className="mt-10 max-w-xl bg-white border border-stone-200 rounded-2xl p-5" aria-labelledby="momo-setup-heading">
      <h2 id="momo-setup-heading" className="font-display text-stone-900 font-bold mb-1">MTN MoMo sandbox setup</h2>
      <p className="text-stone-500 text-xs mb-4">
        Creates a fresh API user and key for testing. Needs the product's subscription key to be saved as a secret first. Only works while MOMO_ENV is not production.
      </p>

      <div className="flex gap-2 flex-wrap mb-4">
        <button onClick={() => run('collection')} disabled={busy !== null}
          className="bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-lg">
          {busy === 'collection' ? 'Creating...' : 'Create collection credentials'}
        </button>
        <button onClick={() => run('disbursement')} disabled={busy !== null}
          className="border border-stone-300 hover:bg-stone-50 disabled:opacity-50 text-stone-800 text-xs font-bold px-4 py-2 rounded-lg">
          {busy === 'disbursement' ? 'Creating...' : 'Create disbursement credentials'}
        </button>
      </div>

      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg break-words">{error}</div>}

      {result && (
        <div role="status" className="space-y-3">
          <p className="text-green-800 text-xs font-semibold">Created. Save both as secrets in Supabase (Edge Functions, Secrets), replacing the old values. They are shown only once.</p>
          {Object.entries(result.secrets).map(([name, value]) => (
            <div key={name} className="bg-stone-50 border border-stone-200 rounded-lg p-3">
              <div className="text-stone-500 text-[11px] mb-1">{name}</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-stone-900 break-all select-all">{value}</code>
                <button onClick={() => copy(value)} className="text-xs font-semibold text-brand-800 hover:text-brand-900 px-2 py-1">Copy</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
