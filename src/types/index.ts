// ============================================================
// NCR Group CRM — Core Type Definitions
// Mirrors the AI Voice Agent webhook payload schema.
// ============================================================

export type CustomerStatus = 'New' | 'Existing'
export type LeadScore = 'Hot' | 'Warm' | 'Cold'
export type ConsultationType = 'Standard_$100' | 'Tony_Owner_$250' | 'None'
export type PrimaryService =
  | 'Personal Funding'
  | 'Business Funding'
  | 'Credit Repair'
  | 'Tradelines'
  | 'Debt Consolidation'
  | 'General Consultation'
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded' | 'Cancelled'

export type PipelineStage =
  | 'New Lead'
  | 'AI Contacted'
  | 'Qualified'
  | 'Payment Pending'
  | 'Appointment Scheduled'
  | 'Funded / Completed'

export interface Lead {
  id: string
  client_info: {
    full_name: string
    phone_number: string
    email: string
    customer_status: CustomerStatus
  }
  lead_classification: LeadScore
  consultation_type: ConsultationType
  primary_service: PrimaryService
  credit_score: number | null
  customer_background: string
  call_summary: string
  payment_status: PaymentStatus
  appointment_scheduled: boolean
  call_recording_url: string
  created_at: string // ISO timestamp
  // --- CRM enriched fields (derived / managed by NCR staff) ---
  pipeline_stage: PipelineStage
  requested_funding: number | null
  business_revenue: number | null
  active_ein: boolean
  tradeline_goal: string | null
  payment_link_sent: boolean
  payment_link_sent_at: string | null
  tags: string[]
  escalated: boolean
  escalation_reason: string | null
  assigned_to: 'Alex' | 'Tony' | 'NCR Team'
  duration_seconds: number
  // dynamic real-time signals (simulated)
  urgent: boolean
}

export interface ActivityEvent {
  id: string
  lead_id: string
  type:
    | 'call'
    | 'sms'
    | 'payment'
    | 'status'
    | 'note'
    | 'appointment'
  title: string
  detail: string
  timestamp: string
  meta?: string
}

export interface DateRangeFilter {
  key: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'custom'
  label: string
  from: Date | null
  to: Date | null
}

export interface AlertItem {
  id: string
  kind:
    | 'urgent_escalation'
    | 'unpaid_24h'
    | 'high_intent'
    | 'direct_tony'
    | 'payment_received'
  lead_id: string
  lead_name: string
  message: string
  created_at: string
  read: boolean
}
