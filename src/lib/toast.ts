export type ToastType = 'info' | 'success' | 'error'

/** Shows a short message at the bottom of the screen. Replaces browser alert(). */
export function toast(message: string, type: ToastType = 'info') {
  window.dispatchEvent(new CustomEvent('lipaclip-toast', { detail: { message, type } }))
}
