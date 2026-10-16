import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { subscribeToTable } from './supabase'

/**
 * Keeps a small number up to date for a tab badge.
 * `fetchCount` returns the number to show (0 hides the badge). It re-runs when the person
 * changes page and whenever the watched table changes (live updates, if Realtime is on for it).
 */
export function useTabBadge(table: string, fetchCount: () => Promise<number>): number {
  const [count, setCount] = useState(0)
  const { pathname } = useLocation()

  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const n = await fetchCount()
        if (!cancelled) setCount(n)
      } catch {
        if (!cancelled) setCount(0) // a missing table or no access should never break the nav
      }
    }
    refresh()
    const unsub = subscribeToTable(table, refresh)
    return () => { cancelled = true; unsub() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, table])

  return count
}
