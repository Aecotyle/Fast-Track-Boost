import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * GSAP staggered clip-cover reveal for headings (the signature
 * award-winning text entrance): each line lifts from behind a
 * metallic cover bar.
 */
export function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const lines = el.querySelectorAll('[data-line]')
    const covers = el.querySelectorAll('[data-cover]')
    const ctx = gsap.context(() => {
      gsap.set(covers, { yPercent: 0 })
      gsap.to(covers, {
        yPercent: 101,
        duration: 0.8,
        ease: 'power3.inOut',
        stagger: 0.08,
        delay: 0.1,
      })
      gsap.fromTo(
        lines,
        { yPercent: 110, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08, delay: 0.12 },
      )
    }, el)
    return () => ctx.revert()
  }, [])
  return ref
}
