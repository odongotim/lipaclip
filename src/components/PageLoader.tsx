export default function PageLoader() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div role="status" className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" />
        <span className="text-stone-500 text-sm">Loading</span>
      </div>
    </div>
  )
}
