import { create } from 'zustand'
import { api, AgentSettings } from '../api/client'
import { ActivityEvent, AlertItem, DateRangeFilter, Lead } from '../types'
import { vapi, isVapiConfigured } from '../api/vapiClient'
import { transformVapiCall } from '../api/transform'


export type View = 'dashboard' | 'leads' | 'lead' | 'notifications'

export interface Toast {
  id: number
  kind: 'success' | 'error' | 'info'
  title: string
  message?: string
  action?: { label: string; run: () => void }
}

export type ThemeKey =
  | 'gold' | 'violet' | 'emerald' | 'cyan' | 'ember' | 'ocean' | 'rose'

export const THEMES: { key: ThemeKey; name: string; gradient: [string, string, string] }[] = [
  { key: 'gold', name: 'Champagne', gradient: ['#f2d795', '#e5c06b', '#b8903f'] },
  { key: 'violet', name: 'Violet', gradient: ['#c4b5fd', '#a78bfa', '#7c3aed'] },
  { key: 'emerald', name: 'Emerald', gradient: ['#6ee7b7', '#34d399', '#0d9488'] },
  { key: 'cyan', name: 'Cyan', gradient: ['#67e8f9', '#22d3ee', '#0891b2'] },
  { key: 'ember', name: 'Ember', gradient: ['#fdba74', '#fb923c', '#ea580c'] },
  { key: 'ocean', name: 'Ocean', gradient: ['#93c5fd', '#60a5fa', '#2563eb'] },
  { key: 'rose', name: 'Rose', gradient: ['#fda4af', '#fb7185', '#e11d48'] },
]

const THEME_KEY = 'ncr-theme'

function loadTheme(): ThemeKey {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t && THEMES.some((x) => x.key === t)) return t as ThemeKey
  } catch { /* ignore */ }
  return 'gold'
}

interface CRMState {
  leads: Lead[]
  alerts: AlertItem[]
  loading: boolean
  agent: AgentSettings | null
  activity: Record<string, ActivityEvent[]>

  view: View
  selectedLeadId: string | null

  // theme
  theme: ThemeKey
  setTheme: (t: ThemeKey) => void

  // feedback (visibility of system status)
  toasts: Toast[]
  notify: (t: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void

  // Vapi live-connection diagnostic (visible in the UI)
  vapiStatus: {
    configured: boolean
    callsFetched: number
    lastSync: string | null
    error: string | null
  }
  setVapiStatus: (p: Partial<{ callsFetched: number; lastSync: string; error: string | null }>) => void

  // filters
  dateFilter: DateRangeFilter
  scoreFilter: 'All' | 'Hot' | 'Warm' | 'Cold'
  serviceFilter: 'All' | string
  search: string

  // actions
  load: () => Promise<void>
  refreshLeads: () => Promise<void>
  loadAgent: () => Promise<void>

  navigate: (view: View, leadId?: string) => void
  openLead: (id: string) => Promise<void>
  closeLead: () => void

  setDateFilter: (f: DateRangeFilter) => void
  setScoreFilter: (s: 'All' | 'Hot' | 'Warm' | 'Cold') => void
  setServiceFilter: (s: string) => void
  setSearch: (s: string) => void

  moveStage: (id: string, stage: Lead['pipeline_stage']) => Promise<void>
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>
  toggleEscalation: (id: string, reason: string) => Promise<void>
  clearAll: () => Promise<void>

  markAlertRead: (id: string) => void
}

// Derived alerts from loaded leads (mirrors server buildAlerts).
function deriveAlerts(leads: Lead[]): AlertItem[] {
  const alerts: AlertItem[] = []
  const now = Date.now()
  for (const lead of leads) {
    if (lead.consultation_type === 'Tony_Owner_$250') {
      const paid = lead.payment_status === 'Paid'
      alerts.push({
        id: `tony-${lead.id}`, kind: paid ? 'direct_tony' : 'direct_tony', lead_id: lead.id,
        lead_name: lead.client_info.full_name,
        message: paid
          ? '$250 Tony Owner consultation paid — schedule the session.'
          : 'Direct Tony ($250) consultation requested — payment pending.',
        created_at: lead.created_at, read: false,
      })
    }
    if (lead.escalated) {
      alerts.push({
        id: `esc-${lead.id}`, kind: 'urgent_escalation', lead_id: lead.id,
        lead_name: lead.client_info.full_name,
        message: lead.escalation_reason ?? 'Escalated to management.',
        created_at: lead.created_at, read: false,
      })
    }
    if (lead.payment_status === 'Pending' && lead.payment_link_sent_at) {
      const age = now - new Date(lead.payment_link_sent_at).getTime()
      if (age > 24 * 3_600_000) {
        alerts.push({
          id: `unpaid-${lead.id}`, kind: 'unpaid_24h', lead_id: lead.id,
          lead_name: lead.client_info.full_name,
          message: 'Payment link unpaid for over 24 hours — follow up.',
          created_at: lead.payment_link_sent_at, read: false,
        })
      }
    }
    if (lead.lead_classification === 'Hot') {
      alerts.push({
        id: `hot-${lead.id}`, kind: 'high_intent', lead_id: lead.id,
        lead_name: lead.client_info.full_name,
        message: `High-intent ${lead.primary_service} call captured.`,
        created_at: lead.created_at, read: false,
      })
    }
  }
  return alerts.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
}

export const useCRM = create<CRMState>((set, get) => ({
  leads: [],
  alerts: [],
  loading: true,
  agent: null,
  activity: {},
  view: 'dashboard',
  selectedLeadId: null,
  theme: loadTheme(),
  toasts: [],
  notify: (t) => {
    const id = Date.now() + Math.random()
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }))
    // auto-dismiss
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }))
    }, t.action ? 6000 : 3600)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  setTheme: (t) => {
    try { localStorage.setItem(THEME_KEY, t) } catch { /* ignore */ }
    set({ theme: t })
  },

  vapiStatus: { configured: true, callsFetched: 0, lastSync: null, error: null },
  setVapiStatus: (p) => set((s) => ({ vapiStatus: { ...s.vapiStatus, ...p } })),

  dateFilter: { key: '7d', label: 'Last 7 Days', from: null, to: null },
  scoreFilter: 'All',
  serviceFilter: 'All',
  search: '',

  load: async () => {
    set({ loading: true })
    try {
      // Direct browser → Vapi: fetch only structured-output calls.
      if (isVapiConfigured()) {
        const calls = await vapi.getStructuredCalls()
        const leads = calls.map(transformVapiCall)
        get().setVapiStatus({ callsFetched: leads.length, lastSync: new Date().toISOString(), error: null })
        set({ leads, alerts: deriveAlerts(leads), loading: false })
      } else {
        // No key → local dev store fallback.
        const [leads, agent] = await Promise.all([api.getLeads(), api.getAgent()])
        set({ leads, agent, alerts: deriveAlerts(leads), loading: false })
      }
    } catch (e) {
      set({ loading: false })
      get().setVapiStatus({ error: (e as Error).message, lastSync: new Date().toISOString() })
      get().notify({
        kind: 'error',
        title: "Couldn't load your calls",
        message: (e as Error).message,
      })
    }
  },

  refreshLeads: async () => {
    try {
      if (isVapiConfigured()) {
        const calls = await vapi.getStructuredCalls()
        const leads = calls.map(transformVapiCall)
        get().setVapiStatus({ callsFetched: leads.length, lastSync: new Date().toISOString(), error: null })
        set({ leads, alerts: deriveAlerts(leads) })
      } else {
        const leads = await api.getLeads()
        set({ leads, alerts: deriveAlerts(leads) })
      }
    } catch (e) {
      get().setVapiStatus({ error: (e as Error).message, lastSync: new Date().toISOString() })
      get().notify({ kind: 'error', title: 'Refresh failed', message: (e as Error).message })
    }
  },

  loadAgent: async () => {
    try {
      const agent = await api.getAgent()
      set({ agent })
    } catch (e) {
      get().notify({ kind: 'error', title: "Couldn't load agent settings", message: (e as Error).message })
    }
  },

  navigate: (view, leadId) =>
    set({ view, selectedLeadId: leadId ?? null }),

  openLead: async (id) => {
    set({ view: 'lead', selectedLeadId: id })
    // Build activity client-side from the lead record — no backend needed.
    if (!get().activity[id]) {
      const lead = get().leads.find((l) => l.id === id)
      if (lead) {
        const created = lead.created_at
        const events: ActivityEvent[] = [
          {
            id: `${id}-call`, lead_id: id, type: 'call',
            title: 'Inbound AI call', detail: 'Voice agent handled the inbound call and captured the lead.',
            timestamp: created,
            meta: lead.duration_seconds ? `${Math.floor(lead.duration_seconds / 60)}m ${lead.duration_seconds % 60}s` : undefined,
          },
        ]
        if (lead.consultation_type !== 'None' && lead.payment_link_sent) {
          events.push({
            id: `${id}-link`, lead_id: id, type: 'payment',
            title: `Payment link sent — ${lead.consultation_type.replace('_', ' ')}`,
            detail: 'Consultation checkout link dispatched.',
            timestamp: lead.payment_link_sent_at || created,
            meta: lead.payment_status,
          })
        }
        if (lead.payment_status === 'Paid') {
          events.push({
            id: `${id}-paid`, lead_id: id, type: 'payment',
            title: 'Payment received', detail: 'Payment confirmed.',
            timestamp: created, meta: 'Paid',
          })
        }
        if (lead.escalated) {
          events.push({
            id: `${id}-esc`, lead_id: id, type: 'status',
            title: 'Escalation flagged', detail: lead.escalation_reason || 'Escalated to team.',
            timestamp: created, meta: 'Urgent',
          })
        }
        set((s) => ({ activity: { ...s.activity, [id]: events } }))
      } else {
        set((s) => ({ activity: { ...s.activity, [id]: [] } }))
      }
    }
  },

  closeLead: () => set({ view: 'leads', selectedLeadId: null }),

  setDateFilter: (f) => set({ dateFilter: f }),
  setScoreFilter: (s) => set({ scoreFilter: s }),
  setServiceFilter: (s) => set({ serviceFilter: s }),
  setSearch: (s) => set({ search: s }),

  moveStage: async (id, stage) => {
    // Apply the change locally immediately (works with or without a backend).
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, pipeline_stage: stage } : l)),
    }))
    // Try to persist to a backend if one exists; ignore failure silently.
    try { await api.updateLead(id, { pipeline_stage: stage }) } catch { /* in-memory only */ }
  },

  updateLead: async (id, patch) => {
    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      alerts: deriveAlerts(s.leads.map((l) => (l.id === id ? { ...l, ...patch } : l))),
    }))
    try { await api.updateLead(id, patch) } catch { /* in-memory only */ }
  },

  toggleEscalation: async (id, reason) => {
    const lead = get().leads.find((l) => l.id === id)
    if (!lead) return
    try {
      await get().updateLead(id, {
        escalated: !lead.escalated,
        escalation_reason: !lead.escalated ? reason : null,
        urgent: !lead.escalated,
      })
    } catch (e) {
      get().notify({ kind: 'error', title: "Couldn't update escalation", message: (e as Error).message })
    }
  },

  clearAll: async () => {
    // snapshot for undo (reversible action — Shneiderman #6)
    const prev = get().leads
    const prevActivity = get().activity
    set({ leads: [], alerts: [], activity: {} })
    get().notify({
      kind: 'info',
      title: 'All leads cleared',
      action: {
        label: 'Undo',
        run: () => {
          set({ leads: prev, activity: prevActivity })
          get().notify({ kind: 'success', title: 'Leads restored' })
        },
      },
    })
    try { await api.clearLeads() } catch { /* in-memory only */ }
  },

  markAlertRead: (id) =>
    set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)) })),
}))
