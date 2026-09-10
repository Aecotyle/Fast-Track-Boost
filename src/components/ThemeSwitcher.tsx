import { useEffect, useRef, useState } from 'react'
import { Palette, Check } from 'lucide-react'
import { useCRM, THEMES } from '../store/useCRM'

/** Color-gradient swatch row for switching the whole app theme. */
export default function ThemeSwitcher() {
  const theme = useCRM((s) => s.theme)
  const setTheme = useCRM((s) => s.setTheme)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="neu-raised neu-press flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-secondary-text hover:text-white"
        aria-label="Change theme"
        aria-expanded={open}
      >
        <Palette size={15} className="text-[var(--accent)]" />
        <span className="hidden sm:inline">Theme</span>
        <span
          className="h-3 w-3 rounded-full ring-1 ring-white/20"
          style={{ background: `linear-gradient(135deg, ${currentGradient()[0]}, ${currentGradient()[2]})` }}
        />
      </button>

      {open && (
        <div className="draw-in glass-panel absolute right-0 top-[52px] z-50 w-56 rounded-2xl p-2">
          <div className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-secondary-text">
            App theme
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {THEMES.map((t) => {
              const active = theme === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                    active ? 'neu-sunken text-white' : 'text-secondary-text hover:text-white'
                  }`}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/20"
                    style={{ background: `linear-gradient(135deg, ${t.gradient[0]}, ${t.gradient[2]})` }}
                  />
                  <span className="flex-1 text-left">{t.name}</span>
                  {active && <Check size={13} className="text-[var(--accent)]" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  function currentGradient() {
    return THEMES.find((t) => t.key === theme)?.gradient ?? THEMES[0].gradient
  }
}
