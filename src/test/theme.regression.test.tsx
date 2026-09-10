import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useCRM, THEMES } from '../store/useCRM'
import ThemeSwitcher from '../components/ThemeSwitcher'

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

beforeEach(() => {
  localStorage.clear()
  useCRM.setState({
    leads: [], alerts: [], loading: false, agent: null, activity: {},
    view: 'dashboard', selectedLeadId: null, theme: 'gold',
    dateFilter: { key: 'today', label: 'Today', from: null, to: null },
    scoreFilter: 'All', serviceFilter: 'All', search: '',
  })
})

describe('Theme engine', () => {
  it('defaults to gold and persists theme to localStorage on set', () => {
    expect(useCRM.getState().theme).toBe('gold')
    useCRM.getState().setTheme('violet')
    expect(useCRM.getState().theme).toBe('violet')
    expect(localStorage.getItem('ncr-theme')).toBe('violet')
  })

  it('ThemeSwitcher opens and clicking a swatch changes the theme', () => {
    render(<ThemeSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'Change theme' }))
    expect(screen.getByText('Violet')).toBeInTheDocument()
    expect(screen.getByText('Emerald')).toBeInTheDocument()
    expect(screen.getByText('Ocean')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Ocean'))
    expect(useCRM.getState().theme).toBe('ocean')
    expect(localStorage.getItem('ncr-theme')).toBe('ocean')
  })

  it('exposes all 7 theme keys', () => {
    const keys = THEMES.map((t) => t.key).sort()
    expect(keys).toHaveLength(7)
    expect(keys).toEqual(expect.arrayContaining(['gold', 'violet', 'emerald', 'cyan', 'ember', 'ocean', 'rose']))
  })
})
