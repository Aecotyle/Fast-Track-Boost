// ============================================================
// Transform an incoming webhook (end-of-call-report with
// structuredOutputs) into a normalized NCR CRM lead record.
// ============================================================

import { PIPELINE_STAGES } from './schema.mjs'

// Simple in-process sequence for human-friendly lead IDs.
let _seq = 1000 + Math.floor(Math.random() * 400)
function storeSeq() {
  return ++_seq
}

const DEFAULT_SERVICE = 'General Consultation'
const SERVICES = [
  'Personal Funding',
  'Business Funding',
  'Credit Repair',
  'Tradelines',
  'Debt Consolidation',
  'General Consultation',
]

function pickService(v) {
  return SERVICES.includes(v) ? v : DEFAULT_SERVICE
}

function safeStr(v) {
  return typeof v === 'string' ? v : v ? String(v) : ''
}

function safeBool(v) {
  return v === true || v === 'true'
}

const NOISE = /\b(looking|calling|interested|wondering|asking|talking|try(ing)?|hoping|trying)\b/i

/** Best-effort caller name from a transcript when no structured name exists. */
function nameFromTranscript(call) {
  const t = call?.artifact?.transcript || call?.transcript || ''
  const m = t.match(/\bmy name is\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i)
  if (m) return m[1]
  const m2 = t.match(/User:\s*this is\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i)
  if (m2 && !NOISE.test(m2[1])) return m2[1]
  const m3 = t.match(/User:\s*(?:I'?m|i am)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i)
  if (m3 && !NOISE.test(m3[1])) return m3[1]
  return ''
}

/**
 * @param {object} message - the full end-of-call-report message
 * @returns normalized lead record (CRM shape)
 */
export function transformWebhook(message) {
  const call = message?.call ?? message ?? {}

  // 1) Merge the extracted structured outputs (any linked outputs) into one object.
  let extracted = {}
  const so = message?.artifact?.structuredOutputs ?? {}
  for (const data of Object.values(so)) {
    if (data && typeof data.result === 'object' && data.result !== null) {
      extracted = { ...extracted, ...data.result }
    }
  }
  // Fallback: some integrations nest under message.structuredData
  if (!Object.keys(extracted).length && message?.structuredData) {
    extracted = message.structuredData
  }

  const info = extracted.client_info ?? {}
  const classification = ['Hot', 'Warm', 'Cold'].includes(extracted.lead_classification)
    ? extracted.lead_classification
    : 'Warm'

  // Resolve caller name + email across schema shapes (client_name / full_name / name).
  const transcriptName = nameFromTranscript(call)
  const full_name =
    safeStr(info.full_name) ||
    safeStr(extracted.client_name) ||
    safeStr(extracted.full_name) ||
    safeStr(extracted.name) ||
    transcriptName ||
    'Unknown Caller'
  const email = safeStr(info.email) || safeStr(extracted.client_email) || safeStr(extracted.email)

  // consultation / payment determination
  const consult = extracted.consultation_type ?? 'None'
  let consultation_type = ['Standard_$100', 'Tony_Owner_$250', 'None'].includes(consult)
    ? consult
    : 'None'
  let payment_status = ['Pending', 'Paid', 'Refunded', 'Cancelled'].includes(extracted.payment_status)
    ? extracted.payment_status
    : 'Pending'

  // Heuristic: if a paid consultation was purchased, imply payment pending unless stated paid.
  if (consultation_type !== 'None' && extracted.payment_status === undefined) {
    payment_status = 'Pending'
  }

  const isTony = consultation_type === 'Tony_Owner_$250'

  // 2) Build the CRM record.
  const seq = storeSeq()
  const id = `NCR-${seq}`

  const lead = {
    id,
    client_info: {
      full_name,
      phone_number: safeStr(info.phone_number) || safeStr(extracted.phone_number) || safeStr(call?.customer?.number) || '',
      email,
      customer_status: info.customer_status === 'Existing' || extracted.customer_status === 'Existing' ? 'Existing' : 'New',
    },
    lead_classification: classification,
    consultation_type,
    primary_service: pickService(extracted.primary_service),
    credit_score:
      typeof extracted.credit_score === 'number' && extracted.credit_score >= 300 && extracted.credit_score <= 850
        ? Math.round(extracted.credit_score)
        : null,
    customer_background: safeStr(extracted.customer_background),
    call_summary:
      safeStr(extracted.call_summary) ||
      (call?.artifact?.transcript || call?.transcript || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500) ||
      (full_name !== 'Unknown Caller'
        ? `Call with ${full_name}.`
        : `Inbound call captured.${call?.endedReason ? ' Ended: ' + call.endedReason + '.' : ''}`),
    payment_status,
    appointment_scheduled: safeBool(extracted.appointment_scheduled),
    call_recording_url: safeStr(call?.artifact?.recordingUrl) || safeStr(call?.recordingUrl) || '',
    created_at: call?.startedAt || call?.createdAt || new Date().toISOString(),
    // --- CRM-enriched fields ---
    pipeline_stage: 'New Lead',
    requested_funding:
      typeof extracted.requested_funding === 'number' ? extracted.requested_funding : null,
    business_revenue:
      typeof extracted.business_revenue === 'number' ? extracted.business_revenue : null,
    active_ein: safeBool(extracted.active_ein),
    tradeline_goal: safeStr(extracted.tradeline_goal) || null,
    payment_link_sent: consultation_type !== 'None',
    payment_link_sent_at: consultation_type !== 'None' ? new Date().toISOString() : null,
    tags: [],
    escalated: isTony,
    escalation_reason: isTony
      ? 'Direct Tony ($250) owner consultation requested.'
      : null,
    assigned_to: isTony ? 'Tony' : 'Alex',
    duration_seconds: Math.max(1, Math.round((call?.endedAt && call?.startedAt
      ? (new Date(call.endedAt) - new Date(call.startedAt)) / 1000
      : 0) / 1) || 0),
    urgent: isTony,
  }

  // tag derivation
  const tags = []
  if (isTony) tags.push('Direct Tony')
  if (lead.lead_classification === 'Hot') tags.push('High Intent')
  if (lead.primary_service === 'Credit Repair' || lead.primary_service === 'Tradelines') tags.push('Credit Program')
  if (lead.primary_service === 'Business Funding') tags.push('Business')
  if (lead.client_info.customer_status === 'Existing') tags.push('Returning')
  lead.tags = tags

  return lead
}

/** Adapt a raw Vapi call object (from GET /call) into a lead record. */
export function transformVapiCall(call) {
  return transformWebhook({ call, artifact: call?.artifact ?? {} })
}

export { PIPELINE_STAGES }
