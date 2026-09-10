import { motion } from 'framer-motion'
import { BellOff } from 'lucide-react'
import { useCRM } from '../store/useCRM'
import { AlertKindBadge } from '../components/notifications/NotificationPanel'
import { EmptyState } from '../components/ui'
import { timeAgo } from '../utils/format'

export default function Notifications() {
  const alerts = useCRM((s) => s.alerts)
  const openLead = useCRM((s) => s.openLead)
  const markAlertRead = useCRM((s) => s.markAlertRead)
  const unread = alerts.filter((a) => !a.read).length

  return (
    <div className="fade-up mx-auto max-w-[900px] p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Notification <span className="metal-text">Center</span>
          </h1>
          <p className="mt-1 text-sm text-secondary-text">Real-time alerts from the voice agent pipeline.</p>
        </div>
        {unread > 0 && (
          <span className="rounded-full metal-btn px-3 py-1 text-sm font-bold text-[#0F1115]">{unread} unread</span>
        )}
      </div>

      <div className="mt-5 card card--glow overflow-hidden">
        {alerts.length === 0 ? (
          <EmptyState
            icon={<BellOff size={28} />}
            title="You're all caught up"
            message="Notifications for urgent escalations, unpaid links, high-intent calls, and Direct Tony consultations will appear here in real time as the voice platform delivers webhooks."
          />
        ) : (
          <div>
            {alerts.map((a, i) => (
              <motion.button
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.2, 0, 0, 1] }}
                onClick={() => { markAlertRead(a.id); openLead(a.lead_id); }}
                className={`flex w-full items-start gap-4 border-b border-edge2/50 px-5 py-4 text-left transition hover:bg-white/[0.03] ${a.read ? 'opacity-55' : ''}`}
              >
                <AlertKindBadge kind={a.kind} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{a.lead_name}</span>
                    <span className="text-xs text-secondary-text">· {a.lead_id}</span>
                  </div>
                  <p className="mt-1 text-sm text-secondary-text">{a.message}</p>
                  <div className="mt-1 text-[11px] text-secondary-text/60">{timeAgo(a.created_at)}</div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
