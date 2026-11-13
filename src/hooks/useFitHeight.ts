import { useLayoutEffect, useRef } from 'react'

/** İçerik, içinde durduğu kutuya sığmıyorsa orantılı küçültülür; kaydırma gerekmez. `layout` değişince yeniden ölçülür. */
export function useFitHeight<T extends HTMLElement>(layout: string) {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box) return
    const fit = () => {
      el.style.zoom = '1'
      const s = getComputedStyle(box)
      const room = box.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom)
      el.style.zoom = String(Math.min(1, room / el.offsetHeight))
    }
    fit()
    void document.fonts.ready.then(fit)
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [layout])

  return ref
}
