import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Plus, 
  Video, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Pill, 
  ExternalLink,
  Ban,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
  pre_visit_summary?: {
    urgency_level?: string
    chief_complaint?: string
    suggested_questions?: string[]
  }
  post_visit_summary?: {
    summary?: string
    follow_up_steps?: string[]
    medications?: Array<{
      name: string
      times_per_day: number
      duration_days: number
      instructions: string
    }>
  }
}

export default function PatientDashboard() {
  const { profile } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [selectedCompletedAppt, setSelectedCompletedAppt] = useState<Appointment | null>(null)

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const res = await api.get('/appointments/my')
      setAppointments(res.data)
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you wish to cancel this appointment? An automatic notification will be dispatched.')) return
    try {
      setCancellingId(appointmentId)
      await api.post(`/appointments/${appointmentId}/cancel`, {
        reason: 'Cancelled by patient from dashboard'
      })
      await fetchAppointments()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel appointment')
    } finally {
      setCancellingId(null)
    }
  }

  const isWithin15Minutes = (startTimeIso: string) => {
    const start = new Date(startTimeIso).getTime()
    const now = Date.now()
    const diffMins = (start - now) / (1000 * 60)
    // Between 15 mins before and 45 mins after start
    return diffMins <= 15 && diffMins >= -45
  }

  const upcomingAppointments = appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING')
  const completedAppointments = appointments.filter(a => a.status === 'COMPLETED')

  return (
    <div className="space-y-8 font-mono">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="mustard" className="mb-2">Patient Hub</Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Good day, {profile?.full_name?.split(' ')[0] || 'Patient'}.
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Your personalized sanctuary for appointments, prescriptions, and health records.
          </p>
        </div>

        <Link
          to="/patient/book"
          className={cn(buttonVariants({ size: "lg" }), "gap-2 shadow-md")}
        >
          <Plus className="w-4 h-4" /> Book New Appointment
        </Link>
      </div>

      {/* Google Calendar Sync */}
      <ConnectCalendarCard />

      {/* Section 1: Active & Upcoming Care Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-serif font-bold">Upcoming Consultations</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {upcomingAppointments.length} Active
          </Badge>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse bg-card/50">
                <CardHeader className="h-28" />
              </Card>
            ))}
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <Card className="border-dashed border-2 border-border/80 text-center py-10 bg-card/30">
            <CardContent className="space-y-3">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-semibold">No upcoming appointments scheduled</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Ready for a consultation? Book a session with our verified physicians in just a few clicks.
              </p>
              <Link to="/patient/book" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-2")}>
                Select a Physician Slot
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingAppointments.map((appt) => {
              const urgent = appt.pre_visit_summary?.urgency_level === 'High'
              const timeClose = isWithin15Minutes(appt.start_time)

              return (
                <Card
                  key={appt.id}
                  className="glass-card flex flex-col justify-between relative overflow-hidden group border-t-[6px] border-t-primary"
                >
                  {/* Subtle Background Hover Reveal */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant={urgent ? 'mustard' : 'outline'} className="text-[10px] uppercase">
                          {appt.status} {urgent ? '• Urgent' : ''}
                        </Badge>
                        <CardTitle className="text-xl mt-1.5 font-bold group-hover:text-primary transition-colors">
                          Consultation with Dr. {appt.doctor_name || 'Physician'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-secondary" />
                          <span>{new Date(appt.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span>{new Date(appt.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                        </CardDescription>
                      </div>

                      {appt.meet_link && (
                        <div className="p-2.5 rounded-2xl bg-accent text-accent-foreground flex-shrink-0" title="Telehealth Appointment">
                          <Video className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 flex-1">
                    {appt.symptoms_raw && (
                      <div className="p-4 rounded-2xl bg-card/40 backdrop-blur-md border border-white/10 dark:border-white/5 text-xs space-y-1 shadow-inner group-hover:bg-card/60 transition-colors">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-bold">
                          Reported Symptoms
                        </span>
                        <p className="text-foreground leading-relaxed">
                          {appt.symptoms_raw}
                        </p>
                      </div>
                    )}

                    {appt.pre_visit_summary?.suggested_questions && appt.pre_visit_summary.suggested_questions.length > 0 && (
                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <span className="font-semibold text-secondary flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> AI Pre-visit questions prepared for doctor
                        </span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border/50">
                    {appt.meet_link ? (
                      <motion.a
                        href={appt.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        animate={timeClose ? { scale: [1, 1.02, 1] } : {}}
                        transition={timeClose ? { repeat: Infinity, duration: 2 } : {}}
                        className={cn(
                          buttonVariants({ variant: timeClose ? "secondary" : "default" }),
                          "w-full flex items-center justify-center gap-2 font-semibold shadow-sm"
                        )}
                      >
                        <Video className="w-4 h-4" />
                        {timeClose ? "Join Video Call Now (Live)" : "Open Google Meet Call"}
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                      </motion.a>
                    ) : (
                      <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                        In-Person Clinic Visit
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(appt.id)}
                      disabled={cancellingId === appt.id}
                      className="w-full sm:w-auto text-xs text-muted-foreground hover:text-red-600 hover:border-red-500/40"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1" />
                      {cancellingId === appt.id ? 'Cancelling...' : 'Cancel'}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Section 2: Completed Visits & AI Prescriptions */}
      {completedAppointments.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-serif font-bold">Past Summaries & AI Prescriptions</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedAppointments.map((appt) => (
              <Card key={appt.id} className="border-border/70 hover:border-secondary/60 transition-all">
                <CardHeader className="pb-2">
                  <Badge variant="forest" className="w-fit mb-1">Completed Consultation</Badge>
                  <CardTitle className="text-lg">
                    {new Date(appt.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    AI Patient Summary Generated
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 text-xs">
                  <p className="line-clamp-3 text-muted-foreground italic">
                    "{appt.post_visit_summary?.summary || 'Consultation concluded successfully.'}"
                  </p>
                  {appt.post_visit_summary?.medications && appt.post_visit_summary.medications.length > 0 && (
                    <div className="pt-2 flex items-center gap-1.5 text-secondary font-bold">
                      <Pill className="w-3.5 h-3.5" />
                      <span>{appt.post_visit_summary.medications.length} Medications Prescribed</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCompletedAppt(appt)}
                    className="w-full text-xs gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Detailed Medical Notes
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Post-Visit Modal */}
      <AnimatePresence>
        {selectedCompletedAppt && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl"
            >
              <Card className="border-secondary shadow-2xl max-h-[85vh] overflow-y-auto">
                <CardHeader className="border-b border-border/50 sticky top-0 bg-card z-10">
                  <div className="flex items-center justify-between">
                    <Badge variant="mustard">AI Synthesized Summary</Badge>
                    <button
                      onClick={() => setSelectedCompletedAppt(null)}
                      className="text-xs text-muted-foreground hover:text-foreground p-1"
                    >
                      Close (Esc)
                    </button>
                  </div>
                  <CardTitle className="text-2xl mt-1">Post-Visit Medical Record</CardTitle>
                  <CardDescription>
                    Date: {new Date(selectedCompletedAppt.start_time).toLocaleString()}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-6 text-sm">
                  {/* Summary */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground font-serif text-lg">Patient-Friendly Diagnosis</h4>
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-muted-foreground leading-relaxed">
                      {selectedCompletedAppt.post_visit_summary?.summary}
                    </div>
                  </div>

                  {/* Follow up steps */}
                  {selectedCompletedAppt.post_visit_summary?.follow_up_steps && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground font-serif text-lg">Recommended Recovery Steps</h4>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        {selectedCompletedAppt.post_visit_summary.follow_up_steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prescribed Medications */}
                  {selectedCompletedAppt.post_visit_summary?.medications && selectedCompletedAppt.post_visit_summary.medications.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground font-serif text-lg">Prescriptions & Schedule</h4>
                      <div className="space-y-2">
                        {selectedCompletedAppt.post_visit_summary.medications.map((med, i) => (
                          <div key={i} className="p-3.5 rounded-2xl bg-card border border-border flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-foreground block">{med.name}</span>
                              <span className="text-muted-foreground block">{med.instructions}</span>
                            </div>
                            <Badge variant="outline">
                              {med.times_per_day}x / day for {med.duration_days} days
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="border-t border-border/50">
                  <Button
                    onClick={() => setSelectedCompletedAppt(null)}
                    className="w-full"
                  >
                    Done
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
