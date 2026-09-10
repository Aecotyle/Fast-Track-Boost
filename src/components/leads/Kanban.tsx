import {
  DndContext, DragOverlay, PointerSensor, closestCorners,
  useSensor, useSensors, useDroppable, useDraggable,
  DragStartEvent, DragEndEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lead, PipelineStage } from '../../types'
import { ScoreBadge } from '../ui'
import { timeAgo, fmtMoney } from '../../utils/format'
import { useCRM } from '../../store/useCRM'

const STAGES: PipelineStage[] = [
  'New Lead', 'AI Contacted', 'Qualified', 'Payment Pending',
  'Appointment Scheduled', 'Funded / Completed',
]

function Column({ stage, leads }: { stage: PipelineStage; leads: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  return (
    <div
      ref={setNodeRef}
      className={`w-[300px] shrink-0 rounded-2xl p-3 transition ${
        isOver
          ? 'border border-[var(--accent)]/40 bg-white/[0.03]'
          : 'card'
      }`}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-sm font-bold text-silver">{stage}</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-bold text-secondary-text">
          {leads.length}
        </span>
      </div>
      <div className="flex min-h-[120px] flex-col gap-2">
        <AnimatePresence initial={false}>
          {leads.map((l) => (
            <KanbanCard key={l.id} lead={l} />
          ))}
        </AnimatePresence>
        {leads.length === 0 && (
          <div className="neu-sunken rounded-xl border border-dashed border-white/5 p-4 text-center text-xs text-secondary-text">
            Drop leads here
          </div>
        )}
      </div>
    </div>
  )
}

function KanbanCard({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: lead.id })
  const openLead = useOpenLead()
  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      onClick={() => openLead(lead.id)}
      className={`neu-raised cursor-grab rounded-xl p-3 transition ${
        isDragging ? 'z-20 opacity-30' : 'active:cursor-grabbing'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-bold text-white">{lead.client_info.full_name}</span>
        <ScoreBadge score={lead.lead_classification} />
      </div>
      <div className="mt-1.5 text-xs text-secondary-text">{lead.primary_service}</div>
      {lead.requested_funding ? (
        <div className="mt-1 text-xs font-semibold text-silver">
          {fmtMoney(lead.requested_funding)} requested
        </div>
      ) : lead.consultation_type !== 'None' ? (
        <div className="mt-1 text-xs font-semibold text-silver">
          {lead.consultation_type.replace('_', ' ')}
        </div>
      ) : null}
      <div className="mt-2 flex items-center justify-between text-[11px] text-secondary-text">
        <span className="truncate">{lead.client_info.phone_number}</span>
        <span>{timeAgo(lead.created_at)}</span>
      </div>
    </motion.div>
  )
}

function useOpenLead() {
  return useCRM((s) => s.openLead)
}

export default function Kanban({ leads }: { leads: Lead[] }) {
  const moveStage = useCRM((s) => s.moveStage)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const [active, setActive] = useState<Lead | null>(null)

  const onDragStart = (e: DragStartEvent) => {
    setActive(leads.find((l) => l.id === String(e.active.id)) || null)
  }
  const onDragEnd = (e: DragEndEvent) => {
    setActive(null)
    const id = String(e.active.id)
    const stage = String(e.over?.id) as PipelineStage
    if (STAGES.includes(stage) && id) moveStage(id, stage)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            leads={leads.filter((l) => l.pipeline_stage === stage)}
          />
        ))}
      </div>
      <DragOverlay>
        {active && (
          <div className="neu-raised w-[280px] rounded-xl p-3 shadow-2xl ring-1 ring-[var(--accent)]/40">
            <div className="text-sm font-bold">{active.client_info.full_name}</div>
            <div className="text-xs text-secondary-text">{active.primary_service}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

export { STAGES }
