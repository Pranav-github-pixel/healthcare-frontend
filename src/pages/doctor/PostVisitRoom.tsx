import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Pill, 
  Clock,
  Heart,
  Stethoscope
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AppointmentDetail {
  id: string
  doctor_id: string
  patient_id: string
  start_time: string
  end_time: string
  status: string
  symptoms_raw?: string
  doctor_notes_raw?: string
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

export default function PostVisitRoom() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successResult, setSuccessResult] = useState<any>(null)
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({})

  useEffect(() => {
    async function loadAppointment() {
      if (!id) return
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('id', id)
          .single()

        if (!error && data) {
          setAppointment(data as AppointmentDetail)
          if (data.doctor_notes_raw) {
            setDoctorNotes(data.doctor_notes_raw)
          }
          if (data.post_visit_summary) {
            setSuccessResult(data.post_visit_summary)
          }
        }
      } catch (err) {
        console.error('Failed to load appointment details:', err)
      } finally {
        setLoading(false)
      }
    }
    loadAppointment()
  }, [id])

  const handleSubmitNotes = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !doctorNotes.trim()) return
    setErrorMsg(null)
    setProcessing(true)

    try {
      const res = await api.post(`/appointments/${id}/post-visit`, {
        doctor_notes_raw: doctorNotes.trim()
      })
      setSuccessResult(res.data.post_visit_summary)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to synthesize AI post-visit notes. Please retry.')
    } finally {
      setProcessing(false)
    }
  }

  const toggleQuestion = (idx: number) => {
    setCheckedQuestions(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const applyPreset = (text: string) => {
    setDoctorNotes(prev => (prev ? `${prev} ${text}` : text))
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 font-mono">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Loading Clinical Encounter Room...</p>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="text-center py-12 space-y-4 font-mono">
        <p className="text-sm font-bold text-foreground">Appointment not found</p>
        <Link to="/doctor" className={cn(buttonVariants({ variant: "outline" }))}>
          Return to Schedule
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-mono pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <Link
            to="/doctor"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Schedule Stream
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="mustard">Consultation Room</Badge>
            <span className="text-xs text-muted-foreground">Encounter #{appointment.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mt-1">
            Clinical Notes & AI Synthesis Studio
          </h1>
        </div>

        <div className="text-xs text-muted-foreground sm:text-right">
          <span className="block font-bold text-foreground">
            {new Date(appointment.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="flex items-center sm:justify-end gap-1 text-[11px] mt-0.5">
            <Clock className="w-3 h-3 text-secondary" />
            {new Date(appointment.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - {new Date(appointment.end_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} (UTC)
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Patient Intake & AI Pre-Visit Data (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-soft dark:shadow-soft-dark">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="default">Intake Triage</Badge>
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-serif mt-1">Patient Symptoms</CardTitle>
              <CardDescription className="text-xs">
                Submitted during the patient booking intake flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-2xl bg-background/60 border border-border/80 text-xs font-mono leading-relaxed">
                <p className="text-foreground italic">
                  "{appointment.symptoms_raw || 'Routine follow-up consultation.'}"
                </p>
              </div>

              {appointment.pre_visit_summary && (
                <div className="p-3.5 rounded-2xl bg-secondary/10 border border-secondary/20 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">Urgency Assessment</span>
                    <Badge variant={appointment.pre_visit_summary.urgency_level === 'High' ? 'mustard' : 'outline'} className="text-[10px]">
                      {appointment.pre_visit_summary.urgency_level || 'Medium'}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Chief Complaint</span>
                    <p className="text-foreground font-semibold mt-0.5">
                      {appointment.pre_visit_summary.chief_complaint}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Diagnostic Questions Prepared by Gemini */}
          {appointment.pre_visit_summary?.suggested_questions && appointment.pre_visit_summary.suggested_questions.length > 0 && (
            <Card className="border-border/80 shadow-soft dark:shadow-soft-dark">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Suggested Diagnostic Questions</span>
                </div>
                <CardTitle className="text-base font-serif mt-0.5">
                  Clinical Exploration Prompts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {appointment.pre_visit_summary.suggested_questions.map((q, i) => (
                  <div
                    key={i}
                    onClick={() => toggleQuestion(i)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                      checkedQuestions[i]
                        ? 'bg-primary/10 border-primary/40 line-through text-muted-foreground'
                        : 'bg-card border-border/80 hover:border-secondary text-foreground'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${checkedQuestions[i] ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="leading-relaxed">{q}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Clinical Notes & Magic Synthesis Button (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-t-4 border-t-secondary shadow-soft dark:shadow-soft-dark">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="mustard">Doctor Scribe</Badge>
                <Stethoscope className="w-5 h-5 text-secondary" />
              </div>
              <CardTitle className="text-2xl font-serif mt-1">Clinical Observations & Rx</CardTitle>
              <CardDescription className="text-xs">
                Write your notes in raw shorthand. Gemini 3.6 Flash will parse medications and dispatch 9 calendar events.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmitNotes}>
              <CardContent className="space-y-4">
                {/* Shorthand Presets */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    Quick Clinical Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Prescribed Paracetamol 500mg, 3 times a day for 3 days.',
                      'Prescribed Amoxicillin 500mg, 2 times a day for 7 days with food.',
                      'Advised 8 glasses of water daily and bed rest.',
                      'Follow-up in 1 week if fever persists.'
                    ].map((preset, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => applyPreset(preset)}
                        className="px-2.5 py-1 rounded-xl border border-border/80 text-[10px] bg-background/50 hover:border-secondary hover:text-foreground text-left transition-all"
                      >
                        + {preset.slice(0, 35)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider block font-bold">
                    Doctor's Raw Clinical Notes
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={doctorNotes}
                    onChange={e => setDoctorNotes(e.target.value)}
                    placeholder="e.g., Patient presents with viral upper respiratory tract infection. Lungs clear. Prescribed Paracetamol 500mg, 3 times a day for 3 days. Drink plenty of water and rest..."
                    className="w-full p-4 rounded-3xl bg-background border border-border focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none font-mono resize-none leading-relaxed"
                  />
                </div>
              </CardContent>

              <div className="p-6 pt-0 flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={processing || !doctorNotes.trim()}
                  className="w-full sm:w-auto gap-2 min-w-[260px] font-bold text-base shadow-md"
                >
                  {processing ? (
                    <>
                      <Sparkles className="w-5 h-5 animate-spin text-secondary" />
                      Gemini Synthesizing Prescriptions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-secondary" />
                      Complete & Synthesize AI Summary
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>

          {/* AI SYNTHESIS RESULT DISPLAY */}
          {successResult && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-2 border-emerald-500/40 bg-emerald-500/5 shadow-soft">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="bg-emerald-600 text-white">
                      AI Synthesis Complete
                    </Badge>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-xl font-serif mt-1">Generated Patient Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-card border border-border/80 text-foreground leading-relaxed font-mono">
                    {successResult.summary}
                  </div>

                  {successResult.medications && successResult.medications.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-secondary font-bold text-xs uppercase">
                        <Pill className="w-4 h-4" />
                        <span>Parsed Medication Schedule (Synced to Google Calendar):</span>
                      </div>
                      <div className="space-y-2">
                        {successResult.medications.map((m: any, i: number) => (
                          <div key={i} className="p-3 rounded-2xl bg-card border border-border flex items-center justify-between">
                            <span className="font-bold text-foreground">{m.name}</span>
                            <Badge variant="outline">{m.times_per_day}x / day for {m.duration_days} days</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {successResult.follow_up_steps && (
                    <div className="space-y-1.5">
                      <span className="font-bold text-foreground block">Patient Action Steps:</span>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-1">
                        {successResult.follow_up_steps.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button onClick={() => navigate('/doctor')} className="gap-2">
                      Return to Daily Stream
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
