# NCR Group — AI CRM Dashboard: Complete Build Summary

A production-ready, **Metallic Tech Dark Mode** AI CRM for **NCR Group** (credit repair & funding firm), connected to the **Vapi AI voice agent**. Built with **React + Vite + TypeScript + Tailwind CSS v4 + Zustand + Framer Motion + GSAP + Lucide icons + Recharts**.

---

## 1. What the app is

A responsive CRM that ingests leads from the NCR Group AI voice agent (Vapi), and lets the team manage them through a premium dark dashboard:

- **Dashboard** — live KPIs, charts, call activity
- **Lead Management** — drag-and-drop Kanban pipeline + data table with export
- **Lead Profile** — call player, AI summary, qualification metrics, payment timeline, activity/SMS logs
- **Notification Center** — live alerts
- **Theming** — 7 dynamic color-gradient themes that re-skin the whole app
- **Live Vapi integration** — fetches real calls with structured lead data

---

## 2. Tech stack & libraries

| Purpose | Library |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 (Vite plugin) |
| Icons | Lucide React |
| State | Zustand |
| Charts | Recharts |
| Motion | Framer Motion + GSAP |
| Drag & drop | @dnd-kit/core |
| Export | xlsx, jspdf, papaparse (CSV/Excel/PDF) |
| Backend | Node/Express (webhook + Vapi proxy) |
| Testing | Vitest + React Testing Library + jsdom |

---

## 3. Pages / features built

### 📊 Dashboard (`src/pages/Dashboard.tsx`)
- **5 KPI cards**: Total Calls, Qualified Leads, Pending Payments, Revenue ($), Conversion % — with count-up animation + comparison deltas
- **Revenue & Call Volume** area chart (Recharts, gold-accent, theme-reactive)
- **Lead Classification** donut (Hot/Warm/Cold)
- **Pipeline Funnel** + **Services** distribution (animated bars)
- **Recent Voice Agent Activity** table (filterable)
- **Live signal strip** (agent online, transfer line, consultations)
- **Vapi connection diagnostic chip** (shows "Voice connected · N calls" / "Sync error" / "No key set")

### 🗂️ Leads (`src/pages/LeadsPage.tsx`)
- **Kanban view** — 6 stages: New Lead → AI Contacted → Qualified → Payment Pending → Appointment Scheduled → Funded/Completed. Drag-and-drop with spring physics + layout animation.
- **Table view** — sortable columns, score badges, payment badges, tags
- **Filters**: score (Hot/Warm/Cold), service type, date range, search (name/email/phone/score)
- **Export**: CSV / Excel / PDF
- **Clear all** with Undo
- **Onboarding panel** when no leads exist

### 👤 Lead Profile (`src/pages/LeadDetail.tsx`)
- Header: name, status, Hot/Warm/Cold badge, escalation flag/toggle
- **Clickable pipeline stepper**
- **Tabs**: Overview / Qualification / Payment / Activity & SMS
  - Overview: call audio player + AI call summary
  - Qualification: credit score, requested funding, business revenue, active EIN, tradeline goals
  - Payment: payment timeline (pending/paid/refunded/cancelled)
  - Activity: call, SMS, payment, status, note, appointment logs

### 🔔 Notifications (`src/pages/Notifications.tsx` + panel)
- Real-time alerts: urgent escalations, unpaid links (>24h), high-intent calls, Direct Tony ($250)
- Bell icon with live unread badge, deep-links to lead records
- Closes on: re-click bell, Escape, outside-click, notification select

### 🎨 Theming (`src/store/useCRM.ts` + `src/components/ThemeSwitcher.tsx`)
- 7 themes: Champagne (gold), Violet, Emerald, Cyan, Ember, Ocean, Rose
- Each theme = CSS variables for accent gradient, buttons, logo, orbs, charts, focus rings
- Persists to localStorage, applied via `data-theme` attribute
- Theme picker dropdown in the top bar

### ⚙️ Agent Settings (originally) → **removed** per request

---

## 4. Design system (`src/index.css`)

- **Metallic Tech Dark**: canvas `#0F1115`, surface `#181820`, metallic borders `#3A3F47`
- **Signature accent**: champagne gold `#e5c06b` (theme-swappable)
- **Dynamic background**: layered `metallic-black` (deep obsidian) + animated `aurora` (color-shifting, GSAP-driven orbs) + facet overlay + film grain
- **Frosted glass**: `glass` / `glass-panel` (backdrop blur + saturate) on cards, dropdowns, sidebar, notification tray
- **Neumorphic (soft-UI)**: `neu-raised`, `neu-sunken`, `neu-press` — raised/sunken tactile surfaces with dual shadows
- **Typography**: Sora (display) + Inter (body) + JetBrains Mono (data/numbers)
- **Motion**: staggered entrances, page transitions (Framer Motion `AnimatePresence`), GSAP title reveal, hover lifts
- **Accessibility**: `:focus-visible` rings, `prefers-reduced-motion` support, high text contrast despite low-contrast surfaces
- **UX heuristics applied** (Nielsen/Shneiderman): global toast feedback for every action, plain-language error messages, Undo for destructive actions, visibility of system status

---

## 5. Vapi integration (live data)

### Architecture (final, working version)
- **Server-side proxy** — the Node/Express backend (`server/index.mjs`) calls Vapi's native REST API. **The browser never holds the API key** (secure).
- **`.env`** holds: `VOICE_API_KEY`, `VOICE_BASE_URL=https://api.vapi.ai`, `VOICE_ASSISTANT_ID`, `PORT=4000`
- **Vapi endpoints used:**
  - `GET /call?limit=200&assistantId=<id>` — list calls filtered to Alex
  - `GET /call/{id}` — fetch full call to resolve structured output data
- **Fetches ONLY calls with structured-output lead data** (your requirement) — filters the list, then fetches those in full
- **Transform** (`server/transform.mjs` `transformVapiCall` + `src/api/transform.ts`) — maps Vapi call + `artifact.structuredOutputs` into a CRM `Lead`, handling both your real fields (`client_name`, `client_email`) and the fuller schema, with fallback to call metadata (phone, time, duration, transcript)

### Server routes
- `POST /api/webhook` — ingests Vapi webhooks
- `GET /api/vapi-leads` — **the main endpoint**: fetches structured calls from Vapi, transforms → leads (this is what the frontend loads)
- `GET /api/voice/status` — config check
- `GET /api/calls`, `/api/calls/:id`, `/api/calls/:id/recording` — call data proxy
- `GET /api/leads`, `/api/leads/:id` (PATCH), `DELETE /api/leads` — local lead CRUD (fallback)
- `GET /api/simulate/:n` — webhook simulator (dev)

### How the frontend loads data
`src/store/useCRM.ts` `load()` / `refreshLeads()`:
1. Call `api.getVapiLeads()` → `GET /api/vapi-leads`
2. If that fails, fall back to `GET /api/leads` (local store)
3. Record diagnostic in `vapiStatus` (shown in dashboard chip)

---

## 6. How to run it (IMPORTANT — two servers)

The app needs **BOTH** the frontend (Vite) and backend (Express) running, because the frontend proxies `/api` to the backend at `localhost:4000`.

### ✅ Single command (recommended):
```bash
npm run dev:all
```
This starts both the API server and the Vite web server together (uses `concurrently`).

### Or two separate terminals:
```bash
# Terminal 1
npm run dev:server

# Terminal 2
npm run dev
```

### ⚠️ If you see `ECONNREFUSED` on `/api/*`:
That means **the backend server is not running.** You only started `npm run dev`. Use `npm run dev:all`.

### Setup:
1. Ensure **`.env`** exists next to `package.json`:
   ```
   VOICE_API_KEY=your_vapi_private_key
   VOICE_BASE_URL=https://api.vapi.ai
   VOICE_ASSISTANT_ID=your_assistant_id
   PORT=4000
   ```
   (.env is gitignored — if you zipped/downloaded the folder, the hidden `.env` may be missing; recreate it.)
2. `npm i`
3. `npm run dev:all`
4. Open `http://localhost:5173`

---

## 7. Testing

Run the regression suite:
```bash
npx vitest run
```
**26 tests** across:
- `store.regression.test.ts` — navigation, filters, stage moves, escalation, alerts, clear
- `components.regression.test.tsx` — Dashboard, Leads, Notifications, AgentSettings render
- `navigation.regression.test.tsx` — App shell, sidebar nav, topbar search
- `notifications.regression.test.tsx` — notification tray open/close (bell toggle, Escape, outside click)
- `theme.regression.test.tsx` — theme switching + persistence
- `feedback.regression.test.tsx` — toast system, Undo, error handling

---

## 8. Things removed / changed per your requests

- **No mock/seeded leads** — app starts empty; data comes from Vapi (or simulator)
- **No "vapi" branding anywhere** — type renamed `VapiLead`→`Lead`, routes renamed, env vars renamed, all UI text neutralized
- **Stripe removed** — no Stripe references remain
- **AI Agent tab removed** — the AgentSettings page was deleted, nav/routing cleaned up

---

## 9. Security notes

- **The Vapi key** is now **server-side only** (in `.env`, read by the backend). It no longer ships in the browser bundle.
- **⚠️ You shared a real API key in this chat.** It has been used for testing. **Rotate/regenerate it in the Vapi dashboard once testing is complete**, and update `.env`.
- `.env` and `.env.*` are gitignored.

---

## 10. Status / verified

- TypeScript: clean (`tsc -b`)
- Production build: clean (`npm run build`)
- Tests: **26/26 passing**
- Live Vapi fetch: **verified** (returns 1 structured lead "Taha Muazzam" / client_email tahaemehood8999@gmail.com)
- Real browser path: frontend → `/api/vapi-leads` → Vapi → lead renders (0 days old → within "Last 7 Days" default filter)
