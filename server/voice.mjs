// ============================================================
// Voice platform API client — runs ONLY server-side.
// Reads the private key from the environment; the key never
// touches the browser. Frontend calls these proxy endpoints
// on THIS server, which forwards to the voice API base URL.
// ============================================================

const BASE = process.env.VOICE_BASE_URL || 'https://api.vapi.ai'
const KEY = process.env.VOICE_API_KEY || ''
const ASSISTANT_ID = process.env.VOICE_ASSISTANT_ID || ''

function authHeaders() {
  if (!KEY) throw new Error('VOICE_API_KEY is not set in .env')
  return { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }
}

async function voiceFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Voice platform ${res.status}: ${text.slice(0, 200)}`)
  }
  const ct = res.headers.get('content-type') || ''
  return ct.includes('json') ? res.json() : res
}

export const voice = {
  /** List recent calls (paginated), optionally filtered to one assistant. */
  listCalls: (limit = 20) => {
    const asst = ASSISTANT_ID ? `&assistantId=${encodeURIComponent(ASSISTANT_ID)}` : ''
    return voiceFetch(`/call?limit=${limit}${asst}`).then((d) => d.results || d)
  },

  /** Get a single call + its artifacts (recordings, structured outputs). */
  getCall: (id) => voiceFetch(`/call/${id}`),

  /**
   * Fetch ONLY calls that contain structured-output lead data.
   * List returns output IDs; we fetch each matching call in full.
   */
  async getStructuredCalls(limit = 200) {
    const calls = await this.listCalls(limit)
    const withOutputs = calls.filter((c) => {
      const so = c?.artifact?.structuredOutputs
      return so && (Array.isArray(so) ? so.length > 0 : Object.keys(so).length > 0)
    })
    return Promise.all(withOutputs.map((c) => this.getCall(c.id)))
  },

  /** Redirect to a short-lived signed recording URL (must follow redirects). */
  recordingUrl: async (id, channel = 'mono') => {
    const res = await fetch(`${BASE}/call/${id}/${channel}-recording`, {
      headers: { Authorization: `Bearer ${KEY}` },
      redirect: 'manual',
    })
    return res.headers.get('location')
  },

  /** Call logs (transcript). Returns a signed URL or JSONL. */
  callLogs: (id) => voiceFetch(`/call/${id}/call-logs`),

  /** Dashboard analytics query. */
  analytics: (body) => voiceFetch('/analytics', { method: 'POST', body }),
}
