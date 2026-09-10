// ============================================================
// NCR Group CRM — API Server
// - POST /api/webhook   → ingest end-of-call-report
// - CRUD for leads, activity, agent settings, alerts
// - GET  /api/simulate/:n    → build a realistic webhook payload
// ============================================================

import express from 'express'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { transformWebhook, transformVapiCall } from './transform.mjs'
import * as store from './store.mjs'
import { NCR_STRUCTURED_OUTPUT_SCHEMA } from './schema.mjs'
import { buildSimulatedPayload } from './simulator.mjs'
import { voice } from './voice.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const PORT = process.env.PORT || 4000

// ---------- Webhook ingestion ----------
app.post('/api/webhook', (req, res) => {
  const body = req.body || {}
  const message = body.message || body
  // Acknowledge non end-of-call messages immediately.
  if (message.type && message.type !== 'end-of-call-report') {
    return res.json({ ok: true, skipped: message.type })
  }
  const lead = transformWebhook(message)
  store.addLead(lead)
  res.status(201).json({ ok: true, lead })
})

// ---------- Voice platform proxy (key stays server-side) ----------
app.get('/api/calls', async (_req, res) => {
  try {
    const calls = await voice.listCalls(20)
    res.json(calls)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
app.get('/api/calls/:id', async (req, res) => {
  try {
    const call = await voice.getCall(req.params.id)
    res.json(call)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
app.get('/api/calls/:id/recording', async (req, res) => {
  try {
    const url = await voice.recordingUrl(req.params.id, req.query.channel || 'mono')
    res.json({ url })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})
// convenience: is the key configured? (never returns the key itself)
app.get('/api/voice/status', (_req, res) =>
  res.json({ configured: Boolean(process.env.VOICE_API_KEY) }))

// Fetch Vapi calls that have structured-output data, transformed into leads.
// The frontend hits this same-origin route (browser never holds the key).
app.get('/api/vapi-leads', async (_req, res) => {
  try {
    const calls = await voice.getStructuredCalls()
    const leads = calls.map(transformVapiCall)
    res.json(leads)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ---------- Leads ----------
app.get('/api/leads', (_req, res) => res.json(store.getLeads()))
app.get('/api/leads/:id', (req, res) => {
  const lead = store.getLead(req.params.id)
  return lead ? res.json(lead) : res.status(404).json({ error: 'not found' })
})
app.patch('/api/leads/:id', (req, res) => {
  const updated = store.updateLead(req.params.id, req.body)
  return updated ? res.json(updated) : res.status(404).json({ error: 'not found' })
})
app.delete('/api/leads', (_req, res) => {
  store.clearLeads()
  res.json({ ok: true })
})

// ---------- Activity ----------
app.get('/api/leads/:id/activity', (req, res) =>
  res.json(store.getActivity(req.params.id)))

// ---------- Agent settings ----------
app.get('/api/agent', (_req, res) => res.json(store.getAgent()))
app.patch('/api/agent', (req, res) => res.json(store.setAgent(req.body)))

// ---------- Structured output schema (for Agent page) ----------
app.get('/api/schema', (_req, res) => res.json(NCR_STRUCTURED_OUTPUT_SCHEMA))

// ---------- Simulator ----------
app.get('/api/simulate', (_req, res) => res.json(buildSimulatedPayload(0)))
app.get('/api/simulate/:n', (req, res) =>
  res.json(buildSimulatedPayload(parseInt(req.params.n || '0', 10) || 0)))

// ---------- Serve built frontend (production) ----------
const DIST = path.join(__dirname, '..', 'dist')
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST))
  // Express 5 / path-to-regexp v8 requires a named wildcard, not bare '*'
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(DIST, 'index.html')))
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[ncr-crm] API server on http://0.0.0.0:${PORT}`)
})
