import { Component } from 'react'
import type { ReactNode } from 'react'

type State = { failed: boolean }

/** Stops a render error from leaving a blank white screen. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }
  static getDerivedStateFromError(): State { return { failed: true } }
  componentDidCatch(error: unknown) { console.error('LipaClip render error:', error) }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-2xl font-extrabold text-stone-900 mb-2">Something went wrong</h1>
          <p className="text-stone-600 text-sm mb-6">This page hit an error. Reload to try again. Your data is safe.</p>
          <button onClick={() => window.location.reload()} className="bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">Reload page</button>
        </div>
      </div>
    )
  }
}
