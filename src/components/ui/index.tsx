import { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { LeadScore, PaymentStatus } from '../../types'

export const scoreBadgeClass: Record<LeadScore, string> = {
  Hot: 'bg-[#3a0f14] text-[#ff5c70] border border-[#5a1c24]',
  Warm: 'bg-[#3a2a0a] text-[#ffb84d] border border-[#5a4414]',
  Cold: 'bg-[#122033] text-[#5aa8ff] border border-[#1f3a5a]',
}

export const paymentBadgeClass: Record<PaymentStatus, string> = {
  Pending: 'bg-[#3a2a0a] text-[#ffb84d] border border-[#5a4414]',
  Paid: 'bg-[#0c2e1c] text-[#3ddc84] border border-[#14472c]',
  Refunded: 'bg-[#122033] text-[#5aa8ff] border border-[#1f3a5a]',
  Cancelled: 'bg-white/5 text-secondary-text border border-edge',
}

export function ScoreBadge({ score }: { score: LeadScore }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${scoreBadgeClass[score]}`}
    >
      {score}
    </span>
  )
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const dot =
    status === 'Paid' ? 'bg-[#3ddc84]'
    : status === 'Pending' ? 'bg-[#ffb84d]'
    : status === 'Refunded' ? 'bg-[#5aa8ff]'
    : 'bg-secondary-text'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${paymentBadgeClass[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-edge bg-white/5 px-2 py-0.5 text-[11px] font-medium text-secondary-text">
      {children}
    </span>
  )
}

export function StatCard({
  icon,
  label,
  value,
  delta,
  deltaLabel,
  loading,
  accent = 'default',
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  delta?: number
  deltaLabel?: string
  loading?: boolean
  accent?: 'default' | 'green' | 'amber' | 'blue'
}) {
  const accentBar =
    accent === 'green' ? 'from-[#3ddc84]/40'
    : accent === 'amber' ? 'from-[#ffb84d]/40'
    : accent === 'blue' ? 'from-[#5aa8ff]/40'
    : 'from-[#b8c2cc]/40'

  return (
    <div className="card card--glow lift-card group relative overflow-hidden p-4 sm:p-5">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accentBar} to-transparent`} />
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[var(--accent)]/[0.07] blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary-text">
          {label}
        </span>
        <div className="neu-raised flex h-9 w-9 items-center justify-center rounded-lg text-silver transition-all duration-300 group-hover:scale-110 group-hover:text-[var(--accent)]">
          {icon}
        </div>
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-24" />
      ) : (
        <div className="data-mono metal-text mt-3 text-[26px] font-bold tracking-tight sm:text-[30px]">
          {value}
        </div>
      )}
      {delta !== undefined && !loading && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {delta >= 0 ? (
            <ArrowUpRight size={14} strokeWidth={2.6} className="text-[#3ddc84]" />
          ) : (
            <ArrowDownRight size={14} strokeWidth={2.6} className="text-[#ff5c70]" />
          )}
          <span className={`data-mono font-semibold ${delta >= 0 ? 'text-[#3ddc84]' : 'text-[#ff5c70]'}`}>
            {Math.abs(delta)}%
          </span>
          <span className="text-secondary-text">{deltaLabel ?? 'vs prev period'}</span>
        </div>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  message,
  icon,
  action,
}: {
  title: string
  message: string
  icon: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-edge bg-surface2 text-secondary-text">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-secondary-text">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-[#3ddc84]' : 'bg-secondary-text'}`} />
      <span className="text-secondary-text">{active ? 'Live' : 'Off'}</span>
    </span>
  )
}
