import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Video, 
  Sparkles, 
  FileEdit, 
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConnectCalendarCard } from '@/components/ConnectCalendarCard'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Appointment {
  id: string
  doctor_id: string
  patient_id: string
  start_time: string
  end_time: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  symptoms_raw?: string
  meet_link?: string
  doctor_name?: string
  patient_name?: string
  rescheduled_by_doctor?: boolean
  pre_visit_summary?: {
    urgency_level?: string
    chief_complaint?: string
    suggested_questions?: string[]
  }
  post_visit_summary?: {
    summary?: string
  }
}

export default function DoctorDashboard() {
  const { profile } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CONFIRMED' | 'COMPLETED'>('ALL')
  
  // Reschedule state
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null)
  const [newStartTime, setNewStartTime] = useState('')
  const [newEndTime, setNewEndTime] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  const fetchDoctorAppointments = async () => {
    try {
      setLoading(true)
      const res = await api.get('/appointments/my')
      setAppointments(res.data)
    } catch (err) {
      console.error('Failed to load doctor appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctorAppointments()
  }, [])

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reschedulingAppt) return
    setRescheduling(true)
    setRescheduleError(null)

    try {
      await api.post(`/appointments/${reschedulingAppt.id}/reschedule`, {
        doctor_id: reschedulingAppt.doctor_id,
        start_time: new Date(newStartTime).toISOString(),
        end_time: new Date(newEndTime).toISOString(),
      })
      alert('Appointment rescheduled successfully. Patient and Google Calendar updated.')
      setReschedulingAppt(null)
      await fetchDoctorAppointments()
    } catch (err: any) {
      setRescheduleError(err.response?.data?.detail || 'Failed to reschedule appointment.')
    } finally {
      setRescheduling(false)
    }
  }

  const isWithin15Minutes = (startTimeIso: string) => {
    const start = new Date(startTimeIso).getTime()
    const now = Date.now()
    const diffMins = (start - now) / (1000 * 60)
    return diffMins <= 15 && diffMins >= -45
  }

  const filteredAppointments = appointments.filter(a => {
    if (filterStatus === 'ALL') return a.status !== 'CANCELLED'
    return a.status === filterStatus
  })

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="mustard" className="mb-2">Clinical Station</Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Dr. {profile?.full_name || 'Physician'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {profile?.specialization || 'General Practice'} • Daily chronological schedule & Gemini AI notes engine.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={fetchDoctorAppointments}
          className="gap-2 self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Stream
        </Button>
      </div>

      {/* Google Calendar Sync */}
      <ConnectCalendarCard />

      {/* Schedule Timeline Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-serif font-bold text-foreground">Schedule Timeline Stream</h2>
          </div>

          <div className="flex gap-1 bg-card p-1 rounded-2xl border border-border/70 text-xs">
            {(['ALL', 'CONFIRMED', 'COMPLETED'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filterStatus === tab
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-3xl bg-card/60 animate-pulse border border-border/60" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="text-center py-12 border-dashed bg-card/30">
            <CardContent className="space-y-2">
              <Clock className="w-10 h-10 mx-auto text-muted-foreground opacity-50" />
              <p className="text-sm font-semibold text-foreground">No appointments in this stream</p>
              <p className="text-xs text-muted-foreground">
                Upcoming consultations will automatically slide into your timeline when booked by patients.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-border/60 before:hidden sm:before:block">
            {filteredAppointments.map((appt) => {
              const isTelehealth = Boolean(appt.meet_link)
              const isCompleted = appt.status === 'COMPLETED'
              const urgent = appt.pre_visit_summary?.urgency_level === 'High'
              const timeClose = isWithin15Minutes(appt.start_time)
              const startFormatted = new Date(appt.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
              const endFormatted = new Date(appt.end_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
              const dateFormatted = new Date(appt.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

              return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="sm:pl-12 relative"
                >
                  {/* Timeline dot with glowing effect */}
                  <div className={`hidden sm:flex absolute -left-[5px] top-6 w-3.5 h-3.5 rounded-full border-[3px] border-background z-10 shadow-[0_0_10px_rgba(20,82,71,0.5)] dark:shadow-[0_0_10px_rgba(250,168,5,0.4)] ${
                    isCompleted ? 'bg-muted-foreground' : isTelehealth ? 'bg-accent-foreground' : 'bg-primary'
                  }`} />

                  <Card className={`border-l-[6px] transition-all duration-300 hover:-translate-x-1 hover:shadow-lg ${
                    isTelehealth ? 'border-l-accent' : 'border-l-primary'
                  } glass-card`}>
                    <CardHeader className="pb-3 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={isCompleted ? 'outline' : urgent ? 'mustard' : 'default'} className="text-[10px] uppercase">
                            {appt.status} {urgent ? '• HIGH URGENCY' : ''}
                          </Badge>
                          {isTelehealth ? (
                            <Badge variant="accent" className="text-[10px] gap-1">
                              <Video className="w-3 h-3" /> Telehealth Video
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              In-Person Visit
                            </Badge>
                          )}
                          {appt.rescheduled_by_doctor && (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40">
                              Rescheduled Once
                            </Badge>
                          )}
                        </div>

                        <CardTitle className="text-xl font-bold mt-1 group-hover:text-primary transition-colors">
                          Consultation with {appt.patient_name || 'Patient'}
                        </CardTitle>

                        <CardDescription className="flex items-center gap-2 font-mono text-xs">
                          <Clock className="w-3.5 h-3.5 text-secondary" />
                          <span>{dateFormatted}</span>
                          <span>•</span>
                          <span className="font-bold text-foreground">{startFormatted} - {endFormatted} (UTC)</span>
                        </CardDescription>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isTelehealth && appt.meet_link && (
                          <motion.a
                            href={appt.meet_link}
                            target="_blank"
                            rel="noreferrer"
                            animate={timeClose ? { scale: [1, 1.03, 1] } : {}}
                            transition={timeClose ? { repeat: Infinity, duration: 2 } : {}}
                            className={cn(
                              buttonVariants({ variant: timeClose ? "secondary" : "accent", size: "sm" }),
                              "gap-1.5 text-xs font-bold shadow-sm"
                            )}
                          >
                            <Video className="w-3.5 h-3.5" />
                            {timeClose ? "Join Google Meet (Live)" : "Launch Call"}
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </motion.a>
                        )}

                        {!isCompleted ? (
                          <Link
                            to={`/doctor/appointment/${appt.id}`}
                            className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-1.5 text-xs shadow-sm font-semibold")}
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            Open Post-Visit Room
                          </Link>
                        ) : (
                          <Link
                            to={`/doctor/appointment/${appt.id}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
                          >
                            <Eye className="w-3.5 h-3.5" /> Review Notes
                          </Link>
                        )}

                        {!isCompleted && !appt.rescheduled_by_doctor && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReschedulingAppt(appt)
                              setNewStartTime(appt.start_time.slice(0, 16))
                              setNewEndTime(appt.end_time.slice(0, 16))
                            }}
                            className="text-xs text-muted-foreground hover:border-secondary hover:text-foreground"
                          >
                            Reschedule (1x)
                          </Button>
                        )}
                      </div>
                    </CardHeader>

                    {/* Pre-Visit Triage Summary */}
                    <CardContent className="space-y-3 pt-0 text-xs">
                      {appt.symptoms_raw && (
                        <div className="p-3 rounded-2xl bg-background/60 border border-border/80 space-y-1">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">
                            Patient Intake Symptoms
                          </span>
                          <p className="text-foreground leading-relaxed italic">
                            "{appt.symptoms_raw}"
                          </p>
                        </div>
                      )}

                      {appt.pre_visit_summary && (
                        <div className="p-3 rounded-2xl bg-secondary/10 border border-secondary/20 space-y-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-secondary text-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Pre-Visit Triage: {appt.pre_visit_summary.chief_complaint}</span>
                          </div>
                          {appt.pre_visit_summary.suggested_questions && appt.pre_visit_summary.suggested_questions.length > 0 && (
                            <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-0.5 pl-1">
                              {appt.pre_visit_summary.suggested_questions.slice(0, 2).map((q, i) => (
                                <li key={i}>{q}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <AnimatePresence>
        {reschedulingAppt && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <Card className="border-secondary shadow-2xl">
                <CardHeader>
                  <Badge variant="mustard">One-Time Doctor Reschedule</Badge>
                  <CardTitle className="text-2xl mt-1 font-serif">Shift Appointment Window</CardTitle>
                  <CardDescription>
                    You can reschedule an emergency consultation once. This automatically syncs Google Calendar and notifies the patient.
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleReschedule}>
                  <CardContent className="space-y-4 text-xs">
                    {rescheduleError && (
                      <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{rescheduleError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground uppercase tracking-wider block">
                        New Start Time (UTC)
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={newStartTime}
                        onChange={e => setNewStartTime(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-background border border-border focus:border-secondary text-sm outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground uppercase tracking-wider block">
                        New End Time (UTC)
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={newEndTime}
                        onChange={e => setNewEndTime(e.target.value)}
                        className="w-full p-3 rounded-2xl bg-background border border-border focus:border-secondary text-sm outline-none font-mono"
                      />
                    </div>
                  </CardContent>

                  <div className="p-6 pt-0 flex gap-3 border-t border-border/50 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReschedulingAppt(null)}
                      disabled={rescheduling}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={rescheduling}
                      className="w-full gap-2 font-bold"
                    >
                      {rescheduling ? 'Rescheduling...' : 'Confirm Shift'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
