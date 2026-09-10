import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Topbar from '../components/layout/Topbar'
import { useCRM } from '../store/useCRM'

vi.mock('../api/client', () => ({
  api: {
    getLeads: vi.fn(async () => []),
    getVapiLeads: vi.fn(async () => []),
    getVapiStatus: vi.fn(async () => ({ configured: true })),
    getAgent: vi.fn(async () => ({
      name: 'Alex', system_prompt: 'p', webhook_url: '', server_url: '/api/webhook',
      business_hours: { days: ['Mon'], open: '09:00', close: '19:00', timezone: 'CST' },
      transfer_number: '(888) 711-8049', primary_phone: '(888) 711-8049', structured_output_id: 'x',
    })),
    getActivity: vi.fn(async () => []),
    updateLead: vi.fn(), updateAgent: vi.fn(), getSchema: vi.fn(async () => ({})),
    clearLeads: vi.fn(), simulate: vi.fn(), postWebhook: vi.fn(),
  },
}))

function seed() {
  useCRM.setState({
    leads: [], alerts: [
      { id: 'a1', kind: 'direct_tony', lead_id: 'NCR-1001', lead_name: 'Marcus Reed', message: 'Tony request', created_at: new Date().toISOString(), read: false },
    ],
    loading: false, agent: null, activity: {}, view: 'dashboard', selectedLeadId: null,
    dateFilter: { key: 'today', label: 'Today', from: null, to: null },
    scoreFilter: 'All', serviceFilter: 'All', search: '',
  })
}

const panel = () => screen.getByTestId('notification-panel')
const isOpen = () => panel().className.includes('opacity-100')
const isClosed = () => panel().className.includes('opacity-0')

beforeEach(() => seed())
afterEach(() => { document.body.innerHTML = '' })

describe('Notification panel open/close behavior (regression)', () => {
  it('opens on bell click', () => {
    render(<Topbar />)
    const bell = screen.getByRole('button', { name: 'Notifications' })
    expect(isClosed()).toBe(true)
    fireEvent.click(bell)
    expect(isOpen()).toBe(true)
  })

  it('closes when the bell is clicked again (toggle)', () => {
    render(<Topbar />)
    const bell = screen.getByRole('button', { name: 'Notifications' })
    fireEvent.click(bell)
    expect(isOpen()).toBe(true)
    fireEvent.click(bell)
    expect(isClosed()).toBe(true)
  })

  it('closes on Escape key', () => {
    render(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(isOpen()).toBe(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(isClosed()).toBe(true)
  })

  it('closes when clicking outside the panel', () => {
    render(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(isOpen()).toBe(true)
    fireEvent.mouseDown(document.body)
    expect(isClosed()).toBe(true)
  })

  it('opens a lead when a notification is clicked and closes panel', () => {
    render(<Topbar />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    fireEvent.click(screen.getByText('Tony request'))
    expect(useCRM.getState().selectedLeadId).toBe('NCR-1001')
    expect(isClosed()).toBe(true)
  })
})
