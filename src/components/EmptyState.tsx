import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Props = { title: string; description?: string; actionLabel?: string; actionTo?: string; icon?: ReactNode }

/** An empty screen is an invitation to act: say what is missing and offer the next step. */
export default function EmptyState({ title, description, actionLabel, actionTo, icon }: Props) {
  return (
    <div className="bg-white border border-dashed border-stone-300 rounded-2xl px-6 py-12 text-center">
      {icon && <div className="flex justify-center mb-3 text-stone-400">{icon}</div>}
      <h3 className="text-stone-900 font-semibold text-sm mb-1">{title}</h3>
      {description && <p className="text-stone-500 text-sm max-w-sm mx-auto">{description}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="gold-shimmer inline-block mt-5 bg-brand-700 hover:bg-brand-800 text-white text-sm font-bold px-6 py-2.5 rounded-lg transition-colors">{actionLabel}</Link>
      )}
    </div>
  )
}
