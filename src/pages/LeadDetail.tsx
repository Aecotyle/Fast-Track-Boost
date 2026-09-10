import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Phone, Mail, Flag, ShieldCheck, CreditCard, MessageSquare,
  Activity, CalendarCheck, Zap, CheckCircle2, Clock, Link as LinkIcon,
} from 'lucide-react'
import { useCRM } from '../store/useCRM'
import { ScoreBadge, PaymentBadge, Tag, Skeleton } from '../components/ui'
import CallPlayer from '../components/lead/CallPlayer'
import { fmtMoney, fmtNum, fmtDateTime, timeAgo } from '../utils/format'
import { ActivityEvent } from '../types'

export default function LeadDetail({ leadId }: { leadId: string }) {
  const lead = useCRM((s) => s.leads.find((l) => l.id === leadId))
  const activity = useCRM((s) => s.activity[leadId] || [])
  const closeLead = useCRM((s) => s.closeLead)
  const toggleEscalation = useCRM((s) => s.toggleEscalation)
  const moveStage = useCRM((s) => s.moveStage)
  const [tab, setTab] = useState<'overview' | 'qualify' | 'payment' | 'activity'>('overview')

  useEffect(() => { setTab('overview') }, [leadId])

  if (!lead) {
    return (
      <div className="mx-auto max-w-[1100px] p-6">
        <div className="card p-6">
          <button onClick={closeLead} className="flex items-center gap-2 text-sm text-secondary-text hover:text-white">
            <ArrowLeft size={16} /> Back
          </button>
          <Skeleton className="mt-6 h-24" />
          <Skeleton className="mt-4 h-40" />
        </div>
      </div>
    )
  }

  const escalation =
    lead.consultation_type === 'Tony_Owner_$250' || lead.escalated ||
    (lead.lead_classification === 'Hot' && lead.payment_status === 'Pending')

  const stageIndex = ['New Lead', 'AI Contacted', 'Qualified', 'Payment Pending', 'Appointment Scheduled', 'Funded / Completed'].indexOf(lead.pipeline_stage)

  return (
    <div className="fade-up mx-auto max-w-[1100px] p-4 sm:p-6">
      {/* header */}
      <div className="card card--glow overflow-hidden">
        <div className="border-b border-edge2 bg-surface2/40 px-5 py-3">
          <button onClick={closeLead} className="flex items-center gap-2 text-sm text-secondary-text hover:text-white">
            <ArrowLeft size={16} /> Back to leads
          </button>
        </div>
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="metal-btn flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-extrabold text-[#0F1115]">
              {lead.client_info.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold sm:text-2xl">{lead.client_info.full_name}</h1>
                <ScoreBadge score={lead.lead_classification} />
                {escalation && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#3a0f14] px-2 py-0.5 text-[11px] font-bold text-[#ff5c70] border border-[#5a1c24]">
                    <Flag size={11} /> Escalated
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-secondary-text">
                <span className="flex items-center gap-1.5"><Phone size={13} /> {lead.client_info.phone_number}</span>
                {lead.client_info.email && <span className="flex items-center gap-1.5"><Mail size={13} /> {lead.client_info.email}</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Tag>{lead.client_info.customer_status} customer</Tag>
                <Tag>{lead.primary_service}</Tag>
                {lead.tags.map((t) => <Tag key={t}>{t}</Tag>)}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <button
              onClick={() => toggleEscalation(lead.id, `Manual escalation for ${lead.client_info.full_name}.`)}
              className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
                lead.escalated ? 'border border-[#ff5c70]/50 text-[#ff5c70] hover:bg-[#3a0f14]' : 'gold-btn'
              }`}
            >
              <Flag size={15} />
              {lead.escalated ? 'Un-flag escalation' : 'Escalate to team'}
            </button>
            <div className="text-right text-xs text-secondary-text">Lead ID · {lead.id}</div>
          </div>
        </div>

        {/* stage stepper */}
        <div className="border-t border-edge2 px-5 py-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-secondary-text">Pipeline</div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {['New Lead', 'AI Contacted', 'Qualified', 'Payment Pending', 'Appointment Scheduled', 'Funded / Completed'].map((stage, i) => (
              <button
                key={stage}
                onClick={() => moveStage(lead.id, stage as never)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  i <= stageIndex
                    ? 'metal-btn text-[#0F1115]'
                    : 'neu-raised neu-press text-secondary-text hover:text-white'
                }`}
              >
                {i < stageIndex && <CheckCircle2 size={13} />}
                {stage}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-4 flex gap-1 overflow-x-auto rounded-xl border border-edge bg-surface2 p-1">
        {([
          ['overview', 'Overview', ShieldCheck],
          ['qualify', 'Qualification', CreditCard],
          ['payment', 'Payment', Clock],
          ['activity', 'Activity & SMS', MessageSquare],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${
              tab === id ? 'neu-sunken text-white' : 'neu-raised neu-press text-secondary-text hover:text-white'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <motion.div
        className="mt-4"
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      >
        {tab === 'overview' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-silver"><Zap size={15} /> AI Call Summary</div>
              <CallPlayer duration={lead.duration_seconds} url={lead.call_recording_url} />
              <p className="mt-4 text-sm leading-relaxed text-secondary-text">{lead.call_summary}</p>
            </div>
            <div className="card p-5">
              <div className="text-sm font-bold text-silver">Customer Background</div>
              <p className="mt-2 text-sm leading-relaxed text-secondary-text">{lead.customer_background}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="neu-raised rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-wider text-secondary-text">Credit Score</div>
                  <div className="mt-1 text-lg font-extrabold text-silver">{fmtNum(lead.credit_score)}</div>
                </div>
                <div className="neu-raised rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-wider text-secondary-text">Appointment</div>
                  <div className="mt-1 text-lg font-extrabold text-silver">{lead.appointment_scheduled ? 'Scheduled' : 'Not set'}</div>
                </div>
                <div className="neu-raised rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-wider text-secondary-text">Consultation</div>
                  <div className="mt-1 text-sm font-bold text-silver">{lead.consultation_type.replace('_', ' ')}</div>
                </div>
                <div className="neu-raised rounded-xl p-3">
                  <div className="text-[11px] uppercase tracking-wider text-secondary-text">Called</div>
                  <div className="mt-1 text-sm font-bold text-silver">{timeAgo(lead.created_at)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'qualify' && (
          <div className="card p-5">
            <div className="text-sm font-bold text-silver">Qualification Metrics</div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                <Metric key="cs" label="Credit Score" value={fmtNum(lead.credit_score)} />,
                <Metric key="rf" label="Requested Funding" value={fmtMoney(lead.requested_funding)} />,
                <Metric key="br" label="Business Revenue" value={fmtMoney(lead.business_revenue)} />,
                <Metric key="ein" label="Active EIN" value={lead.active_ein ? 'Yes' : 'No'} />,
                <Metric key="tg" label="Tradeline Goal" value={lead.tradeline_goal || '—'} />,
                <Metric key="ps" label="Primary Service" value={lead.primary_service} />,
              ].map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.05, ease: [0.2, 0, 0, 1] }}
                >
                  {m}
                </motion.div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-edge bg-surface2 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-secondary-text">Funding / Credit Goals</div>
              <p className="mt-2 text-sm text-secondary-text">{lead.customer_background}</p>
            </div>
          </div>
        )}

        {tab === 'payment' && (
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-silver">Payment Timeline</div>
              <PaymentBadge status={lead.payment_status} />
            </div>
            <div className="mt-4 space-y-3">
              {lead.consultation_type === 'None' ? (
                <TimelineEmpty />
              ) : (
                <>
                  <TimelineRow
                    icon={<CreditCard size={16} />}
                    title={`Consultation · ${lead.consultation_type.replace('_', ' ')}`}
                    detail={`$${lead.consultation_type === 'Tony_Owner_$250' ? '250' : '100'} checkout`}
                    time={lead.payment_link_sent_at ? fmtDateTime(lead.payment_link_sent_at) : '—'}
                  />
                  {lead.payment_link_sent && (
                    <TimelineRow
                      icon={<LinkIcon size={16} />}
                      title="Payment link sent"
                      detail="Checkout link sent to the customer"
                      time={lead.payment_link_sent_at ? timeAgo(lead.payment_link_sent_at) : '—'}
                    />
                  )}
                  {lead.payment_status === 'Paid' && (
                    <TimelineRow
                      icon={<CheckCircle2 size={16} className="text-[#3ddc84]" />}
                      title="Payment received"
                      detail="Payment confirmed"
                      time={timeAgo(lead.created_at)}
                    />
                  )}
                  {lead.appointment_scheduled && (
                    <TimelineRow
                      icon={<CalendarCheck size={16} className="text-[#3ddc84]" />}
                      title="Appointment scheduled"
                      detail="Consultation window booked"
                      time={timeAgo(lead.created_at)}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'activity' && (
          <div className="card p-5">
            <div className="text-sm font-bold text-silver">Activity & Follow-up Logs</div>
            <div className="mt-4 space-y-3">
              {activity.length === 0 ? (
                <TimelineEmpty />
              ) : (
                activity.map((a: ActivityEvent, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05, ease: [0.2, 0, 0, 1] }}
                  >
                    <ActivityRow a={a} />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="neu-raised rounded-xl p-3">
      <div className="text-[11px] uppercase tracking-wider text-secondary-text">{label}</div>
      <div className="mt-1 text-sm font-bold text-silver">{value}</div>
    </div>
  )
}

function TimelineRow({ icon, title, detail, time }: { icon: React.ReactNode; title: string; detail: string; time: string }) {
  return (
    <div className="neu-raised flex items-center gap-3 rounded-xl p-3">
      <div className="neu-raised flex h-9 w-9 items-center justify-center rounded-lg text-silver">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="truncate text-xs text-secondary-text">{detail}</div>
      </div>
      <div className="text-xs text-secondary-text">{time}</div>
    </div>
  )
}

function ActivityRow({ a }: { a: ActivityEvent }) {
  const iconMap: Record<ActivityEvent['type'], React.ReactNode> = {
    call: <Phone size={15} />, sms: <MessageSquare size={15} />,
    payment: <CreditCard size={15} />,
    status: <Activity size={15} />, note: <Activity size={15} />,
    appointment: <CalendarCheck size={15} />,
  }
  return (
    <div className="neu-raised flex items-start gap-3 rounded-xl p-3">
      <div className="neu-raised mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-silver">{iconMap[a.type]}</div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">{a.title}</div>
        <div className="text-xs text-secondary-text">{a.detail}</div>
        {a.meta && <div className="mt-0.5 text-[11px] text-secondary-text/70">{a.meta}</div>}
      </div>
      <div className="shrink-0 text-xs text-secondary-text">{timeAgo(a.timestamp)}</div>
    </div>
  )
}

function TimelineEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-edge2 p-6 text-center text-sm text-secondary-text">
      No payment records yet for this lead.
    </div>
  )
}
