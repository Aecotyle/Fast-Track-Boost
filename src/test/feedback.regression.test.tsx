import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { useCRM } from '../store/useCRM'
import ToastContainer from '../components/Toast'
import { api } from '../api/client'

vi.mock('../api/vapiClient', () => ({
  isVapiConfigured: () => false,
  vapi: { listCalls: vi.fn(), getCall: vi.fn(), getStructuredCalls: vi.fn(), analytics: vi.fn() },
}))

vi.mock('../api/client', () => ({
  api: {
    getLeads: vi.fn(async () => []),
    getVapiLeads: vi.fn(async () => []),
    getVapiStatus: vi.fn(async () => ({ configured: true })),
    getAgent: vi.fn(async () => ({ name: 'Alex', system_prompt: '', webhook_url: '', server_url: '', business_hours: { days: ['Mon'], open: '09:00', close: '19:00', timezone: 'CST' }, transfer_number: '(888) 711-8049', primary_phone: '(888) 711-8049', structured_output_id: 'x' })),
    getActivity: vi.fn(async () => []),
    updateLead: vi.fn(async (id, p) => ({ id, ...p })),
    updateAgent: vi.fn(async (p) => ({ ...p })),
    getSchema: vi.fn(async () => ({})),
    clearLeads: vi.fn(async () => ({ ok: true })),
    simulate: vi.fn(), postWebhook: vi.fn(),
  },
}))

function seed() {
  useCRM.setState({
    leads: [], alerts: [], loading: false, agent: null, activity: {},
    view: 'dashboard', selectedLeadId: null, theme: 'gold', toasts: [],
    dateFilter: { key: 'today', label: 'Today', from: null, to: null },
    scoreFilter: 'All', serviceFilter: 'All', search: '',
  })
}

beforeEach(() => seed())

describe('Feedback system (Nielsen #1 visibility, #9 errors, Shneiderman #6 undo)', () => {
  it('notify adds a toast and it renders', () => {
    render(<ToastContainer />)
    act(() => {
      useCRM.getState().notify({ kind: 'success', title: 'Saved', message: 'Your changes are live.' })
    })
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Your changes are live.')).toBeInTheDocument()
  })

  it('dismissToast removes the toast', () => {
    render(<ToastContainer />)
    act(() => {
      const id = useCRM.getState().toasts.length
      useCRM.getState().notify({ kind: 'info', title: 'Hello' })
      // dismiss the just-added toast (last one)
      const added = useCRM.getState().toasts[useCRM.getState().toasts.length - 1]
      useCRM.getState().dismissToast(added.id)
    })
    expect(useCRM.getState().toasts).toHaveLength(0)
  })

  it('clearAll surfaces an Undo action that restores leads (reversible action)', async () => {
    render(<ToastContainer />)
    useCRM.setState({
      leads: [{ id: 'NCR-1', client_info: { full_name: 'A', phone_number: '1', email: '', customer_status: 'New' }, lead_classification: 'Hot', consultation_type: 'None', primary_service: 'Credit Repair', credit_score: 600, customer_background: '', call_summary: '', payment_status: 'Pending', appointment_scheduled: false, call_recording_url: '', created_at: new Date().toISOString(), pipeline_stage: 'New Lead', requested_funding: null, business_revenue: null, active_ein: false, tradeline_goal: null, payment_link_sent: false, payment_link_sent_at: null, tags: [], escalated: false, escalation_reason: null, assigned_to: 'Alex', duration_seconds: 0, urgent: false }],
      activity: {},
    })
    await act(async () => { await useCRM.getState().clearAll() })
    expect(useCRM.getState().leads).toHaveLength(0)
    // undo toast present
    const undoBtn = screen.getByText('Undo')
    expect(undoBtn).toBeInTheDocument()
    act(() => { fireEvent.click(undoBtn) })
    expect(useCRM.getState().leads).toHaveLength(1)
  })

  it('load() shows a plain-language error toast when the API fails', async () => {
    render(<ToastContainer />)
    // BOTH the Vapi proxy and the fallback local store fail.
    ;(api.getVapiLeads as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Could not reach the server. Check your connection and try again.'))
    ;(api.getLeads as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Could not reach the server. Check your connection and try again.'))
    await act(async () => { await useCRM.getState().load() })
    expect(screen.getByText("Couldn't load your calls")).toBeInTheDocument()
    expect(screen.getByText('Could not reach the server. Check your connection and try again.')).toBeInTheDocument()
  })
})
