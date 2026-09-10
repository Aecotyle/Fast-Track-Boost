import { useEffect } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { useCRM } from './store/useCRM'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard'
import LeadsPage from './pages/LeadsPage'
import LeadDetail from './pages/LeadDetail'
import Notifications from './pages/Notifications'
import { FacetOverlay } from './components/layout/Facet'
import ToastContainer from './components/Toast'

export default function App() {
  const view = useCRM((s) => s.view)
  const load = useCRM((s) => s.load)
  const selectedLeadId = useCRM((s) => s.selectedLeadId)
  const theme = useCRM((s) => s.theme)

  useEffect(() => {
    load()
  }, [load])

  return (
    <MotionConfig reducedMotion="user">
      <div className="grain min-h-screen text-white" data-theme={theme}>
        <FacetOverlay />
        <div className="relative z-10 flex h-screen">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view + (selectedLeadId || '')}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.32, ease: [0.2, 0, 0, 1] }}
                  className="h-full"
                >
                  {view === 'dashboard' && <Dashboard />}
                  {view === 'leads' && <LeadsPage />}
                  {view === 'lead' && <LeadDetail leadId={selectedLeadId!} />}
                  {view === 'notifications' && <Notifications />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
      <ToastContainer />
    </MotionConfig>
  )
}
