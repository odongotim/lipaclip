import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getCurrentUser } from '../../lib/supabase'
import AdminSidebar from '../../components/AdminSidebar'
import PageLoader from '../../components/PageLoader'
import StatusBadge from '../../components/StatusBadge'
import { toast } from '../../lib/toast'
import { timeAgo } from '../../lib/timeAgo'

type Submission = {
  id: string; video_url: string; views: number; earnings: number; status: string
  submitted_at: string; campaign_id: string
  last_checked_at?: string | null; views_source?: string; views_locked?: boolean
  views_flag?: string | null; views_error?: string | null; views_error_count?: number
  profiles: { display_name: string; email: string }
  campaigns: { title: string; pay_per_1k: number; budget: number; spent: number }
}

export default function Views() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newViews, setNewViews] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [testUrl, setTestUrl] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const user = await getCurrentUser()
    if (!user) { navigate('/login'); return }
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof?.role !== 'admin') { navigate('/'); return }
    setProfile(prof)
    const { data: subs } = await supabase.from('submissions').select('*, profiles(display_name, email), campaigns(title, pay_per_1k, budget, spent)').order('submitted_at', { ascending: false })
    if (subs) setSubmissions(subs as any)
    setLoading(false)
  }

  // All earnings maths (including the budget cap) happens in the database function, under a lock.
  const handleUpdateViews = async (sub: Submission) => {
    setSaving(true)
    const { data, error } = await supabase.rpc('apply_submission_views', {
      p_submission_id: sub.id,
      p_views: Math.max(0, Math.floor(newViews)),
      p_source: 'manual',
      p_lock: true,
      p_allow_decrease: true,
    })
    if (error) {
      toast(`Could not update views: ${error.message}`, 'error')
    } else {
      await loadData()
      toast(data?.capped
        ? `Views updated. Earnings capped at ${fmtUGX(data.earnings)} because this campaign's budget is fully allocated.`
        : 'Views updated. Auto-tracking is paused for this video until you resume it.', data?.capped ? 'info' : 'success')
    }
    setEditing(null)
    setSaving(false)
  }

  const refreshViews = async (submissionId?: string) => {
    setRefreshing(submissionId || 'all')
    const { data, error } = await supabase.functions.invoke('refresh-views', { body: submissionId ? { submission_id: submissionId } : {} })
    if (error || data?.error) {
      toast(`Could not refresh: ${data?.error || error?.message || 'unknown error'}`, 'error')
    } else {
      toast(`Checked ${data.checked}: ${data.applied} updated, ${data.unchanged} unchanged, ${data.flagged} flagged, ${data.errors} errors.`, data.errors || data.flagged ? 'info' : 'success')
      await loadData()
    }
    setRefreshing(null)
  }

  const resumeAuto = async (id: string) => {
    const { error } = await supabase.from('submissions')
      .update({ views_locked: false, views_flag: null, views_error: null, views_error_count: 0 }).eq('id', id)
    if (error) { toast(error.message, 'error'); return }
    setSubmissions(submissions.map(s => s.id === id ? { ...s, views_locked: false, views_flag: null, views_error: null, views_error_count: 0 } : s))
    toast('Auto-tracking resumed for this video.', 'success')
  }

  const testLink = async () => {
    if (!testUrl.trim()) return
    setTesting(true); setTestResult(null)
    const { data, error } = await supabase.functions.invoke('refresh-views', { body: { test_url: testUrl.trim() } })
    setTestResult(error ? { ok: false, error: error.message } : data)
    setTesting(false)
  }

  const handleApprove = async (id: string) => {
    await supabase.from('submissions').update({ status: 'approved' }).eq('id', id)
    setSubmissions(submissions.map(s => s.id === id ? { ...s, status: 'approved' } : s))
    setMessage('Submission approved!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleReject = async (id: string) => {
    const sub = submissions.find(s => s.id === id)
    await supabase.from('submissions').update({ status: 'rejected', earnings: 0 }).eq('id', id)

    // Rejecting frees up the budget this submission had been counted against
    if (sub && (sub.earnings || 0) > 0) {
      const newSpent = Math.max(0, (sub.campaigns?.spent || 0) - (sub.earnings || 0))
      await supabase.from('campaigns').update({ spent: newSpent }).eq('id', sub.campaign_id)
      setSubmissions(submissions.map(s => s.campaign_id === sub.campaign_id
        ? { ...s, ...(s.id === id ? { status: 'rejected', earnings: 0 } : {}), campaigns: { ...s.campaigns, spent: newSpent } }
        : s))
    } else {
      setSubmissions(submissions.map(s => s.id === id ? { ...s, status: 'rejected', earnings: 0 } : s))
    }
  }

  const copyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const fmtUGX = (n: number) => `UGX ${n.toLocaleString()}`

  // Group submissions by campaign so we can show one "budget earned by everyone" bar per campaign
  const campaignGroups = (() => {
    const map = new Map<string, { title: string; budget: number; spent: number; subs: Submission[] }>()
    submissions.forEach(s => {
      const key = s.campaign_id
      if (!map.has(key)) {
        map.set(key, { title: s.campaigns?.title || 'Unknown Campaign', budget: s.campaigns?.budget || 0, spent: s.campaigns?.spent || 0, subs: [] })
      }
      map.get(key)!.subs.push(s)
    })
    return Array.from(map.entries()).map(([id, g]) => ({ id, ...g }))
  })()

  if (loading) return (
    <PageLoader />
  )

  return (
    <div className="min-h-screen bg-stone-50 flex">
      <AdminSidebar userName={profile?.display_name} />
      <main className="lg:ml-64 flex-1 p-6 pt-16 lg:pt-8">
        <h1 className="text-stone-900 text-2xl font-bold mb-1">Manage views</h1>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <p className="text-stone-500 text-sm max-w-md">Views update automatically for approved videos. Edit a count by hand to override it.</p>
          <button onClick={() => refreshViews()} disabled={refreshing !== null}
            className="bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors">
            {refreshing === 'all' ? 'Checking views...' : 'Refresh views now'}
          </button>
        </div>

        <details className="bg-white border border-stone-200 rounded-xl mb-6 group">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-stone-900 flex items-center justify-between [&::-webkit-details-marker]:hidden">
            Test a link
            <span aria-hidden="true" className="text-brand-700 text-lg leading-none transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="px-4 pb-4">
            <p className="text-stone-500 text-xs mb-3">Paste a YouTube, TikTok, Instagram or X link to see what the tracker reads. Nothing is saved.</p>
            <div className="flex gap-2">
              <input type="url" value={testUrl} onChange={e => setTestUrl(e.target.value)} placeholder="https://www.tiktok.com/@name/video/..." aria-label="Link to test"
                className="flex-1 min-w-0 bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
              <button onClick={testLink} disabled={testing || !testUrl.trim()}
                className="bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg">{testing ? 'Testing...' : 'Test'}</button>
            </div>
            {testResult && (
              <div className="mt-3 text-xs" role="status">
                {testResult.ok
                  ? <p className="text-green-800 font-semibold">{testResult.platform}: {Number(testResult.views).toLocaleString()} views</p>
                  : <p className="text-red-700 font-semibold">{testResult.error}</p>}
                {testResult.raw && <pre className="mt-2 bg-stone-50 border border-stone-200 rounded-lg p-3 overflow-x-auto text-[11px] text-stone-600 whitespace-pre-wrap break-all max-h-48">{testResult.raw}</pre>}
              </div>
            )}
          </div>
        </details>

        {message && <div role="status" className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-6">{message}</div>}

        <div className="space-y-8">
          {campaignGroups.map(group => (
            <div key={group.id}>
              <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-stone-900 font-semibold text-sm">{group.title}</h2>
                  <span className="text-stone-500 text-xs">{fmtUGX(group.spent)} of {fmtUGX(group.budget)} earned</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2">
                  <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${group.budget > 0 ? Math.min((group.spent / group.budget) * 100, 100) : 0}%` }} />
                </div>
              </div>
              <div className="space-y-4">
                {group.subs.map(sub => (
            <div key={sub.id} className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div>
                  <h3 className="text-stone-900 font-semibold text-sm">{sub.profiles?.display_name}</h3>
                  <div className="text-stone-400 text-xs mb-1">{sub.campaigns?.title}</div>
                  {/* Video link - copyable */}
                  <div className="flex items-center gap-2">
                    <a href={sub.video_url} target="_blank" rel="noopener noreferrer" className="text-brand-700 text-xs hover:underline truncate max-w-xs">{sub.video_url}</a>
                    <button onClick={() => copyLink(sub.video_url, sub.id)} className="text-stone-500 hover:text-brand-600 text-xs flex-shrink-0">
                      {copied === sub.id
                        ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      }
                    </button>
                  </div>
                </div>
                <StatusBadge status={sub.status} />
              </div>

              <div className="flex gap-6 mb-3">
                <div><div className="text-stone-900 font-bold text-sm">{(sub.views || 0).toLocaleString()}</div><div className="text-stone-400 text-xs">views</div></div>
                <div><div className="text-green-700 font-bold text-sm">{fmtUGX(sub.earnings || 0)}</div><div className="text-stone-400 text-xs">earned</div></div>
                <div><div className="text-stone-600 font-bold text-sm">{fmtUGX(sub.campaigns?.pay_per_1k || 0)}</div><div className="text-stone-400 text-xs">per 1k</div></div>
                <div><div className="text-blue-700 font-bold text-sm">{fmtUGX(sub.campaigns?.budget || 0)}</div><div className="text-stone-400 text-xs">budget</div></div>
              </div>

              {/* Tracking status */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mb-2">
                <span className={`px-2 py-0.5 rounded-full ${sub.views_locked ? 'bg-stone-100 text-stone-600' : sub.views_source === 'auto' ? 'bg-green-50 text-green-800' : 'bg-stone-100 text-stone-600'}`}>
                  {sub.views_locked ? 'Manual (auto-tracking paused)' : sub.views_source === 'auto' ? 'Auto-tracked' : 'Not auto-tracked yet'}
                </span>
                {sub.last_checked_at && <span>Checked {timeAgo(sub.last_checked_at)}</span>}
              </div>
              {sub.views_flag && <div role="alert" className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-3 py-2 rounded-lg mb-2"><strong>Needs review:</strong> {sub.views_flag}</div>}
              {sub.views_error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg mb-2">Last check failed: {sub.views_error}{(sub.views_error_count || 0) >= 5 ? ' (retries stopped)' : ''}</div>}

              {editing === sub.id ? (
                <div className="flex gap-2 items-center mt-2">
                  <input type="number" value={newViews} onChange={e => setNewViews(Number(e.target.value))}
                    className="flex-1 bg-stone-50 border border-stone-200 text-stone-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                    placeholder="Enter view count" />
                  <button onClick={() => handleUpdateViews(sub)} disabled={saving}
                    className="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold px-3 py-2 rounded-lg transition disabled:opacity-50">
                    {saving ? '...' : 'Save'}
                  </button>
                  <button onClick={() => setEditing(null)} className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-2 rounded-lg">Cancel</button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap mt-2">
                  <button onClick={() => { setEditing(sub.id); setNewViews(sub.views || 0) }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-100 hover:bg-brand-100 text-brand-700 transition">
                    Update views
                  </button>
                  {sub.status === 'approved' && !sub.views_locked && (
                    <button onClick={() => refreshViews(sub.id)} disabled={refreshing !== null}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition disabled:opacity-50">
                      {refreshing === sub.id ? 'Checking...' : 'Check now'}
                    </button>
                  )}
                  {(sub.views_locked || sub.views_flag || (sub.views_error_count || 0) >= 5) && (
                    <button onClick={() => resumeAuto(sub.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition">Resume auto-tracking</button>
                  )}
                  {sub.status === 'pending' && <>
                    <button onClick={() => handleApprove(sub.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition">Approve</button>
                    <button onClick={() => handleReject(sub.id)} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition">Reject</button>
                  </>}
                </div>
              )}
            </div>
                ))}
              </div>
            </div>
          ))}
          {submissions.length === 0 && <div className="text-center py-12"><p className="text-stone-500">No submissions yet</p></div>}
        </div>
      </main>
    </div>
  )
}
