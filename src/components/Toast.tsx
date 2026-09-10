import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { useCRM } from '../store/useCRM'

/** Global toast feedback — satisfies Nielsen #1 (visibility) & #9 (error recovery). */
export default function ToastContainer() {
  const toasts = useCRM((s) => s.toasts)
  const dismissToast = useCRM((s) => s.dismissToast)

  const meta = {
    success: { icon: <CheckCircle2 size={18} />, cls: 'text-[#3ddc84]' },
    error: { icon: <AlertTriangle size={18} />, cls: 'text-[#ff5c70]' },
    info: { icon: <Info size={18} />, cls: 'text-[var(--accent)]' },
  } as const

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass-panel pointer-events-auto flex items-start gap-3 rounded-xl p-3.5"
            role="status"
          >
            <span className={`mt-0.5 shrink-0 ${meta[t.kind].cls}`}>{meta[t.kind].icon}</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">{t.title}</div>
              {t.message && (
                <div className="mt-0.5 text-xs leading-relaxed text-secondary-text">{t.message}</div>
              )}
              {t.action && (
                <button
                  onClick={() => {
                    t.action!.run()
                    dismissToast(t.id)
                  }}
                  className="mt-2 rounded-lg bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--btn-text)]"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 rounded-md p-1 text-secondary-text hover:text-white"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
