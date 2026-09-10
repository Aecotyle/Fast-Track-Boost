import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function FacetOverlay() {
  const a = useRef<HTMLDivElement>(null)
  const b = useRef<HTMLDivElement>(null)
  const c = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (a.current) {
        gsap.to(a.current, {
          x: 60, y: -40, scale: 1.18,
          duration: 16, ease: 'sine.inOut', yoyo: true, repeat: -1,
        })
      }
      if (b.current) {
        gsap.to(b.current, {
          x: -50, y: 40, scale: 0.9,
          duration: 20, ease: 'sine.inOut', yoyo: true, repeat: -1,
        })
      }
      if (c.current) {
        gsap.to(c.current, {
          x: 30, y: 50, scale: 1.1,
          duration: 22, ease: 'sine.inOut', yoyo: true, repeat: -1,
        })
      }
    })
    return () => ctx.revert()
  }, [])

  return (
    <>
      <div className="metallic-black" aria-hidden="true" />
      <div className="metallic-sheen" aria-hidden="true" />
      <div className="aurora" aria-hidden="true" />
      <div className="aurora--layer2" aria-hidden="true" />
      <div className="facet-overlay" aria-hidden="true" />
      <div ref={a} className="glow-orb glow-orb--a" aria-hidden="true" />
      <div ref={b} className="glow-orb glow-orb--b" aria-hidden="true" />
      <div ref={c} className="glow-orb glow-orb--c" aria-hidden="true" />
    </>
  )
}
