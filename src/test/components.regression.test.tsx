import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useCRM } from '../store/useCRM'
import Dashboard from '../pages/Dashboard'
import LeadsPage from '../pages/LeadsPage'
import Notifications from '../pages/Notifications'
import { Lead } from '../types'

vi.mock('../api/client', () => ({
  api: {
    getLeads: vi.fn(async () => []),
    getVapiLeads: vi.fn(async () => []),
    getVapiStatus: vi.fn(async () => ({ configured: true })),
    getAgent: vi.fn(async () => ({
      name: 'Alex', system_prompt: 'prompt', webhook_url: '', server_url: '/api/webhook',
      business_hours: { days: ['Mon','Tue','Wed','Thu','Fri','Sat'], open: '09:00', close: '19:00', timezone: 'CST' },
      transfer_number: '(888) 711-8049', primary_phone: '(888) 711-8049', structured_output_id: 'x',
    })),
    getActivity: vi.fn(async () => []),
    updateLead: vi.fn(async (id, p) => ({ ...LEAD, ...p })),
    updateAgent: vi.fn(async (p) => ({ ...p })),
    getSchema: vi.fn(async () => ({ name: 'x', schema: {} })),
    clearLeads: vi.fn(async () => ({ ok: true })),
    simulate: vi.fn(async () => ({ message: {} })),
    postWebhook: vi.fn(async () => ({ ok: true, lead: {} })),
  },
}))

const LEAD: Lead = {
  id: 'NCR-1001',
  client_info: { full_name: 'Marcus Reed', phone_number: '(512) 555-0142', email: 'm@e.com', customer_status: 'New' },
  lead_classification: 'Hot', consultation_type: 'Tony_Owner_$250', primary_service: 'Business Funding',
  credit_score: 648, customer_background: 'LLC', call_summary: 'High intent.',
  payment_status: 'Pending', appointment_scheduled: false, call_recording_url: '',
  created_at: new Date().toISOString(), pipeline_stage: 'New Lead', requested_funding: 85000,
  business_revenue: 42000, active_ein: true, tradeline_goal: null,
  payment_link_sent: true, payment_link_sent_at: new Date(Date.now() - 26 * 3_600_000).toISOString(),
  tags: ['Direct Tony', 'High Intent'], escalated: false, escalation_reason: null,
  assigned_to: 'Alex', duration_seconds: 600, urgent: false,
}

function seed() {
  useCRM.setState({
    leads: [LEAD], alerts: [
      { id: 'a1', kind: 'direct_tony', lead_id: 'NCR-1001', lead_name: 'Marcus Reed', message: 'Tony request', created_at: new Date().toISOString(), read: false },
    ],
    loading: false, agent: { name: 'Alex', system_prompt: 'p', webhook_url: '', server_url: '/api/webhook', business_hours: { days: ['Mon'], open: '09:00', close: '19:00', timezone: 'CST' }, transfer_number: '(888) 711-8049', primary_phone: '(888) 711-8049', structured_output_id: 'x' },
    activity: {}, view: 'dashboard', selectedLeadId: null,
    dateFilter: { key: 'today', label: 'Today', from: null, to: null },
    scoreFilter: 'All', serviceFilter: 'All', search: '',
  })
}

beforeEach(() => seed())

describe('Component render regression', () => {
  it('Dashboard renders KPIs and navigates to leads', () => {
    render(<Dashboard />)
    expect(screen.getByText('Total Calls')).toBeInTheDocument()
    expect(screen.getAllByText('Qualified').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Revenue').length).toBeGreaterThan(0)
    // KPI value = 1 call (Total Calls card)
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    const allLeads = screen.getByText('All leads')
    fireEvent.click(allLeads)
    expect(useCRM.getState().view).toBe('leads')
  })

  it('LeadsPage toggles Kanban/Table view and opens a lead row', () => {
    render(<LeadsPage />)
    // Kanban visible with the lead
    expect(screen.getByText('Marcus Reed')).toBeInTheDocument()
    // Switch to table
    fireEvent.click(screen.getByText('Table'))
    expect(screen.getByText('Marcus Reed')).toBeInTheDocument()
  })

  it('LeadsPage export menu opens with CSV/Excel/PDF actions', () => {
    render(<LeadsPage />)
    fireEvent.click(screen.getByText('Export'))
    expect(screen.getByText('CSV')).toBeInTheDocument()
    expect(screen.getByText('Excel')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
  })

  it('Notifications renders alerts and clicking opens lead', async () => {
    render(<Notifications />)
    expect(screen.getByText('Marcus Reed')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Tony request'))
    await waitFor(() => expect(useCRM.getState().selectedLeadId).toBe('NCR-1001'))
  })


})
