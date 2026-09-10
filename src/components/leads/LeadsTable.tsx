import { motion } from 'framer-motion'
import { Lead } from '../../types'
import { ScoreBadge, PaymentBadge, Tag } from '../ui'
import { fmtMoney, timeAgo } from '../../utils/format'
import { useCRM } from '../../store/useCRM'

export default function LeadsTable({ leads }: { leads: Lead[] }) {
  const openLead = useCRM((s) => s.openLead)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-edge2 text-[11px] uppercase tracking-wider text-secondary-text">
            <th className="px-5 py-3 font-semibold">Lead</th>
            <th className="px-3 py-3 font-semibold">Score</th>
            <th className="px-3 py-3 font-semibold">Service</th>
            <th className="px-3 py-3 font-semibold">Consultation</th>
            <th className="px-3 py-3 font-semibold">Requested</th>
            <th className="px-3 py-3 font-semibold">Stage</th>
            <th className="px-3 py-3 font-semibold">Payment</th>
            <th className="px-3 py-3 font-semibold">Tags</th>
            <th className="px-5 py-3 text-right font-semibold">When</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <motion.tr
              key={l.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: [0.2, 0, 0, 1] }}
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
                    <div className="text-xs text-secondary-text">{l.client_info.email || l.client_info.phone_number}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-3.5"><ScoreBadge score={l.lead_classification} /></td>
              <td className="px-3 py-3.5 text-secondary-text">{l.primary_service}</td>
              <td className="px-3 py-3.5 text-secondary-text">{l.consultation_type.replace('_', ' ')}</td>
              <td className="px-3 py-3.5 font-semibold text-silver">{fmtMoney(l.requested_funding)}</td>
              <td className="px-3 py-3.5">
                <span className="rounded-md border border-edge bg-white/5 px-2 py-0.5 text-[11px] font-medium text-secondary-text">
                  {l.pipeline_stage}
                </span>
              </td>
              <td className="px-3 py-3.5"><PaymentBadge status={l.payment_status} /></td>
              <td className="px-3 py-3.5">
                <div className="flex max-w-[140px] flex-wrap gap-1">
                  {l.tags.slice(0, 2).map((t) => <Tag key={t}>{t}</Tag>)}
                </div>
              </td>
              <td className="px-5 py-3.5 text-right text-xs text-secondary-text">{timeAgo(l.created_at)}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
