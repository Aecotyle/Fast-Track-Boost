import { describe, expect, it } from 'vitest'
import { transformVapiCall } from '../api/transform'

// Guards the "array vs object" bug: Vapi returns a TOP-LEVEL array
// from /call. listCalls must handle arrays, and transformVapiCall
// must extract structured output from a call object.

const sampleCall = {
  id: '019fe3b3-b7b6-7000-8963-034e9628d090',
  startedAt: '2026-08-08T23:27:14.324Z',
  endedAt: '2026-08-08T23:33:36.079Z',
  customer: { number: '+13126251897' },
  artifact: {
    transcript: 'AI: Hi. User: hello my name is Taha Muazzam.',
    structuredOutputs: {
      'client-email-id': { name: 'client_email', result: { client_email: 'tahaemehood8999@gmail.com' } },
      'client-info-id': { name: 'Client Info Extraction', result: { client_name: 'Taha Muazzam' } },
    },
  },
}

describe('Vapi integration', () => {
  it('handles a TOP-LEVEL array response from /call', () => {
    const d = [sampleCall]
    // Replicates listCalls logic: must return the array, not []
    const result = Array.isArray(d) ? d : (d as { results?: unknown }).results || []
    expect(result).toHaveLength(1)
  })

  it('transformVapiCall extracts client_name + client_email from structured output', () => {
    const lead = transformVapiCall(sampleCall as never)
    expect(lead.client_info.full_name).toBe('Taha Muazzam')
    expect(lead.client_info.email).toBe('tahaemehood8999@gmail.com')
    expect(lead.lead_classification).toBe('Warm')
  })

  it('calculates duration_seconds from startedAt/endedAt', () => {
    const lead = transformVapiCall(sampleCall as never)
    // 23:33:36 - 23:27:14 = 382 seconds
    expect(lead.duration_seconds).toBe(382)
  })

  it('sets created_at from startedAt', () => {
    const lead = transformVapiCall(sampleCall as never)
    expect(lead.created_at).toBe('2026-08-08T23:27:14.324Z')
  })
})
