// ============================================================
// NCR CRM — API client (talks to the Express backend)
// ============================================================

import { Lead, ActivityEvent } from '../types'

const BASE = '/api'

/** Human-readable error so users understand what happened and how to recover. */
function friendlyError(path: string, status: number): Error {
  const map: Record<number, string> = {
    0: 'Could not reach the server. Check your connection and try again.',
    404: `The requested data (${path}) was not found. Refresh and try again.`,
    500: 'The server hit an unexpected error. Try again, or refresh the page.',
    503: 'The service is temporarily unavailable. Please try again in a moment.',
  }
  const msg = map[status] ?? `Something went wrong (${status}). Please try again.`
  return new Error(msg)
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw friendlyError(path, 0)
  }
  if (!res.ok) throw friendlyError(path, res.status)
  return res.json() as Promise<T>
}

export const api = {
  getLeads: () => request<Lead[]>('/leads'),
  getLead: (id: string) => request<Lead>(`/leads/${id}`),
  updateLead: (id: string, patch: Partial<Lead>) =>
    request<Lead>(`/leads/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  clearLeads: () => request<{ ok: boolean }>('/leads', { method: 'DELETE' }),
  getActivity: (id: string) =>
    request<ActivityEvent[]>(`/leads/${id}/activity`),
  getAgent: () => request<AgentSettings>('/agent'),
  updateAgent: (patch: Partial<AgentSettings>) =>
    request<AgentSettings>('/agent', { method: 'PATCH', body: JSON.stringify(patch) }),
  getSchema: () => request<object>('/schema'),
  simulate: (n = 0) => request<{ message: WebhookMessage }>(`/simulate/${n}`),
  postWebhook: (payload: { message: WebhookMessage }) =>
    request<{ ok: boolean; lead: Lead }>('/webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  /** Fetch Vapi structured-output calls as leads, proxied server-side. */
  getVapiLeads: () => request<Lead[]>('/vapi-leads'),
  getVapiStatus: () => request<{ configured: boolean }>('/voice/status'),
}

export interface AgentSettings {
  name: string
  system_prompt: string
  webhook_url: string
  server_url: string
  business_hours: { days: string[]; open: string; close: string; timezone: string }
  transfer_number: string
  primary_phone: string
  structured_output_id: string
}

export interface WebhookMessage {
  type: string
  endedReason?: string
  call?: {
    id?: string
    startedAt?: string
    endedAt?: string
    customer?: { number?: string }
    artifact?: { recordingUrl?: string }
  }
  artifact?: {
    structuredOutputs?: Record<string, { name: string; result: Record<string, unknown> }>
  }
}
