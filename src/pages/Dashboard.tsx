import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Phone, CheckCircle2, CreditCard, DollarSign, TrendingUp,
  ArrowRight, Inbox, Radio, PhoneCall, Sparkles, AlertTriangle,
} from 'lucide-react'
import { useCRM } from '../store/useCRM'
import { StatCard, ScoreBadge, EmptyState, Skeleton } from '../components/ui'
import { RevenueTrendChart, ScoreDonut } from '../components/dashboard/Charts'
import { applyDateFilter, resolveBounds } from '../utils/dateRange'
import { timeAgo } from '../utils/format'
import { Lead } from '../types'
import { useCountUp } from '../hooks/useCountUp'
import { fadeUp, EASE } from '../components/motion'
import AnimatedTitle from '../components/AnimatedTitle'

function CountNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const n = useCountUp(value)
  return (
    <span>
      {prefix}
      {Math.round(n).toLocaleString()}
      {suffix}
    </span>
  )
}

export default function Dashboard() {
  const leads = useCRM((s) => s.leads)
  const loading = useCRM((s) => s.loading)
  const dateFilter = useCRM((s) => s.dateFilter)
  const scoreFilter = useCRM((s) => s.scoreFilter)
  const serviceFilter = useCRM((s) => s.serviceFilter)
  const openLead = useCRM((s) => s.openLead)
  const navigate = useCRM((s) => s.navigate)
  const vapiStatus = useCRM((s) => s.vapiStatus)

  const filtered = useMemo(() => applyDateFilter(leads, dateFilter), [leads, dateFilter])

  const revenue = filtered
    .filter((l) => l.payment_status === 'Paid')
    .reduce((s, l) => s + (l.consultation_type === 'Tony_Owner_$250' ? 250 : l.consultation_type === 'Standard_$100' ? 100 : 0), 0)
  const qualified = filtered.filter((l) =>
    ['Qualified', 'Payment Pending', 'Appointment Scheduled', 'Funded / Completed'].includes(l.pipeline_stage)).length
  const pending = filtered.filter((l) => l.payment_status === 'Pending').length
  const conversion = filtered.length ? Math.round((qualified / filtered.length) * 100) : 0

  const recent = useMemo(
    () => [...filtered]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .filter((l) =>
        (scoreFilter === 'All' || l.lead_classification === scoreFilter) &&
        (serviceFilter === 'All' || l.primary_service === serviceFilter)),
    [filtered, scoreFilter, serviceFilter],
  )

  const services = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach((l) => { counts[l.primary_service] = (counts[l.primary_service] || 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [filtered])

  const maxCount = Math.max(1, ...services.map(([, c]) => c))

  const funnel = [
    { label: 'Qualified', value: qualified },
    { label: 'Payment Pending', value: pending },
    { label: 'Appointments', value: filtered.filter((l) => l.appointment_scheduled).length },
    { label: 'Funded / Done', value: filtered.filter((l) => l.pipeline_stage === 'Funded / Completed').length },
  ]
  const maxFunnel = Math.max(1, funnel[0].value)

  const { from, to } = resolveBounds(dateFilter)
  const daySpan = Math.max(1, Math.ceil((to - from) / (86_400_000)))
  const trendDays = dateFilter.key === '7d' ? 7 : dateFilter.key === '30d' ? 30 : dateFilter.key === 'month' ? new Date().getDate() : Math.min(daySpan, 14)

  return (
    <div className="fade-up mx-auto max-w-[1400px] p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#14472c] bg-[#0c2e1c] px-2.5 py-1 text-[11px] font-bold text-[#3ddc84]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#3ddc84]" />
              Live
            </span>
            {/* Vapi connection diagnostic */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                vapiStatus.error
                  ? 'border-[#5a1c24] bg-[#3a0f14] text-[#ff5c70]'
                  : vapiStatus.configured
                    ? 'border-[#14472c] bg-[#0c2e1c] text-[#3ddc84]'
                    : 'border-edge bg-surface2 text-secondary-text'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  vapiStatus.error ? 'bg-[#ff5c70]' : vapiStatus.configured ? 'bg-[#3ddc84]' : 'bg-secondary-text'
                }`}
              />
              {vapiStatus.error
                ? 'Sync error'
                : vapiStatus.configured
                  ? `Voice connected · ${vapiStatus.callsFetched} call${vapiStatus.callsFetched === 1 ? '' : 's'}`
                  : 'No key set'}
            </span>
          </div>
          <AnimatedTitle className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            FASTTRACK-VA-DASHBOARD
          </AnimatedTitle>
          <p className="mt-1.5 text-sm text-secondary-text">
            Live inbound call performance for FAST TRACK BOOST · {dateFilter.label}
          </p>
        </div>
        <button
          onClick={() => navigate('leads')}
          className="gold-btn flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold"
        >
          <Sparkles size={16} /> Open pipeline
        </button>
      </div>

      {/* Live connection / error banner — makes any failure visible on screen */}
      {vapiStatus.error ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#5a1c24] bg-[#3a0f14] px-4 py-3 text-sm">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#ff5c70]" />
          <div>
            <div className="font-bold text-[#ff5c70]">Sync failed</div>
            <div className="mt-0.5 break-words text-[#ffb4bc]">{vapiStatus.error}</div>
            <button onClick={() => useCRM.getState().refreshLeads()} className="mt-2 rounded-lg bg-[#ff5c70] px-3 py-1 text-xs font-bold text-white">
              Retry
            </button>
          </div>
        </div>
      ) : vapiStatus.lastSync ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#14472c] bg-[#0c2e1c] px-4 py-2.5 text-sm">
          <span className="h-2 w-2 rounded-full bg-[#3ddc84]" />
          <span className="font-semibold text-[#3ddc84]">Voice connected</span>
          <span className="text-[#9be6c0]">
            · {vapiStatus.callsFetched} call{vapiStatus.callsFetched === 1 ? '' : 's'} loaded
          </span>
        </div>
      ) : null}

      {/* KPI cards */}
      {loading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: <Phone size={17} />, label: 'Total Calls', accent: 'default' as const, v: <CountNumber value={filtered.length} />, d: 12 },
            { icon: <CheckCircle2 size={17} />, label: 'Qualified', accent: 'green' as const, v: <CountNumber value={qualified} />, d: 8 },
            { icon: <CreditCard size={17} />, label: 'Pending Payments', accent: 'amber' as const, v: <CountNumber value={pending} />, d: -4 },
            { icon: <DollarSign size={17} />, label: 'Revenue', accent: 'green' as const, v: <CountNumber value={revenue} prefix="$" />, d: 23 },
            { icon: <TrendingUp size={17} />, label: 'Conversion', accent: 'blue' as const, v: <CountNumber value={conversion} suffix="%" />, d: 5 },
          ].map((k, i) => (
            <motion.div key={k.label} variants={fadeUp} custom={i} initial="hidden" animate="show">
              <StatCard icon={k.icon} label={k.label} accent={k.accent} value={k.v} delta={k.d} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <motion.div
        className="mt-4 grid gap-4 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.09, delayChildren: 0.15 }}
      >
        <motion.div variants={fadeUp} className="card card--glow lift-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-silver">Revenue &amp; Call Volume</h2>
              <p className="text-xs text-secondary-text">Daily trend over {trendDays} days</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-secondary-text">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#5aa8ff]" /> Calls</span>
            </div>
          </div>
          <div className="mt-4">
            <RevenueTrendChart leads={filtered} days={trendDays} />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="card card--glow lift-card p-5">
          <h2 className="text-sm font-bold text-silver">Lead Classification</h2>
          <p className="text-xs text-secondary-text">Hot / Warm / Cold mix</p>
          <div className="mt-2">
            <ScoreDonut leads={filtered} />
          </div>
        </motion.div>
      </motion.div>

      {/* Activity + funnel row */}
      <motion.div
        className="mt-4 grid gap-4 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
      >
        <motion.div variants={fadeUp} className="card card--glow lift-card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-edge2 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-silver">Recent Voice Agent Activity</h2>
              <p className="text-xs text-secondary-text">Inbound calls &amp; classifications</p>
            </div>
            <button
              onClick={() => navigate('leads')}
              className="group flex items-center gap-1.5 text-xs font-semibold text-secondary-text transition hover:text-white"
            >
              All leads
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<Inbox size={28} />}
              title="No calls in this range"
              message="When Alex takes calls and the voice platform delivers the structured-output webhook, leads appear here instantly."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-edge2 text-[11px] uppercase tracking-wider text-secondary-text">
                    <th className="px-5 py-3 font-semibold">Lead</th>
                    <th className="px-3 py-3 font-semibold">Score</th>
                    <th className="px-3 py-3 font-semibold">Service</th>
                    <th className="px-3 py-3 font-semibold">Consultation</th>
                    <th className="px-5 py-3 text-right font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.slice(0, 6).map((l: Lead) => (
                    <tr
                      key={l.id}
                      onClick={() => openLead(l.id)}
                      className="cursor-pointer border-b border-edge2/50 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-surface2 text-xs font-bold text-silver">
                            {l.client_info.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{l.client_info.full_name}</div>
                            <div className="text-xs text-secondary-text">{l.client_info.phone_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5"><ScoreBadge score={l.lead_classification} /></td>
                      <td className="px-3 py-3.5 text-secondary-text">{l.primary_service}</td>
                      <td className="px-3 py-3.5 text-secondary-text">{l.consultation_type.replace('_', ' ')}</td>
                      <td className="px-5 py-3.5 text-right text-xs text-secondary-text">{timeAgo(l.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Right column: funnel + services */}
        <motion.div variants={fadeUp} className="flex flex-col gap-4">
          <div className="card card--glow lift-card p-5">
            <h2 className="text-sm font-bold text-silver">Pipeline Funnel</h2>
            <div className="mt-4 space-y-3">
              {funnel.map((f, i) => {
                const pct = (f.value / maxFunnel) * 100
                return (
                  <div key={f.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-secondary-text">{f.label}</span>
                      <span className="data-mono font-semibold text-silver">{f.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/40">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-3)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, delay: 0.25 + i * 0.08, ease: EASE }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card card--glow lift-card p-5">
            <h2 className="text-sm font-bold text-silver">Services</h2>
            <div className="mt-3 space-y-2.5">
              {services.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate text-secondary-text">{name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/40">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-3)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxCount) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.07, ease: EASE }}
                    />
                  </div>
                  <span className="w-6 text-right font-bold">{count}</span>
                </div>
              ))}
              {services.length === 0 && <p className="text-xs text-secondary-text">No data in this range.</p>}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Live signal strip */}
      <motion.div
        className="mt-4 grid gap-4 sm:grid-cols-3"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.08, delayChildren: 0.3 }}
      >
        {[
          { icon: <Radio size={16} />, c: 'text-[#3ddc84]', t: 'Agent Online', d: 'Alex is taking calls now · Mon–Sat 9AM–7PM CST' },
          { icon: <PhoneCall size={16} />, c: 'text-silver', t: 'Transfer Line', d: 'NO ESCALATION SET ' },
          { icon: <DollarSign size={16} />, c: 'text-silver', t: 'Consultations', d: 'FAST TRACK BOOST' },
        ].map((k) => (
          <motion.div key={k.t} variants={fadeUp} className="card lift-card p-4">
            <div className={`flex items-center gap-2 ${k.c}`}>{k.icon}<span className="text-sm font-bold">{k.t}</span></div>
            <p className="mt-1 text-xs text-secondary-text">{k.d}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
