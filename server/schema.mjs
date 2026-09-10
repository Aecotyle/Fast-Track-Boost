// ============================================================
// NCR Group — Structured Output Schema
// This JSON Schema is what you register as a Structured
// Outputs). It drives what the AI agent extracts after each call
// and delivers in the end-of-call-report webhook under
// message.artifact.structuredOutputs[<id>].result
// ============================================================

export const NCR_SCHEMA_NAME = 'NCR_Lead_Extraction'

export const NCR_STRUCTURED_OUTPUT_SCHEMA = {
  name: NCR_SCHEMA_NAME,
  type: 'ai',
  description:
    'Extract NCR Group lead data from the voice call: client contact info, lead classification, consultation type, primary service, credit score, customer background, call summary, payment status and appointment flag.',
  schema: {
    type: 'object',
    properties: {
      client_info: {
        type: 'object',
        properties: {
          full_name: { type: 'string', description: 'Customer full name' },
          phone_number: { type: 'string', description: 'Customer phone number (E.164)' },
          email: { type: 'string', format: 'email', description: 'Customer email address' },
          customer_status: { type: 'string', enum: ['New', 'Existing'], description: 'New or existing NCR customer' },
        },
        required: ['full_name', 'phone_number'],
      },
      lead_classification: {
        type: 'string',
        enum: ['Hot', 'Warm', 'Cold'],
        description: 'Caller intent score',
      },
      consultation_type: {
        type: 'string',
        enum: ['Standard_$100', 'Tony_Owner_$250', 'None'],
        description: 'Which paid consultation was purchased or requested',
      },
      primary_service: {
        type: 'string',
        enum: [
          'Personal Funding',
          'Business Funding',
          'Credit Repair',
          'Tradelines',
          'Debt Consolidation',
          'General Consultation',
        ],
      },
      credit_score: { type: 'number', minimum: 300, maximum: 850, description: 'Stated or estimated credit score' },
      customer_background: {
        type: 'string',
        description: 'Business age, active EIN, monthly revenue, debt amount, funding goals',
      },
      call_summary: { type: 'string', description: 'Concise summary of the conversation' },
      payment_status: {
        type: 'string',
        enum: ['Pending', 'Paid', 'Refunded', 'Cancelled'],
        description: 'Payment state for the consultation',
      },
      appointment_scheduled: { type: 'boolean', description: 'Whether an appointment was booked' },
    },
    required: ['client_info', 'lead_classification', 'primary_service'],
  },
}

export const PIPELINE_STAGES = [
  'New Lead',
  'AI Contacted',
  'Qualified',
  'Payment Pending',
  'Appointment Scheduled',
  'Funded / Completed',
]
