import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * GSAP clip-cover title reveal — "award-winning" text entrance.
 * Fail-safe: words render visible by default; covers are pushed
 * offscreen via inline transform, so text is never hidden even
 * if GSAP is blocked or reduced-motion is active.
 */
export default function AnimatedTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const words = el.querySelectorAll<HTMLElement>('[data-w]')
    const covers = el.querySelectorAll<HTMLElement>('[data-cov]')
    const ctx = gsap.context(() => {
      gsap.set(covers, { yPercent: 0 })
      gsap.to(covers, {
        yPercent: 101,
        duration: 0.85,
        ease: 'power3.inOut',
        stagger: 0.08,
        delay: 0.1,
      })
      gsap.fromTo(
        words,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.08, delay: 0.12 },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <h1 ref={ref} className={className}>
      {String(children)
        .split(' ')
        .filter(Boolean)
        .map((word, i) => (
          <span
            key={i}
            data-w
            className="relative inline-block overflow-hidden align-baseline"
          >
            {/* metallic cover bar — initially pushed offscreen (fail-safe) */}
            <span
              data-cov
              aria-hidden="true"
              className="absolute inset-0 -z-10 block bg-gradient-to-b from-[#b8c2cc] to-[#4a525d]"
              style={{ transform: 'translateY(101%)' }}
            />
            <span className="inline-block pr-[0.25em] last:pr-0">{word}</span>
          </span>
        ))}
    </h1>
  )
}
