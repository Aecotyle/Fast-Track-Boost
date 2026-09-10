// ============================================================
// Transform a Vapi call object into a Lead for the CRM.
// Handles BOTH:
//  - real structured outputs (client_name / client_email, etc.)
//  - the fuller NCR schema (client_info.full_name, ...)
// And falls back to call metadata (phone, time, duration) for
// calls that have no structured extraction.
// ============================================================

import { Lead, PrimaryService, LeadScore, ConsultationType, PaymentStatus } from '../types'
import { VapiCall } from './vapiClient'

const SERVICES: PrimaryService[] = [
  'Personal Funding', 'Business Funding', 'Credit Repair',
  'Tradelines', 'Debt Consolidation', 'General Consultation',
]
const SCORES: LeadScore[] = ['Hot', 'Warm', 'Cold']
const CONSULTS: ConsultationType[] = ['Standard_$100', 'Tony_Owner_$250', 'None']
const PAY: PaymentStatus[] = ['Pending', 'Paid', 'Refunded', 'Cancelled']

const pick = <T,>(list: T[], v: unknown, fallback: T): T =>
  list.includes(v as T) ? (v as T) : fallback

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : v ? String(v) : ''
}

/** Merge all linked structured outputs into one flat object, robust to
 *  Vapi returning it as an object, an array, or undefined. */
function mergeOutputs(call: VapiCall): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const so = call.artifact?.structuredOutputs
  if (!so) return out
  const entries: unknown[] = Array.isArray(so) ? so : Object.values(so)
  for (const data of entries) {
    if (!data) continue
    const d = data as { result?: unknown }
    // Accept data.result (Vapi standard) or the object itself if it's flat.
    const res = d && typeof d === 'object' && 'result' in d ? d.result : data
    if (res && typeof res === 'object') {
      Object.assign(out, res as Record<string, unknown>)
    } else if (typeof res === 'string' || typeof res === 'number' || typeof res === 'boolean') {
      // scalar extraction (rare) — key by a generic name
      const name = (data as { name?: string })?.name || 'value'
      out[name] = res
    }
  }
  return out
}

/** Best-effort name from a transcript, if no structured name exists. */
const NOISE = /\b(looking|calling|interested|wondering|asking|talking|try(ing)?|hoping|trying)\b/i

function nameFromTranscript(call: VapiCall): string {
  const t = call.artifact?.transcript || call.transcript || ''
  // "my name is X" — most reliable
  const m = t.match(/\bmy name is\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i)
  if (m) return m[1]
  // "this is X" greeting near the start
  const m2 = t.match(/User:\s*this is\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i)
  if (m2 && !NOISE.test(m2[1])) return m2[1]
  // "I'm X" / "i am X" — but reject gerunds/noise
  const m3 = t.match(/User:\s*(?:I'?m|i am)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i)
  if (m3 && !NOISE.test(m3[1])) return m3[1]
  return ''
}

export function transformVapiCall(call: VapiCall): Lead {
  const ext = mergeOutputs(call)

  // --- Name: try full schema, then real fields, then transcript ---
  const info = (ext.client_info ?? {}) as Record<string, unknown>
  const fullName =
    str(info.full_name) ||
    str(ext.client_name) ||
    str(ext.full_name) ||
    str(ext.name) ||
    nameFromTranscript(call) ||
    'Unknown Caller'

  // --- Contact ---
  const email = str(info.email) || str(ext.client_email) || str(ext.email)
  const phone = str(info.phone_number) || str(ext.phone_number) || str(call.customer?.number)

  const consult = pick(CONSULTS, ext.consultation_type, 'None')
  const isTony = consult === 'Tony_Owner_$250'

  const duration =
    call.startedAt && call.endedAt
      ? Math.max(0, Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000))
      : 0

  // Summary priority: extracted call_summary → Vapi top-level summary →
  // analysis.summary → transcript snippet → fallback note.
  const transcript = call.artifact?.transcript || call.transcript || ''
  const snippet = transcript.replace(/\n/g, ' ').slice(0, 400)
  const summary =
    str(ext.call_summary) ||
    str(call.summary) ||
    str(call.analysis?.summary) ||
    (snippet ? snippet : `Inbound call captured. ${call.endedReason ? `Ended: ${call.endedReason}.` : ''} ${duration > 0 ? `Duration ${Math.round(duration / 60)}m.` : ''}`)

  // --- Credit Score & Lead Classification ---
  let creditScore: number | null =
    typeof ext.credit_score === 'number' && ext.credit_score >= 300 && ext.credit_score <= 850
      ? Math.round(ext.credit_score)
      : null

  // Fallback: search transcript for spoken credit score (e.g. 720, 680, 590)
  if (creditScore === null && transcript) {
    const csMatch = transcript.match(/(?:credit\s*score|score\s*is|score\s*of)\s*(?:is\s*)?(\d{3})/i)
    if (csMatch) {
      const parsedScore = parseInt(csMatch[1], 10)
      if (parsedScore >= 300 && parsedScore <= 850) {
        creditScore = parsedScore
      }
    }
  }

  // Classification Logic:
  // 1) Explicit structured output if valid ('Hot', 'Warm', 'Cold')
  // 2) If credit score exists: >= 700 -> Hot, >= 650 -> Warm, < 650 -> Cold
  // 3) Default fallback -> Cold (if unqualified/unknown) or Warm
  let leadClassification: LeadScore
  const rawClass = str(ext.lead_classification)
  if (SCORES.includes(rawClass as LeadScore)) {
    leadClassification = rawClass as LeadScore
  } else if (creditScore !== null) {
    if (creditScore >= 700) {
      leadClassification = 'Hot'
    } else if (creditScore >= 650) {
      leadClassification = 'Warm'
    } else {
      leadClassification = 'Cold'
    }
  } else {
    // If no credit score provided, unknown caller is Cold, otherwise Warm
    leadClassification = fullName === 'Unknown Caller' ? 'Cold' : 'Warm'
  }

  const id = `NCR-${String(call.id).slice(0, 6).toUpperCase()}`

  return {
    id,
    client_info: {
      full_name: fullName,
      phone_number: phone,
      email,
      customer_status: info.customer_status === 'Existing' || ext.customer_status === 'Existing' ? 'Existing' : 'New',
    },
    lead_classification: leadClassification,
    consultation_type: consult,
    primary_service: pick(SERVICES, ext.primary_service, 'General Consultation'),
    credit_score: creditScore,
    customer_background: str(ext.customer_background),
    call_summary: summary,
    payment_status: pick(PAY, ext.payment_status, 'Pending'),
    appointment_scheduled: ext.appointment_scheduled === true || ext.appointment_scheduled === 'true',
    call_recording_url: str(call.artifact?.recordingUrl) || str(call.recordingUrl) || '',
    created_at: call.startedAt || call.createdAt || new Date().toISOString(),
    // CRM-enriched
    pipeline_stage: 'New Lead',
    requested_funding: typeof ext.requested_funding === 'number' ? ext.requested_funding : null,
    business_revenue: typeof ext.business_revenue === 'number' ? ext.business_revenue : null,
    active_ein: ext.active_ein === true || ext.active_ein === 'true',
    tradeline_goal: str(ext.tradeline_goal) || null,
    payment_link_sent: consult !== 'None',
    payment_link_sent_at: consult !== 'None' ? new Date().toISOString() : null,
    tags: fullName === 'Unknown Caller' ? ['Unqualified'] : [],
    escalated: isTony,
    escalation_reason: isTony ? 'Direct Tony ($250) owner consultation requested.' : null,
    assigned_to: isTony ? 'Tony' : 'Alex',
    duration_seconds: duration,
    urgent: isTony,
  }
}

