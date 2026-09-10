import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCRM } from '../store/useCRM'
import { Lead } from '../types'

// Mock the API client so the store logic runs without a server.
vi.mock('../api/client', () => ({
  api: {
    getLeads: vi.fn(),
    getVapiLeads: vi.fn(),
    getVapiStatus: vi.fn(),
    getAgent: vi.fn(),
    getLead: vi.fn(),
    updateLead: vi.fn(async (id, patch) => ({ ...LEAD, ...patch })),
    clearLeads: vi.fn(async () => ({ ok: true })),
    getActivity: vi.fn(async () => []),
    getSchema: vi.fn(async () => ({})),
    simulate: vi.fn(),
    postWebhook: vi.fn(),
  },
}))

// Force the fallback (backend) path — don't hit the real Vapi API in tests.
vi.mock('../api/vapiClient', () => ({
  isVapiConfigured: () => false,
  vapi: { listCalls: vi.fn(), getCall: vi.fn(), getStructuredCalls: vi.fn(), analytics: vi.fn() },
}))
import { api } from '../api/client'

const LEAD: Lead = {
  id: 'NCR-1001',
  client_info: { full_name: 'Marcus Reed', phone_number: '(512) 555-0142', email: 'm@e.com', customer_status: 'New' },
  lead_classification: 'Hot',
  consultation_type: 'Tony_Owner_$250',
  primary_service: 'Business Funding',
  credit_score: 648,
  customer_background: 'LLC',
  call_summary: 'High intent.',
  payment_status: 'Pending',
  appointment_scheduled: false,
  call_recording_url: '',
  created_at: new Date().toISOString(),
  pipeline_stage: 'New Lead',
  requested_funding: 85000,
  business_revenue: 42000,
  active_ein: true,
  tradeline_goal: null,
  payment_link_sent: true,
  payment_link_sent_at: new Date(Date.now() - 26 * 3_600_000).toISOString(),
  tags: ['Direct Tony', 'High Intent'],
  escalated: false,
  escalation_reason: null,
  assigned_to: 'Alex',
  duration_seconds: 600,
  urgent: false,
}

describe('CRM store — navigation & filters', () => {
  beforeEach(() => {
    useCRM.setState({
      leads: [LEAD], alerts: [], loading: false, agent: null, activity: {},
      view: 'dashboard', selectedLeadId: null,
      dateFilter: { key: 'today', label: 'Today', from: null, to: null },
      scoreFilter: 'All', serviceFilter: 'All', search: '',
    })
  })

  it('navigates between all views', () => {
    const s = useCRM.getState()
    s.navigate('dashboard'); expect(useCRM.getState().view).toBe('dashboard')
    s.navigate('leads'); expect(useCRM.getState().view).toBe('leads')
    s.navigate('lead', 'NCR-1001'); expect(useCRM.getState().view).toBe('lead')
    expect(useCRM.getState().selectedLeadId).toBe('NCR-1001')
    s.navigate('notifications'); expect(useCRM.getState().view).toBe('notifications')
  })

  it('filters set correctly', () => {
    const s = useCRM.getState()
    s.setScoreFilter('Hot'); expect(useCRM.getState().scoreFilter).toBe('Hot')
    s.setServiceFilter('Business Funding'); expect(useCRM.getState().serviceFilter).toBe('Business Funding')
    s.setSearch('Marcus'); expect(useCRM.getState().search).toBe('Marcus')
    s.setDateFilter({ key: '7d', label: 'Last 7 Days', from: null, to: null })
    expect(useCRM.getState().dateFilter.key).toBe('7d')
  })

  it('moveStage calls updateLead and reflects the change', async () => {
    const s = useCRM.getState()
    await s.moveStage('NCR-1001', 'Qualified')
    expect(api.updateLead).toHaveBeenCalledWith('NCR-1001', { pipeline_stage: 'Qualified' })
    expect(useCRM.getState().leads[0].pipeline_stage).toBe('Qualified')
  })

  it('toggleEscalation flips the flag and creates an urgent alert', async () => {
    const s = useCRM.getState()
    await s.toggleEscalation('NCR-1001', 'Escalated by agent')
    const lead = useCRM.getState().leads[0]
    expect(lead.escalated).toBe(true)
    expect(lead.urgent).toBe(true)
    expect(useCRM.getState().alerts.some((a) => a.kind === 'urgent_escalation')).toBe(true)
  })

  it('derives Direct Tony + unpaid-24h + high-intent alerts on load', async () => {
    const mockGetLeads = api.getLeads as ReturnType<typeof vi.fn>
    mockGetLeads.mockResolvedValue([LEAD])
    const mockGetAgent = api.getAgent as ReturnType<typeof vi.fn>
    mockGetAgent.mockResolvedValue({
      name: 'Alex', system_prompt: '', webhook_url: '', server_url: '',
      business_hours: { days: ['Mon'], open: '09:00', close: '19:00', timezone: 'CST' },
      transfer_number: '(888) 711-8049', primary_phone: '(888) 711-8049', structured_output_id: 'x',
    })
    await useCRM.getState().load()
    const kinds = useCRM.getState().alerts.map((a) => a.kind)
    expect(kinds).toContain('direct_tony')
    expect(kinds).toContain('high_intent')
    // payment link sent 26h ago & still pending → unpaid_24h
    expect(kinds).toContain('unpaid_24h')
  })

  it('markAlertRead toggles read state', () => {
    useCRM.setState({ alerts: [{ id: 'a', kind: 'high_intent', lead_id: 'NCR-1001', lead_name: 'M', message: 'm', created_at: new Date().toISOString(), read: false }] })
    useCRM.getState().markAlertRead('a')
    expect(useCRM.getState().alerts[0].read).toBe(true)
  })

  it('clearAll empties leads and alerts', async () => {
    await useCRM.getState().clearAll()
    expect(useCRM.getState().leads).toHaveLength(0)
    expect(useCRM.getState().alerts).toHaveLength(0)
  })
})
