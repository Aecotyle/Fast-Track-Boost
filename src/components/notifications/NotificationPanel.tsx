import { useEffect, useRef } from 'react'
import { AlertTriangle, Clock, Flame, Crown, CheckCircle2, X, ChevronRight } from 'lucide-react'
import { useCRM } from '../../store/useCRM'
import { timeAgo } from '../../utils/format'
import { AlertItem } from '../../types'

const KIND_META = {
  urgent_escalation: { label: 'Urgent Escalation', icon: AlertTriangle, cls: 'text-[#ff5c70] border-[#5a1c24] bg-[#3a0f14]' },
  unpaid_24h: { label: 'Unpaid Link >24h', icon: Clock, cls: 'text-[#ffb84d] border-[#5a4414] bg-[#3a2a0a]' },
  high_intent: { label: 'High-Intent Call', icon: Flame, cls: 'text-[#ffb84d] border-[#5a4414] bg-[#3a2a0a]' },
  direct_tony: { label: 'Direct Tony ($250)', icon: Crown, cls: 'text-silver border-edge bg-surface2' },
  payment_received: { label: 'Payment Received', icon: CheckCircle2, cls: 'text-[#3ddc84] border-[#14472c] bg-[#0c2e1c]' },
} as const

export function AlertKindBadge({ kind }: { kind: AlertItem['kind'] }) {
  const m = KIND_META[kind] ?? KIND_META.high_intent
  const Icon = m.icon
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${m.cls}`}>
      <Icon size={11} /> {m.label}
    </span>
  )
}

export default function NotificationPanel({ open, onClose, onNavigate }: {
  open: boolean
  onClose: () => void
  onNavigate: (view: string, leadId: string) => void
}) {
  const alerts = useCRM((s) => s.alerts)
  const markAlertRead = useCRM((s) => s.markAlertRead)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Ignore clicks on the bell trigger itself — it toggles the panel.
      if (target.closest('[data-notif-trigger]')) return
      if (ref.current && !ref.current.contains(target)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const unread = alerts.filter((a) => !a.read).length

  return (
    <div
      ref={ref}
      data-testid="notification-panel"
      className={`glass-panel fixed right-3 top-16 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl transition-all duration-200 ${
        open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
      }`}
    >
      <div className="flex items-center justify-between border-b border-edge2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Notifications</span>
          {unread > 0 && <span className="rounded-full metal-btn px-2 py-0.5 text-[11px] font-extrabold text-[#0F1115]">{unread} new</span>}
        </div>
        <button onClick={onClose} aria-label="Close notifications" className="rounded-lg p-1.5 text-secondary-text hover:text-white"><X size={16} /></button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-secondary-text">No notifications yet.</div>
        ) : (
          alerts.map((a) => (
            <button
              key={a.id}
              onClick={() => { markAlertRead(a.id); onNavigate('lead', a.lead_id); onClose(); }}
              className={`flex w-full items-start gap-3 border-b border-edge2/50 px-4 py-3.5 text-left transition hover:bg-white/[0.03] ${a.read ? 'opacity-55' : ''}`}
            >
              <AlertKindBadge kind={a.kind} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{a.lead_name}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-secondary-text">{a.message}</div>
                <div className="mt-1 text-[10px] text-secondary-text/60">{timeAgo(a.created_at)}</div>
              </div>
              <ChevronRight size={15} className="mt-2 shrink-0 text-secondary-text" />
            </button>
          ))
        )}
      </div>
      <button
        onClick={() => { onClose(); onNavigate('notifications', ''); }}
        className="block w-full border-t border-edge2 px-4 py-2.5 text-center text-xs font-semibold text-secondary-text hover:text-white"
      >
        View all notifications
      </button>
    </div>
  )
}
