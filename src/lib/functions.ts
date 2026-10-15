/**
 * supabase.functions.invoke() hides the real error when an edge function answers with a
 * non-2xx status: `data` is null and `error.message` is the generic
 * "Edge Function returned a non-2xx status code". The real message is in the response body.
 */
export async function functionError(fnError: any, data: any, fallback: string): Promise<string> {
  if (data?.error) return String(data.error)
  try {
    const body = await fnError?.context?.json?.()
    if (body?.error) return String(body.error)
    if (body?.message) return String(body.message)
  } catch { /* body was not JSON */ }
  const generic = fnError?.message as string | undefined
  if (generic && !generic.includes('non-2xx')) return generic
  return fallback
}
