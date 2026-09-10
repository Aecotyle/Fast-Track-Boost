import { motion, type Variants } from 'framer-motion'
import { ReactNode } from 'react'

/** Shared, reusable animation variants (keeps motion consistent app-wide). */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.2, 0, 0, 1], delay: i * 0.06 },
  }),
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
}

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } },
}

export const EASE = [0.2, 0, 0, 1] as const

/** Wraps a child with a stagger-aware entrance (for grids/lists). */
export function Stagger({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      animate="show"
      custom={delay}
    >
      {children}
    </motion.div>
  )
}

/** Individual item that animates in with its parent's stagger. */
export function Item({
  children,
  className,
  i = 0,
}: {
  children: ReactNode
  className?: string
  i?: number
}) {
  return (
    <motion.div className={className} variants={fadeUp} custom={i}>
      {children}
    </motion.div>
  )
}

/** Page-level entrance wrapper with subtle y + fade. */
export function PageMotion({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
