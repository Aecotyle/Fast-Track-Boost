import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell,
} from 'recharts'
import { Lead } from '../../types'

const GRID = '#262b33'
const CALLS = '#5aa8ff'

/** Reads the active theme accent from CSS for SVG stroke/fill. */
function useAccent(): string {
  const [accent, setAccent] = useState('#e5c06b')
  useEffect(() => {
    const update = () => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim()
      if (v) setAccent(v)
    }
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return accent
}

const SCORE_COLORS: Record<string, string> = {
  Hot: '#ff5c70',
  Warm: '#ffb84d',
  Cold: '#5aa8ff',
}

const tooltipStyle = {
  background: '#181820',
  border: '1px solid #3a3f47',
  borderRadius: 12,
  fontSize: 12,
  color: '#fff',
  boxShadow: '0 12px 40px -12px rgba(0,0,0,0.7)',
}

/** Build daily series from leads for a date range. */
export function buildTrendSeries(leads: Lead[], days: number) {
  const out: { day: string; revenue: number; calls: number }[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = d.toDateString()
    out.push({
      day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: 0,
      calls: 0,
    })
    // eslint-disable-next-line no-loop-func
    leads.forEach((l) => {
      if (new Date(l.created_at).toDateString() === key) {
        out[out.length - 1].calls++
        if (l.payment_status === 'Paid') {
          out[out.length - 1].revenue +=
            l.consultation_type === 'Tony_Owner_$250' ? 250 : l.consultation_type === 'Standard_$100' ? 100 : 0
        }
      }
    })
  }
  return out
}

export function buildScoreData(leads: Lead[]) {
  const map: Record<string, number> = { Hot: 0, Warm: 0, Cold: 0 }
  leads.forEach((l) => { map[l.lead_classification] = (map[l.lead_classification] || 0) + 1 })
  return ['Hot', 'Warm', 'Cold'].map((k) => ({ name: k, value: map[k] })).filter((d) => d.value > 0)
}

export function RevenueTrendChart({ leads, days }: { leads: Lead[]; days: number }) {
  const accent = useAccent()
  const data = buildTrendSeries(leads, days)
  const hasRevenue = data.some((d) => d.revenue > 0)
  return (
    <div className="h-56 w-full">
      {data.length === 0 || (!hasRevenue && days > 30) ? (
        <div className="flex h-full items-center justify-center text-sm text-secondary-text">No revenue data in this range.</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.5} />
                <stop offset="100%" stopColor={accent} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v, name) => {
                const n = Number(v ?? 0)
                return [name === 'revenue' ? `$${n}` : n, name === 'revenue' ? 'Revenue' : 'Calls']
              }}
            />
            <Area type="monotone" dataKey="revenue" stroke={accent} strokeWidth={2.5} fill="url(#rev)" />
            <Area type="monotone" dataKey="calls" stroke={CALLS} strokeWidth={1.5} fill="transparent" opacity={0.7} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ScoreDonut({ leads }: { leads: Lead[] }) {
  const data = buildScoreData(leads)
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="relative h-52 w-full">
      {total === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-secondary-text">No classified calls yet.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie
                data={data} dataKey="value" nameKey="name"
                innerRadius="62%" outerRadius="88%" paddingAngle={3} cornerRadius={6} strokeWidth={0}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={SCORE_COLORS[d.name]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="metal-text text-3xl font-extrabold">{total}</div>
            <div className="text-[11px] uppercase tracking-wider text-secondary-text">classified</div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-4 text-xs">
            {data.map((d) => (
              <span key={d.name} className="flex items-center gap-1.5 text-secondary-text">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SCORE_COLORS[d.name] }} />
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
