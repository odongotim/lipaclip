import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <p className="font-display text-6xl font-extrabold text-stone-900 mb-2">404</p>
        <h1 className="text-stone-900 font-semibold mb-1">This page does not exist</h1>
        <p className="text-stone-600 text-sm mb-6">The link may be old or mistyped.</p>
        <Link to="/" className="gold-shimmer inline-block bg-brand-700 hover:bg-brand-800 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors">Go to the home page</Link>
      </div>
    </div>
  )
}
