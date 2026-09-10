import { useMemo, useRef, useState } from 'react'
import { Bell, Menu, Search, RefreshCw, ChevronDown, CalendarRange } from 'lucide-react'
import { useCRM } from '../../store/useCRM'
import { DATE_PRESETS, resolveBounds } from '../../utils/dateRange'
import { DateRangeFilter } from '../../types'
import { MobileDrawer } from './Sidebar'
import NotificationPanel from '../notifications/NotificationPanel'
import ThemeSwitcher from '../ThemeSwitcher'

export default function Topbar() {
  const alerts = useCRM((s) => s.alerts)
  const refreshLeads = useCRM((s) => s.refreshLeads)
  const dateFilter = useCRM((s) => s.dateFilter)
  const setDateFilter = useCRM((s) => s.setDateFilter)
  const search = useCRM((s) => s.search)
  const setSearch = useCRM((s) => s.setSearch)
  const navigate = useCRM((s) => s.navigate)

  const unread = alerts.filter((a) => !a.read).length
  const [mobileNav, setMobileNav] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const navigateFromPanel = (view: string, leadId: string) => navigate(view as never, leadId || undefined)

  const bellRef = useRef<HTMLButtonElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)

  const boundsLabel = useMemo(() => {
    const { from, to } = resolveBounds(dateFilter)
    return `${new Date(from).toLocaleDateString()} – ${new Date(to).toLocaleDateString()}`
  }, [dateFilter])

  const applyPreset = (p: DateRangeFilter) => {
    if (p.key === 'custom') {
      setDateOpen(true)
      return
    }
    setDateFilter(p)
    setDateOpen(false)
  }

  const applyCustom = () => {
    if (customFrom && customTo) {
      setDateFilter({
        key: 'custom',
        label: 'Custom Range',
        from: new Date(customFrom),
        to: new Date(customTo),
      })
      setDateOpen(false)
    }
  }

  return (
    <>
      <header className="glass relative z-30 flex items-center gap-3 border-b border-edge2 px-4 py-3 sm:px-6">
        {/* Mobile menu */}
        <button
          onClick={() => setMobileNav(true)}
          className="rounded-lg p-2.5 text-secondary-text hover:bg-white/5 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <div className="relative hidden min-w-0 flex-1 max-w-md items-center sm:flex">
          <Search size={16} className="pointer-events-none absolute left-3.5 text-secondary-text" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, score…"
            className="input h-11 w-full pl-10 pr-4 text-sm"
          />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* Theme switcher */}
          <ThemeSwitcher />

          {/* Date filter */}
          <div className="relative" ref={dateRef}>
            <button
              onClick={() => setDateOpen((o) => !o)}
              className="neu-raised neu-press flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-silver"
            >
              <CalendarRange size={16} className="hidden sm:block" />
              <span className="hidden md:inline">{dateFilter.label}</span>
              <span className="text-secondary-text md:hidden">Date</span>
              <ChevronDown size={14} className="text-secondary-text" />
            </button>
            {dateOpen && (
              <div className="draw-in glass-panel absolute right-0 top-[52px] z-40 w-64 rounded-2xl p-2">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p)}
                    className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                      dateFilter.key === p.key ? 'bg-white/10 text-white' : 'text-secondary-text hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
                <div className="mt-2 border-t border-edge2 px-1 pt-2">
                  <div className="mb-2 text-xs text-secondary-text">{boundsLabel}</div>
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="input h-10 px-2 text-xs"
                    />
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="input h-10 px-2 text-xs"
                    />
                    <button onClick={applyCustom} className="metal-btn h-10 rounded-lg text-sm font-bold">
                      Apply Range
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => refreshLeads()}
            className="neu-raised neu-press flex h-11 w-11 items-center justify-center rounded-xl text-secondary-text hover:text-white"
            aria-label="Refresh data"
          >
            <RefreshCw size={17} />
          </button>

          {/* Bell */}
          <button
            ref={bellRef}
            data-notif-trigger
            onClick={() => setNotifOpen((o) => !o)}
            className={`neu-raised neu-press relative flex h-11 w-11 items-center justify-center rounded-xl text-secondary-text hover:text-white ${notifOpen ? 'neu-sunken text-white' : ''}`}
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="gold-btn absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-extrabold text-[var(--btn-text)]">
                {unread}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile search row */}
      <div className="flex items-center gap-2 border-b border-edge2 bg-surface/40 px-4 py-2 sm:hidden">
        <Search size={15} className="text-secondary-text" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads…"
          className="input h-11 w-full flex-1 px-3 text-sm"
        />
      </div>

      <MobileDrawer open={mobileNav} onClose={() => setMobileNav(false)} />
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} onNavigate={navigateFromPanel} />
    </>
  )
}
