// ============================================================
// Webhook SIMULATOR — dev/test tool that constructs realistic
// end-of-call-report payloads (with structuredOutputs) and
// POSTs them to the same webhook endpoint the real integration
// uses. This is a testing utility, NOT seeded production data.
// ============================================================

import { NCR_SCHEMA_NAME } from './schema.mjs'

const NAMES = [
  'Marcus Reed', 'Danielle Brooks', 'Sofia Martinez', 'Terrence Jackson',
  'Priya Sharma', 'Evelyn Grant', 'Omar Farouk', 'Grace Liu',
  'James Osei', 'Aaliyah Williams', 'Robert Kim', 'Nina Alvarez',
]
const SERVICES = [
  'Personal Funding', 'Business Funding', 'Credit Repair', 'Tradelines',
  'Debt Consolidation', 'General Consultation',
]
const CONSULTS = ['None', 'Standard_$100', 'Tony_Owner_$250']
const SCORES = [null, 582, 615, 648, 673, 690, 702, 601, 634, 645]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export function buildSimulatedPayload(index = 0) {
  const fullName = NAMES[index % NAMES.length]
  const service = pick(SERVICES)
  const consult = pick(CONSULTS)
  const isTony = consult === 'Tony_Owner_$250'
  const hot = service === 'Business Funding' || isTony
  const classification = hot ? 'Hot' : Math.random() > 0.5 ? 'Warm' : 'Cold'
  const score = pick(SCORES)
  const now = Date.now()
  const startedAt = new Date(now - (Math.floor(Math.random() * 40) + 3) * 60 * 1000).toISOString()
  const endedAt = new Date(now).toISOString()
  const callId = `call_${Math.random().toString(36).slice(2, 12)}`

  const amount = service === 'Business Funding' ? 25000 + Math.floor(Math.random() * 12) * 5000 : 10000 + Math.floor(Math.random() * 6) * 5000

  const background =
    service === 'Business Funding'
      ? `LLC formed ${Math.floor(Math.random() * 24) + 6} months ago. Active EIN, ~$${Math.floor(Math.random() * 50 + 20)}k/mo revenue. Seeking $${amount.toLocaleString()} in working capital.`
      : service === 'Credit Repair' || service === 'Tradelines'
      ? `Wants to raise score from ${score ?? 'mid-600s'} toward 680 for financing. $${Math.floor(Math.random() * 30 + 8)}k total debt across accounts.`
      : service === 'Debt Consolidation'
      ? `Consolidating $${Math.floor(Math.random() * 120 + 30)}k in high-interest debt to lower monthly payments.`
      : `Exploring ${service} options to reach a ${service.includes('Personal') ? 'personal funding' : 'credit'} goal.`

  const summary =
    `${fullName.split(' ')[0]} reached out about ${service.toLowerCase()}. ` +
    `Voice agent captured contact details and background. ` +
    (isTony
      ? `Upgraded to the direct Tony Owner ($250) consultation for a hands-on strategy session. `
      : consult === 'Standard_$100'
      ? `Selected the Standard ($100) consultation to move forward. `
      : `No paid consultation purchased yet — flagged for follow-up. `) +
    `Lead classified as ${classification}.`

  const payment_status = consult === 'None' ? 'Cancelled' : Math.random() > 0.6 ? 'Paid' : 'Pending'

  const result = {
    client_info: {
      full_name: fullName,
      phone_number: `+1${Math.floor(Math.random() * 7000000000 + 2000000000)}`,
      email: `${fullName.split(' ')[0].toLowerCase()}.${fullName.split(' ')[1].toLowerCase()}@example.com`,
      customer_status: Math.random() > 0.8 ? 'Existing' : 'New',
    },
    lead_classification: classification,
    consultation_type: consult,
    primary_service: service,
    credit_score: score,
    customer_background: background,
    call_summary: summary,
    payment_status,
    appointment_scheduled: consult !== 'None' && Math.random() > 0.5,
    requested_funding: service === 'Business Funding' || service === 'Personal Funding' ? amount : null,
    business_revenue: service === 'Business Funding' ? Math.floor(Math.random() * 50 + 20) * 1000 : null,
    active_ein: service === 'Business Funding',
    tradeline_goal: service === 'Credit Repair' || service === 'Tradelines' ? 'Reach 680 for mortgage qualification' : null,
  }

  return {
    message: {
      type: 'end-of-call-report',
      endedReason: 'customer-ended-call',
      call: {
        id: callId,
        startedAt,
        endedAt,
        customer: { number: result.client_info.phone_number },
        artifact: { recordingUrl: `https://cdn.ncrgroup.com/audio/${callId}.mp3` },
      },
      artifact: {
        structuredOutputs: {
          [NCR_SCHEMA_NAME]: {
            name: NCR_SCHEMA_NAME,
            result,
          },
        },
      },
    },
  }
}
