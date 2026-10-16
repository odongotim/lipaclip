import { useEffect, useState } from 'react'
import type { ToastType } from '../lib/toast'

type Item = { id: number; message: string; type: ToastType }

const STYLES: Record<ToastType, string> = {
  info: 'bg-stone-900 text-stone-50',
  success: 'bg-green-700 text-white',
  error: 'bg-red-700 text-white',
}

export default function ToastHost() {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    let nextId = 1
    const onToast = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail as { message: string; type: ToastType }
      const id = nextId++
      setItems(prev => [...prev.slice(-2), { id, message, type }])
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 4500)
    }
    window.addEventListener('lipaclip-toast', onToast)
    return () => window.removeEventListener('lipaclip-toast', onToast)
  }, [])

  return (
    <div role="status" aria-live="polite" className="fixed bottom-24 md:bottom-4 inset-x-0 z-[60] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {items.map(i => (
        <div key={i.id} className={`pointer-events-auto max-w-md w-full sm:w-auto rounded-xl px-4 py-3 text-sm shadow-lg flex items-start gap-3 ${STYLES[i.type]}`}>
          <span className="flex-1">{i.message}</span>
          <button onClick={() => setItems(prev => prev.filter(x => x.id !== i.id))} aria-label="Dismiss" className="opacity-70 hover:opacity-100 leading-none text-lg">×</button>
        </div>
      ))}
    </div>
  )
}
