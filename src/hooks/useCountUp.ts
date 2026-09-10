import { useEffect, useRef, useState } from 'react'

/**
 * Animates a number from 0 to `value` when it changes, with easing.
 * Used for KPI metric cards for that "live / premium" feel.
 */
export function useCountUp(value: number, duration = 900): number {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    const target = value

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      const cur = from + (target - from) * eased
      setDisplay(cur)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return display
}
