import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useCRM } from '../store/useCRM'
import App from '../App'
import LeadDetail from '../pages/LeadDetail'
import { Lead } from '../types'

vi.mock('../api/client', () => ({
  api: {
    getLeads: vi.fn(async () => [LEAD]),
    getAgent: vi.fn(async () => ({
      name: 'Alex', system_prompt: 'p', webhook_url: '', server_url: '/api/webhook',
      business_hours: { days: ['Mon'], open: '09:00', close: '19:00', timezone: 'CST' },
      transfer_number: '(888) 711-8049', primary_phone: '(888) 711-8049', structured_output_id: 'x',
    })),
    getActivity: vi.fn(async () => [
      { id: 'a1', lead_id: 'NCR-1001', type: 'call', title: 'Inbound AI call', detail: 'handled', timestamp: new Date().toISOString(), meta: '10:00' },
    ]),
    updateLead: vi.fn(async (id, p) => ({ ...LEAD, ...p })),
    updateAgent: vi.fn(async (p) => ({ ...p })),
    getSchema: vi.fn(async () => ({})),
    clearLeads: vi.fn(async () => ({ ok: true })),
    simulate: vi.fn(), postWebhook: vi.fn(),
  },
}))

const LEAD: Lead = {
  id: 'NCR-1001',
  client_info: { full_name: 'Marcus Reed', phone_number: '(512) 555-0142', email: 'm@e.com', customer_status: 'New' },
  lead_classification: 'Hot', consultation_type: 'Tony_Owner_$250', primary_service: 'Business Funding',
  credit_score: 648, customer_background: 'LLC', call_summary: 'High intent.',
  payment_status: 'Pending', appointment_scheduled: false, call_recording_url: '',
  created_at: new Date().toISOString(), pipeline_stage: 'Qualified', requested_funding: 85000,
  business_revenue: 42000, active_ein: true, tradeline_goal: null,
  payment_link_sent: true, payment_link_sent_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  tags: ['Direct Tony'], escalated: false, escalation_reason: null,
  assigned_to: 'Alex', duration_seconds: 600, urgent: false,
}

beforeEach(() => {
  useCRM.setState({
    leads: [LEAD], alerts: [], loading: false, agent: null, activity: { 'NCR-1001': [{ id: 'a1', lead_id: 'NCR-1001', type: 'call', title: 'Inbound AI call', detail: 'handled', timestamp: new Date().toISOString(), meta: '10:00' }] },
    view: 'lead', selectedLeadId: 'NCR-1001',
    dateFilter: { key: 'today', label: 'Today', from: null, to: null },
    scoreFilter: 'All', serviceFilter: 'All', search: '',
  })
})

describe('LeadDetail + App shell regression', () => {
  it('LeadDetail renders header, escalation toggle, and all 4 tabs', async () => {
    render(<LeadDetail leadId="NCR-1001" />)
    expect(screen.getByText('Marcus Reed')).toBeInTheDocument()

    // tabs
    fireEvent.click(screen.getByText('Overview'))
    fireEvent.click(screen.getByText('Qualification'))
    expect(screen.getByText('Qualification Metrics')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Payment'))
    expect(screen.getByText('Payment Timeline')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Activity & SMS'))
    expect(screen.getByText('Activity & Follow-up Logs')).toBeInTheDocument()

    // escalation toggle
    const esc = screen.getByText('Escalate to team')
    fireEvent.click(esc)
    await waitFor(() => expect(useCRM.getState().leads[0].escalated).toBe(true))
  })

  it('App shell renders topbar and sidebar navigation works', async () => {
    useCRM.setState({ view: 'dashboard', selectedLeadId: null })
    render(<App />)
    // sidebar nav buttons present
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Leads').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Notifications').length).toBeGreaterThan(0)
    // click a nav item
    const leads = screen.getAllByText('Leads')[0]
    fireEvent.click(leads)
    expect(useCRM.getState().view).toBe('leads')
  })

  it('Topbar search input updates the store', () => {
    useCRM.setState({ view: 'dashboard' })
    render(<App />)
    const search = screen.getByPlaceholderText('Search name, email, phone, score…')
    fireEvent.change(search, { target: { value: 'Marcus' } })
    expect(useCRM.getState().search).toBe('Marcus')
  })
})
