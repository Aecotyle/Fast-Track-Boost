// ============================================================
// Frontend Vapi REST client — calls Vapi's NATIVE endpoints
// directly from the browser. No dedicated backend.
//
// Key comes from VITE_VAPI_API_KEY (see .env / .env.example).
//
// NOTE: calling the REST API with a private key from the browser
// exposes that key in the bundle. Use a public/test key for now;
// for production prefer a thin proxy or Vapi's client SDK.
// ============================================================

const BASE = (import.meta.env.VITE_VAPI_BASE_URL as string | undefined) || 'https://api.vapi.ai'

// Key comes from .env (VITE_VAPI_API_KEY). A built-in fallback is included
// so the app still works if the hidden .env file didn't survive a folder
// download. For production, prefer .env / a public key — this fallback is
// visible in the bundle.
const KEY =
  (import.meta.env.VITE_VAPI_API_KEY as string | undefined) ||
  '4b16dd37-5cec-4204-80e5-42a64bbfd10d'

const ASSISTANT_ID =
  (import.meta.env.VITE_VAPI_ASSISTANT_ID as string | undefined) ||
  '6fc802a9-0cb8-4478-ad1c-475afeebe9c9'


export function isVapiConfigured() {
  return Boolean(KEY)
}

export function getAssistantFilter() {
  return ASSISTANT_ID
}

function authHeaders(): HeadersInit {
  if (!KEY) throw new Error('VITE_VAPI_API_KEY is not set in .env')
  return {
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  }
}

async function vapiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: authHeaders(),
    // Prevent the browser from returning a stale/truncated cached 304
    // response — always fetch the full fresh data from Vapi.
    cache: 'no-store',
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Vapi ${res.status}: ${text.slice(0, 180)}`)
  }
  return res.json() as Promise<T>
}

// ---- Types (subset of Vapi's call object) ----
export interface VapiCall {
  id: string
  startedAt?: string
  endedAt?: string
  createdAt?: string
  customer?: { number?: string }
  assistantId?: string
  status?: string
  endedReason?: string
  transcript?: string
  summary?: string
  recordingUrl?: string
  cost?: number
  analysis?: { summary?: string; successEvaluation?: string }
  artifact?: {
    recordingUrl?: string
    transcript?: string
    structuredOutputs?: Record<string, { name: string; result: Record<string, unknown> }>
  }
}

export interface VapiCallsResponse {
  results?: VapiCall[]
  calls?: VapiCall[]
}

export const vapi = {
  listCalls: (limit = 50) => {
    const asst = ASSISTANT_ID ? `&assistantId=${encodeURIComponent(ASSISTANT_ID)}` : ''
    return vapiFetch<VapiCallsResponse>(`/call?limit=${limit}${asst}`).then((d) => {
      // Vapi returns a TOP-LEVEL array of calls (not {results: [...]}).
      // Handle both shapes so nothing is silently dropped.
      if (Array.isArray(d)) return d
      return d?.results || d?.calls || []
    })
  },

  getCall: (id: string) => vapiFetch<VapiCall>(`/call/${id}`),

  /**
   * Fetch ONLY calls that contain structured-output lead data.
   * The list endpoint exposes output IDs but not their contents,
   * so we filter the list, then fetch each matching call in full.
   */
  async getStructuredCalls(limit = 200): Promise<VapiCall[]> {
    const calls = await this.listCalls(limit)
    const withOutputs = calls.filter((c) => {
      const so = c.artifact?.structuredOutputs
      if (!so) return false
      if (Array.isArray(so)) return so.length > 0
      return Object.keys(so as object).length > 0
    })
    // Fetch each in full to resolve the structured data, tolerating any
    // individual failure so one bad call can't blank the whole dashboard.
    const results = await Promise.allSettled(withOutputs.map((c) => this.getCall(c.id)))
    return results
      .filter((r): r is PromiseFulfilledResult<VapiCall> => r.status === 'fulfilled')
      .map((r) => r.value)
  },

  /** Analytics query (see Vapi analytics API). */
  analytics: (body: Record<string, unknown>) =>
    vapiFetch<unknown>('/analytics', { method: 'POST', body: JSON.stringify(body) }),
}
