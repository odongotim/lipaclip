type Props = { label: string; value: string; hint?: string; tone?: 'default' | 'money' | 'good' }

const TONES = { default: 'text-stone-900', money: 'text-brand-700', good: 'text-green-800' }

export default function StatCard({ label, value, hint, tone = 'default' }: Props) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 min-w-0">
      <div className={`font-display text-xl sm:text-2xl font-extrabold tabular-nums leading-tight break-words ${TONES[tone]}`}>{value}</div>
      <div className="text-stone-500 text-xs mt-1">{label}</div>
      {hint && <div className="text-stone-400 text-xs mt-0.5">{hint}</div>}
    </div>
  )
}
