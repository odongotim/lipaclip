type Props = { status: string; className?: string }

const MAP: Record<string, { label: string; cls: string }> = {
  live: { label: 'Live', cls: 'bg-green-50 text-green-800' },
  approved: { label: 'Approved', cls: 'bg-green-50 text-green-800' },
  completed: { label: 'Completed', cls: 'bg-blue-50 text-blue-800' },
  pending: { label: 'Pending', cls: 'bg-brand-100 text-brand-800' },
  processing: { label: 'Processing', cls: 'bg-brand-100 text-brand-800' },
  accepted: { label: 'Accepted', cls: 'bg-green-50 text-green-800' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700' },
  declined: { label: 'Declined', cls: 'bg-stone-100 text-stone-600' },
  failed: { label: 'Failed', cls: 'bg-red-50 text-red-700' },
}

/** One look for every status chip in the app. */
export default function StatusBadge({ status, className = '' }: Props) {
  const m = MAP[status] || { label: status, cls: 'bg-stone-100 text-stone-600' }
  return <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${m.cls} ${className}`}>{m.label}</span>
}
