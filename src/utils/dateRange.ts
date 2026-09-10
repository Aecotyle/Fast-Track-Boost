import { DateRangeFilter } from '../types'

export const DATE_PRESETS: DateRangeFilter[] = [
  { key: 'today', label: 'Today', from: null, to: null },
  { key: 'yesterday', label: 'Yesterday', from: null, to: null },
  { key: '7d', label: 'Last 7 Days', from: null, to: null },
  { key: '30d', label: 'Last 30 Days', from: null, to: null },
  { key: 'month', label: 'This Month', from: null, to: null },
  { key: 'custom', label: 'Custom Range', from: null, to: null },
]

export function resolveBounds(f: DateRangeFilter): { from: number; to: number } {
  const now = new Date()
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const endOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime()

  switch (f.key) {
    case 'today':
      return { from: startOfDay(now), to: now.getTime() }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { from: startOfDay(y), to: endOfDay(y) }
    }
    case '7d': {
      const d = new Date(now); d.setDate(d.getDate() - 6)
      return { from: startOfDay(d), to: now.getTime() }
    }
    case '30d': {
      const d = new Date(now); d.setDate(d.getDate() - 29)
      return { from: startOfDay(d), to: now.getTime() }
    }
    case 'month': {
      const m = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: startOfDay(m), to: now.getTime() }
    }
    case 'custom': {
      if (f.from && f.to) return { from: startOfDay(f.from), to: endOfDay(f.to) }
      return { from: startOfDay(now), to: now.getTime() }
    }
  }
}

export function applyDateFilter<T extends { created_at: string }>(
  leads: T[],
  f: DateRangeFilter,
): T[] {
  const { from, to } = resolveBounds(f)
  return leads.filter((l) => {
    const t = new Date(l.created_at).getTime()
    return t >= from && t <= to
  })
}
