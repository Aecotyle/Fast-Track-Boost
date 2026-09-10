import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Phone } from 'lucide-react'

export default function CallPlayer({ duration, url }: { duration: number; url?: string }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    let raf: number
    if (playing && audioRef.current) {
      const tick = () => {
        const el = audioRef.current
        if (el && el.duration) {
          setProgress((el.currentTime / el.duration) * 100)
        }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const toggle = async () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      // If no real URL, simulate playback progress for demo.
      if (!url) {
        setPlaying(true)
        const total = duration || 600
        const start = Date.now()
        const sim = setInterval(() => {
          const t = Math.min(100, ((Date.now() - start) / 1000 / total) * 100)
          setProgress(t)
          if (t >= 100) {
            setPlaying(false)
            clearInterval(sim)
          }
        }, 300)
        // store interval on element
        ;(el as unknown as { _sim?: ReturnType<typeof setInterval> })._sim = sim
        return
      }
      try {
        await el.play()
        setPlaying(true)
      } catch {
        setPlaying(false)
      }
    }
  }

  const mins = Math.floor(duration / 60)
  const secs = String(duration % 60).padStart(2, '0')

  return (
    <div className="neu-raised rounded-xl p-3">
      {url ? <audio ref={audioRef} src={url} preload="metadata" /> : <audio ref={audioRef} preload="none" />}
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="metal-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm text-secondary-text">
            <Phone size={13} />
            <span className="truncate">{url || 'AI Call Recording'}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/40">
            <div className="h-full rounded-full metal-btn transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-secondary-text">
            <span>{Math.floor((progress / 100) * duration / 60)}:{String(Math.floor((progress / 100) * duration) % 60).padStart(2, '0')}</span>
            <span>{mins}:{secs}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
