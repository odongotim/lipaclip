import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'lipaclip',
    },
  },
})

// Reads the session from local storage (instant, no network round-trip).
// Prefer this over `supabase.auth.getUser()` for page-load "am I logged in?"
// checks — getUser() re-validates with the server on every call, which can
// race with session restoration on a hard refresh and incorrectly bounce a
// signed-in user to /login. getSession() also transparently refreshes an
// expired-but-refreshable session before returning.
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user ?? null
}

/**
 * Subscribes to any insert/update/delete on a table and calls `onChange`.
 * Used so dashboards refresh live instead of only on page load — e.g. an
 * admin updating a submission's view count shows up immediately for the
 * brand/influencer/landing page without them refreshing the browser.
 *
 * NOTE: this requires the table to have Realtime enabled in Supabase
 * (Dashboard → Database → Replication → toggle the table on).
 */
export function subscribeToTable(table: string, onChange: () => void) {
  const channel = supabase
    .channel(`realtime-${table}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
