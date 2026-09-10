import { useEffect, useMemo, useRef, useState } from 'react'
import { Columns3, Table2, Download, FileSpreadsheet, FileText, Inbox, Trash2, Webhook, Bot, Bell } from 'lucide-react'
import { useCRM } from '../store/useCRM'
import Kanban from '../components/leads/Kanban'
import LeadsTable from '../components/leads/LeadsTable'
import { applyDateFilter } from '../utils/dateRange'
import { exportCSV, exportExcel, exportPDF } from '../utils/export'
import { EmptyState } from '../components/ui'

export default function LeadsPage() {
  const leads = useCRM((s) => s.leads)
  const loading = useCRM((s) => s.loading)
  const dateFilter = useCRM((s) => s.dateFilter)
  const scoreFilter = useCRM((s) => s.scoreFilter)
  const serviceFilter = useCRM((s) => s.serviceFilter)
  const search = useCRM((s) => s.search)
  const setScoreFilter = useCRM((s) => s.setScoreFilter)
  const setServiceFilter = useCRM((s) => s.setServiceFilter)
  const clearAll = useCRM((s) => s.clearAll)

  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [confirmClear, setConfirmClear] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return applyDateFilter(leads, dateFilter)
      .filter((l) => scoreFilter === 'All' || l.lead_classification === scoreFilter)
      .filter((l) => serviceFilter === 'All' || l.primary_service === serviceFilter)
      .filter((l) =>
        !q ||
        l.client_info.full_name.toLowerCase().includes(q) ||
        l.client_info.email.toLowerCase().includes(q) ||
        l.client_info.phone_number.includes(q) ||
        l.lead_classification.toLowerCase().includes(q))
  }, [leads, dateFilter, scoreFilter, serviceFilter, search])

  const services = Array.from(new Set(leads.map((l) => l.primary_service))).sort()

  return (
    <div className="fade-up mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Lead <span className="metal-text">Management</span>
          </h1>
          <p className="mt-1 text-sm text-secondary-text">
            {filtered.length} lead{filtered.length === 1 ? '' : 's'} in current view · {dateFilter.label}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* view toggle */}
          <div className="neu-sunken flex rounded-xl p-1">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                view === 'kanban' ? 'neu-sunken text-[var(--accent-1)]' : 'text-secondary-text hover:text-white'
              }`}
            >
              <Columns3 size={16} /> <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                view === 'table' ? 'neu-sunken text-[var(--accent-1)]' : 'text-secondary-text hover:text-white'
              }`}
            >
              <Table2 size={16} /> <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Export dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="neu-raised neu-press flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-silver"
            >
              <Download size={16} /> Export
            </button>
            {exportOpen && (
              <div className="draw-in glass-panel absolute right-0 top-[52px] z-30 w-44 rounded-xl p-1.5">
                <button onClick={() => { exportCSV(filtered); setExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-secondary-text hover:bg-white/5 hover:text-white">
                  <FileText size={15} /> CSV
                </button>
                <button onClick={() => { exportExcel(filtered); setExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-secondary-text hover:bg-white/5 hover:text-white">
                  <FileSpreadsheet size={15} /> Excel
                </button>
                <button onClick={() => { exportPDF(filtered); setExportOpen(false); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-secondary-text hover:bg-white/5 hover:text-white">
                  <FileText size={15} /> PDF
                </button>
              </div>
            )}
          </div>

          {confirmClear ? (
            <div className="flex items-center gap-2">
              <button onClick={clearAll} className="flex h-11 items-center gap-1 rounded-xl bg-[#ff5c70] px-3 text-sm font-bold text-white">
                Confirm
              </button>
              <button onClick={() => setConfirmClear(false)} className="h-11 rounded-xl border border-edge px-3 text-sm text-secondary-text">
                No
              </button>
            </div>
          ) : (
            leads.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="neu-raised neu-press flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-secondary-text hover:text-[#ff5c70]"
              >
                <Trash2 size={16} />
              </button>
            )
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="neu-sunken flex rounded-lg p-0.5">
          {(['All', 'Hot', 'Warm', 'Cold'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScoreFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                scoreFilter === s ? 'neu-sunken text-[var(--accent-1)]' : 'text-secondary-text hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="input h-10 rounded-lg px-3 text-xs"
        >
          <option value="All">All Services</option>
          {services.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-20" />)}
          </div>
        ) : filtered.length === 0 ? (
          leads.length === 0 ? (
            <Onboarding />
          ) : (
            <div className="card">
              <EmptyState
                icon={<Inbox size={28} />}
                title="No leads match your filters"
                message="Try adjusting your search, score, service, or date filters."
              />
            </div>
          )
        ) : view === 'kanban' ? (
          <Kanban leads={filtered} />
        ) : (
          <div className="card overflow-hidden">
            <LeadsTable leads={filtered} />
          </div>
        )}
      </div>
    </div>
  )
}

function Onboarding() {
  return (
    <div className="card card--glow overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-2">
        {/* left — copy */}
        <div className="p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary-text">
            <Bot size={13} /> AI Voice Agent
          </span>
          <h2 className="mt-4 text-2xl font-extrabold leading-tight sm:text-3xl">
            Your pipeline, <span className="metal-text">live</span>.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-secondary-text">
            Leads land here in real time as <span className="text-silver">Alex</span> takes calls and
            Our AI voice agent delivers the structured-output webhook. Drag cards across the pipeline, open a profile,
            and export the board — all from one screen.
          </p>

          <div className="mt-6 space-y-3">
            {[
              { icon: <Webhook size={17} />, title: 'Connect the webhook', desc: 'Point your voice platform\u2019s webhook URL to POST /api/webhook.' },
              { icon: <Bot size={17} />, title: 'Alex qualifies each caller', desc: 'Structured output extracts name, score, service, payment intent.' },
              { icon: <Bell size={17} />, title: 'Act on notifications', desc: 'Escalations, unpaid links, and high-intent calls surface in real time.' },
            ].map((s, i) => (
              <div key={s.title} className="fade-up flex items-start gap-3 rounded-xl border border-edge2 bg-surface2 p-3" style={{ animationDelay: `${i * 90}ms` }}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg metal-btn text-[#0F1115]">{s.icon}</div>
                <div>
                  <div className="text-sm font-bold text-silver">{s.title}</div>
                  <div className="text-xs leading-relaxed text-secondary-text">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* right — decorative pipeline preview */}
        <div className="relative hidden items-center justify-center overflow-hidden border-l border-edge2 bg-[#0c0e12]/40 p-8 lg:flex">
          <div className="facet-overlay" aria-hidden />
          <div className="relative grid w-full max-w-sm grid-cols-2 gap-3">
            {['New Lead', 'AI Contacted', 'Qualified', 'Payment Pending', 'Appointment', 'Funded'].map((stage, i) => (
              <div
                key={stage}
                className="fade-up rounded-xl border border-edge bg-surface2 p-4"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="text-[10px] uppercase tracking-wider text-secondary-text">Stage {i + 1}</div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-silver">
                  <span className="h-1.5 w-1.5 rounded-full metal-btn" /> {stage}
                </div>
              </div>
            ))}
            <div className="col-span-2 rounded-xl border border-dashed border-edge p-4 text-center text-xs text-secondary-text">
              Cards appear here the moment a call completes.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
