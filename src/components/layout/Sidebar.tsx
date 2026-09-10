import {
  LayoutDashboard, Users, Bell, X, FileText,
} from 'lucide-react'
import { useCRM, View } from '../../store/useCRM'

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'leads', label: 'Leads', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function Sidebar() {
  const view = useCRM((s) => s.view)
  const navigate = useCRM((s) => s.navigate)
  const alerts = useCRM((s) => s.alerts)
  const unread = alerts.filter((a) => !a.read).length

  const Item = ({ item }: { item: (typeof NAV)[number] }) => {
    const active = view === item.id
    const Icon = item.icon
    return (
      <button
        onClick={() => navigate(item.id)}
        className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-200 ${
          active
            ? 'neu-sunken text-[var(--accent-1)] ring-1 ring-inset ring-[var(--accent)]/40'
            : 'text-secondary-text hover:bg-white/5 hover:text-white'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
        )}
        <Icon size={20} strokeWidth={active ? 2.4 : 2} className={active ? 'text-[var(--accent)]' : ''} />
        <span className="font-display text-[15px] font-semibold">{item.label}</span>
        {item.id === 'notifications' && unread > 0 && (
          <span
            className={`ml-auto flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
              active ? 'bg-[var(--accent)] text-[var(--btn-text)]' : 'gold-btn'
            }`}
          >
            {unread}
          </span>
        )}
      </button>
    )
  }

  return (
    <aside className="glass-panel hidden w-[248px] shrink-0 flex-col border-r border-edge2 p-4 lg:flex">
      <Logo />
      <nav className="mt-6 flex flex-col gap-1.5">
        {NAV.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </nav>

      <div className="relative mt-auto overflow-hidden rounded-2xl neu-raised p-4">
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--accent)]/15 blur-2xl" />
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3ddc84] opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#3ddc84]" />
          </span>
          <span className="font-display text-sm font-semibold text-silver">Alex · Online</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-secondary-text">
          WALL STREET voice agent is live and taking calls. Mon–Sat 9AM–7PM CST.
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/40">
          <div className="pulse-glow h-full w-2/3 rounded-full bg-gradient-to-r from-[var(--accent-2)] to-[var(--accent-3)]" />
        </div>
      </div>
    </aside>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      {/* Wall Street logo — renders IMG_9127 logo */}
      <img
        src="/log.svg"
        alt="Fast Track Boost"
        className="h-10 w-10 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(134,59,255,0.35)]"
      />
      <div className="leading-tight">
        <div className="font-display text-[15px] font-bold tracking-[0.04em]">FAST TRACK BOOST</div>
        <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-secondary-text">
          AI CRM · Voice
        </div>
      </div>
    </div>
  )
}


export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const view = useCRM((s) => s.view)
  const navigate = useCRM((s) => s.navigate)
  const alerts = useCRM((s) => s.alerts)
  const unread = alerts.filter((a) => !a.read).length

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`glass-panel absolute left-0 top-0 flex h-full w-[280px] flex-col p-5 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={onClose} className="rounded-lg p-2 text-secondary-text hover:text-white">
            <X size={20} />
          </button>
        </div>
        <nav className="mt-6 flex flex-col gap-2">
          {NAV.map((item) => {
            const active = view === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.id)
                  onClose()
                }}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-[15px] font-semibold transition ${
                  active ? 'metal-btn text-[#0F1115]' : 'text-secondary-text hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                {item.id === 'notifications' && unread > 0 && (
                  <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-black">
                    {unread}
                  </span>
                )}
              </button>
            )
          })}
          <div className="mt-4 border-t border-edge2 pt-4 text-xs text-secondary-text">
            <div className="flex items-center gap-2 text-silver">
              <FileText size={14} /> WALLSTREET Group · Funding &amp; Credit
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
