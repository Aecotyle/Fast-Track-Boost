// ============================================================
// Simple JSON-file backed store for leads + activity + settings.
// Persists to server/data/db.json.
// ============================================================

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

const DEFAULT_DB = {
  leads: [],
  activity: {},
  alerts: [],
  agent: {
    name: 'Alex',
    system_prompt:
      'You are Alex, the NCR Group AI voice agent. NCR Group is a premium credit repair and business/personal funding firm. Your job is to qualify callers, capture their details, explain services (Credit Repair, Tradelines, Debt Consolidation, Personal & Business Funding), and offer the paid consultations: Standard $100 and Tony Owner $250. Collect the customer full name, phone, email, credit score, customer background (business age, active EIN, monthly revenue, debt, funding goals). Classify the lead as Hot/Warm/Cold. Be professional, warm, and concise. When the caller wants to purchase a consultation, note the consultation type and mark payment status.',
    webhook_url: 'https://api.voice.example.com/webhook',
    server_url: '/api/webhook',
    business_hours: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], open: '09:00', close: '19:00', timezone: 'CST' },
    transfer_number: '(888) 711-8049',
    primary_phone: '(888) 711-8049',
    structured_output_id: 'NCR_Lead_Extraction',
  },
}

let db = null

function load() {
  if (db) return db
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
    }
  } catch {
    db = null
  }
  if (!db) {
    db = JSON.parse(JSON.stringify(DEFAULT_DB))
    persist()
  }
  return db
}

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
}

export function getDB() {
  return load()
}

export function saveDB() {
  persist()
}

export function addLead(lead) {
  const d = load()
  // upsert by id
  const idx = d.leads.findIndex((l) => l.id === lead.id)
  if (idx >= 0) d.leads[idx] = { ...d.leads[idx], ...lead }
  else d.leads.unshift(lead)
  // seed starter activity
  d.activity[lead.id] = [
    {
      id: `${lead.id}-1`, lead_id: lead.id, type: 'call', title: 'Inbound AI call',
      detail: `${lead.agent_display ?? 'Alex'} handled the inbound call and extracted lead data via structured output.`,
      timestamp: lead.created_at,
      meta: `${Math.floor((lead.duration_seconds || 0) / 60)}:${String((lead.duration_seconds || 0) % 60).padStart(2, '0')}`,
    },
  ]
  if (lead.payment_link_sent) {
    d.activity[lead.id].push({
      id: `${lead.id}-2`, lead_id: lead.id, type: 'payment', title: `Payment link sent — ${lead.consultation_type.replace('_', ' ')}`,
      detail: 'Checkout link dispatched to the customer via SMS.',
      timestamp: new Date().toISOString(), meta: 'voice/checkout',
    })
  }
  persist()
  return lead
}

export function getLeads() {
  return load().leads
}

export function getLead(id) {
  return load().leads.find((l) => l.id === id) || null
}

export function updateLead(id, patch) {
  const d = load()
  const l = d.leads.find((x) => x.id === id)
  if (!l) return null
  Object.assign(l, patch)
  persist()
  return l
}

export function getActivity(id) {
  return load().activity[id] || []
}

export function addActivity(id, event) {
  const d = load()
  if (!d.activity[id]) d.activity[id] = []
  d.activity[id].push({ id: `${id}-${Date.now()}`, lead_id: id, ...event })
  persist()
  return d.activity[id]
}

export function getAgent() {
  return load().agent
}

export function setAgent(patch) {
  const d = load()
  Object.assign(d.agent, patch)
  persist()
  return d.agent
}

export function clearLeads() {
  const d = load()
  d.leads = []
  d.activity = {}
  persist()
}
