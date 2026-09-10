# NCR Group — AI CRM Dashboard

A production-grade, responsive **Metallic Tech Dark Mode** CRM for NCR Group (credit repair & funding firm), powered by a **live AI voice-agent webhook pipeline**. React (Vite) + Tailwind CSS v4 + TypeScript + Zustand + Lucide icons.

> ⚠️ **No seeded/mock leads.** The app starts empty. Data flows in **only** through the `end-of-call-report` webhook (or the dev **Webhook Simulator** on the AI Agent page, which pushes realistic payloads through the *real* pipeline — it's a testing tool, not pre-seeded data).

---

## Architecture

```
ncr-crm/
├── server/                  Express backend (Node ESM)
│   ├── index.mjs            REST + webhook endpoints
│   ├── schema.mjs           Structured Output JSON Schema
│   ├── transform.mjs        webhook payload → normalized lead record
│   ├── store.mjs            JSON-file persistence (server/data/db.json)
│   └── simulator.mjs        dev/test tool — realistic webhook payload builder
├── src/
│   ├── api/client.ts        typed fetch wrapper for the backend
│   ├── store/useCRM.ts      Zustand store (state + live refresh + alerts)
│   ├── types/index.ts       lead + activity + alert type definitions
│   ├── utils/               formatting, date-range filters, CSV/XLSX/PDF export
│   ├── components/          layout, ui primitives, dashboard, leads, lead, notifications, agent
│   └── pages/               Dashboard, Leads, LeadDetail, Notifications, AgentSettings
└── vite.config.ts           dev proxy /api → :4000
```

---

## Structured Output Integration

1. **Register the schema** (`src`/`server/schema.mjs` — served at `GET /api/schema`) in
   **Structured Outputs**. It defines `client_info`, `lead_classification`,
   `consultation_type`, `primary_service`, `credit_score`, `customer_background`,
   `call_summary`, `payment_status`, `appointment_scheduled`.
2. **Attach it** to your assistant via `artifactPlan.structuredOutputIds`.
3. **Point the webhook URL** to `POST /api/webhook` (configured on the AI Agent page).
4. The voice platform sends `end-of-call-report` messages; `message.artifact.structuredOutputs[<id>].result`
   holds the extracted JSON. The backend transforms it into a lead and persists it.
5. Call recordings are retrieved **server-side** with your private key (never exposed to the browser) — see the call artifacts guide.

---

## Run it

```bash
# dev (two processes)
npm run dev:server   # API + webhook on :4000
npm run dev          # Vite app on :5173 (proxies /api → :4000)

# production
npm run build
npm start            # serves API + built app on :4000
```

## Features

- **Dashboard** — KPI cards (calls, qualified, pending payments, revenue, conversion) with
  comparison deltas, date-range picker (Today / Yesterday / 7d / 30d / This Month / Custom),
  pipeline funnel, service distribution, and filterable recent-activity table.
- **Leads** — drag-and-drop **Kanban** pipeline (New Lead → AI Contacted → Qualified →
  Payment Pending → Appointment Scheduled → Funded/Completed) + detailed **table view**,
  CSV / Excel / PDF export, search & tag/score/service filters.
- **Lead Profile** — call audio player, AI call summary, qualification metrics, payment &
  Stripe timeline, stage stepper, escalation toggle, activity & SMS logs.
- **Notifications** — bell with live badges (urgent escalations, unpaid >24h links,
  high-intent calls, Direct Tony $250 requests), deep-linking to lead records.
- **AI Agent Settings** — edit 'Alex' system prompt, webhook endpoint, business hours
  (Mon–Sat 9AM–7PM CST), transfer rules ((888) 711-8049), and the **Webhook Simulator**.

## Design tokens

Canvas `#0F1115` · Surface `#181820` · Edge `#3A3F47` · Metal `#B8C2CC→#4A525D`
with silver focus glow `#E2E8F0`, geometric facet overlay, and skeleton loaders.
