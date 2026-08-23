import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Pill, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Heart
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

interface MedicationSchedule {
  id: string
  medication_name: string
  dosage: string
  reminder_time: string
  status: 'PENDING' | 'TAKEN' | 'MISSED'
  created_at: string
}

export default function MedicationTracker() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [takingId, setTakingId] = useState<string | null>(null)
  const [successCelebration, setSuccessCelebration] = useState(false)

  const fetchMedications = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('medication_schedules')
        .select(`
          id,
          medication_name,
          dosage,
          reminder_time,
          status,
          created_at,
          appointments!inner(patient_id)
        `)
        .eq('appointments.patient_id', user.id)
        .order('reminder_time', { ascending: true })

      if (!error && data) {
        setSchedules(data as unknown as MedicationSchedule[])
      } else {
        console.warn('Error or no schedules found:', error?.message)
      }
    } catch (err) {
      console.error('Failed to load medication schedules:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedications()
  }, [user])

  const handleTakeMedication = async (scheduleId: string) => {
    try {
      setTakingId(scheduleId)
      await api.put(`/appointments/medications/${scheduleId}/take`)

      // Optimistically update status
      setSchedules(prev =>
        prev.map(item => (item.id === scheduleId ? { ...item, status: 'TAKEN' } : item))
      )

      // Trigger micro celebration
      setSuccessCelebration(true)
      setTimeout(() => setSuccessCelebration(false), 3000)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update medication status')
    } finally {
      setTakingId(null)
    }
  }

  const pendingList = schedules.filter(s => s.status === 'PENDING')
  const takenList = schedules.filter(s => s.status === 'TAKEN')

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-mono pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="mustard" className="mb-2">Daily Adherence Sanctuary</Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Prescription Regimen Tracker
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Synchronized with Gemini 3.6 Flash synthesized post-visit doctor prescriptions.
          </p>
        </div>

        {/* Adherence Streak Counter */}
        <div className="p-4 rounded-3xl bg-card border border-border/80 flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-secondary text-secondary-foreground">
            <Heart className="w-5 h-5 fill-primary text-primary" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground block uppercase tracking-wider">Adherence</span>
            <span className="text-lg font-bold font-serif text-foreground">
              {takenList.length} / {schedules.length} Doses Taken
            </span>
          </div>
        </div>
      </div>

      {/* Success Celebration Toast */}
      <AnimatePresence>
        {successCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 rounded-3xl bg-primary text-primary-foreground flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-secondary animate-spin" />
              <span className="text-sm font-semibold">
                Dose Logged Successfully! Your body thanks you.
              </span>
            </div>
            <Badge variant="mustard">Status: TAKEN</Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 1: Pending Doses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-serif font-bold text-foreground">
              Pending Today ({pendingList.length})
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">Click pill to mark as taken</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-3xl bg-card/60 animate-pulse border border-border/60" />
            ))}
          </div>
        ) : pendingList.length === 0 ? (
          <Card className="text-center py-10 border-dashed bg-card/40">
            <CardContent className="space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 opacity-80" />
              <p className="text-sm font-semibold text-foreground">All caught up for today!</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No active pending medication doses remaining right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {pendingList.map(item => {
                const timeFormatted = new Date(item.reminder_time).toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const dateFormatted = new Date(item.reminder_time).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100, transition: { duration: 0.3 } }}
                  >
                    <Card
                      onClick={() => handleTakeMedication(item.id)}
                      className="cursor-pointer border-2 border-border/80 hover:border-secondary transition-all rounded-4xl bg-card shadow-soft dark:shadow-soft-dark overflow-hidden group"
                    >
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-3xl bg-secondary/15 text-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                            <Pill className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="font-serif text-lg font-bold text-foreground block">
                              {item.medication_name}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono block mt-0.5">
                              Dosage: <span className="text-foreground font-bold">{item.dosage}</span> • {dateFormatted} at {timeFormatted}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={takingId === item.id}
                          className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold font-mono flex items-center gap-2 group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{takingId === item.id ? 'Logging...' : 'Mark Taken'}</span>
                        </button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Section 2: Completed Doses Log */}
      {takenList.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-serif font-bold text-foreground">
              Completed Adherence Log ({takenList.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {takenList.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-3xl bg-card/50 border border-border/50 flex items-center justify-between text-xs text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="line-through">{item.medication_name} ({item.dosage})</span>
                </div>
                <Badge variant="outline" className="text-[10px]">TAKEN</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
