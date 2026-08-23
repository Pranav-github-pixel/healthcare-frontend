import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Clock, 
  Stethoscope, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Timer,
  Heart,
  Brain,
  Bone,
  Baby,
  Eye,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

interface Doctor {
  id: string
  full_name: string
  specialization?: string
  slot_duration_minutes?: number
  working_hours?: Record<string, any>
}

interface Slot {
  start_time: string
  end_time: string
}

// Map specialization names to icons
const SPEC_ICONS: Record<string, any> = {
  'Cardiologist': Heart,
  'Neurologist': Brain,
  'Orthopedist': Bone,
  'Gynecologist': Baby,
  'Ophthalmologist': Eye,
  'General Physician': Activity,
}

export default function BookingFlow() {
  const navigate = useNavigate()

  // Wizard state: 1 = Specialization, 2 = Doctor, 3 = Date & Slot, 4 = Symptoms & Confirm, 5 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1)

  // Step 1: Specializations
  const [specializations, setSpecializations] = useState<string[]>([])
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null)
  const [loadingSpecs, setLoadingSpecs] = useState(true)

  // Step 2: Doctors
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [loadingDoctors, setLoadingDoctors] = useState(false)

  // Step 3: Dates & Slots
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [heldAppointmentId, setHeldAppointmentId] = useState<string | null>(null)
  const [holdingSlot, setHoldingSlot] = useState(false)
  const [holdTimerSeconds, setHoldTimerSeconds] = useState(600)

  // Step 4: Symptoms & Confirm
  const [symptoms, setSymptoms] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmedData, setConfirmedData] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Load specializations on mount
  useEffect(() => {
    async function loadSpecs() {
      try {
        setLoadingSpecs(true)
        const res = await api.get('/users/specializations')
        setSpecializations(res.data || [])
      } catch (err) {
        console.error('Failed to load specializations:', err)
        // Fallback
        setSpecializations(['General Physician', 'Cardiologist', 'Neurologist', 'Orthopedist', 'Gynecologist', 'Ophthalmologist'])
      } finally {
        setLoadingSpecs(false)
      }
    }
    loadSpecs()
  }, [])

  // Load doctors when specialization is selected and step moves to 2
  useEffect(() => {
    if (step === 2 && selectedSpec) {
      loadDoctors(selectedSpec)
    }
  }, [step, selectedSpec])

  const loadDoctors = async (spec: string) => {
    try {
      setLoadingDoctors(true)
      setSelectedDoctor(null)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, specialization, slot_duration_minutes, working_hours')
        .eq('role', 'DOCTOR')
        .ilike('specialization', `%${spec}%`)

      if (!error && data && data.length > 0) {
        setDoctors(data as Doctor[])
      } else {
        // If no doctors found for this spec, load all doctors as fallback
        const { data: allDocs } = await supabase
          .from('profiles')
          .select('id, full_name, specialization, slot_duration_minutes, working_hours')
          .eq('role', 'DOCTOR')
        setDoctors((allDocs || []) as Doctor[])
      }
    } catch (err) {
      console.error('Failed to load doctors:', err)
    } finally {
      setLoadingDoctors(false)
    }
  }

  // Generate next 10 selectable dates
  const dates = Array.from({ length: 10 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    return {
      iso: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString(undefined, { month: 'short' }),
    }
  })

  // Select initial date when step 3 opens
  useEffect(() => {
    if (step === 3 && dates.length > 0 && !selectedDate) {
      handleDateSelect(dates[0].iso)
    }
  }, [step])

  // Fetch slots for selected date
  const handleDateSelect = async (dateIso: string) => {
    if (!selectedDoctor) return
    setSelectedDate(dateIso)
    setSelectedSlot(null)
    setErrorMsg(null)
    setLoadingSlots(true)

    try {
      const res = await api.get('/appointments/available-slots', {
        params: {
          doctor_id: selectedDoctor.id,
          date: dateIso,
        },
      })
      setAvailableSlots(res.data.slots || [])
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to load doctor slots.')
    } finally {
      setLoadingSlots(false)
    }
  }

  // Hold slot (Calls POST /api/v1/appointments/hold)
  const handleSlotClick = async (slot: Slot) => {
    if (!selectedDoctor) return
    setSelectedSlot(slot)
    setErrorMsg(null)
    setHoldingSlot(true)

    try {
      const res = await api.post('/appointments/hold', {
        doctor_id: selectedDoctor.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
      })

      setHeldAppointmentId(res.data.id)
      setHoldTimerSeconds(600)
      setStep(4)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'This slot was just held by another patient. Please choose another.')
      setSelectedSlot(null)
    } finally {
      setHoldingSlot(false)
    }
  }

  // Hold timer countdown
  useEffect(() => {
    if (step === 4 && heldAppointmentId) {
      const interval = setInterval(() => {
        setHoldTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            alert('Your 10-minute slot hold has expired. Please select a slot again.')
            setStep(3)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [step, heldAppointmentId])

  // Confirm appointment with symptoms
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!heldAppointmentId) return
    setErrorMsg(null)
    setConfirming(true)

    try {
      const res = await api.post('/appointments/confirm', {
        appointment_id: heldAppointmentId,
        symptoms_raw: symptoms.trim() || 'General health consultation',
      })
      setConfirmedData(res.data)
      setStep(5)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to confirm appointment. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  const stepLabels = [
    { num: 1, label: 'Specialty' },
    { num: 2, label: 'Doctor' },
    { num: 3, label: 'Slot' },
    { num: 4, label: 'Symptoms' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-mono pb-12">
      {/* Wizard Progress Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <Link
          to="/patient"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </Link>

        <div className="flex items-center gap-2">
          {stepLabels.map(s => (
            <div key={s.num} className="flex items-center gap-1.5 text-xs">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                  step === s.num
                    ? 'bg-primary text-primary-foreground'
                    : step > s.num
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className={`hidden sm:inline ${step === s.num ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {s.num < 4 && <div className="w-4 h-px bg-border/80 mx-1 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SELECT SPECIALIZATION */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div>
            <Badge variant="mustard" className="mb-2">Step 1 of 4</Badge>
            <h2 className="text-3xl font-bold text-foreground">
              What Type of Doctor Do You Need?
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select the medical specialty that best matches your health concern.
            </p>
          </div>

          {loadingSpecs ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-28 animate-pulse bg-card/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {specializations.map(spec => {
                const isSelected = selectedSpec === spec
                const IconComp = SPEC_ICONS[spec] || Stethoscope
                return (
                  <Card
                    key={spec}
                    onClick={() => setSelectedSpec(spec)}
                    className={`cursor-pointer transition-all duration-300 border-[3px] glass-card hover:-translate-y-1.5 hover:shadow-lg ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-[0_0_25px_rgba(15,118,110,0.3)]'
                        : 'border-transparent hover:border-primary/30'
                    }`}
                  >
                    <CardContent className="p-5 flex flex-col items-center justify-center text-center gap-3">
                      <div className={`w-12 h-12 rounded-3xl flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-secondary'}`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-sm font-bold block">{spec}</span>
                        {isSelected && <Badge variant="default" className="text-[10px] mt-1">Selected</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              disabled={!selectedSpec}
              onClick={() => setStep(2)}
              className="gap-2"
            >
              Continue to Doctors <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: SELECT DOCTOR */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <Badge variant="mustard" className="mb-2">Step 2 of 4</Badge>
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Select Your Attending Physician
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Showing <span className="font-bold text-foreground">{selectedSpec}</span> specialists
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="w-fit text-xs gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Specialty
            </Button>
          </div>

          {loadingDoctors ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Card key={i} className="h-36 animate-pulse bg-card/50" />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <Card className="text-center py-10">
              <CardContent>
                <Stethoscope className="w-8 h-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm font-semibold">No {selectedSpec} doctors currently registered</p>
                <p className="text-xs text-muted-foreground mt-1">Try selecting a different specialty</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {doctors.map(doc => {
                const isSelected = selectedDoctor?.id === doc.id
                return (
                  <Card
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={`cursor-pointer transition-all duration-300 border-[3px] glass-card hover:-translate-y-1.5 hover:shadow-lg ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-[0_0_25px_rgba(15,118,110,0.3)]'
                        : 'border-transparent hover:border-primary/30'
                    }`}
                  >
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                      <div className={`w-12 h-12 rounded-3xl flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-secondary'}`}>
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold">
                          Dr. {doc.full_name}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono">
                          {doc.specialization || 'General Physician'} • {doc.slot_duration_minutes || 30} min consultation
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-t border-border/40 pt-3">
                        <span>
                          {doc.working_hours
                            ? `${Object.keys(doc.working_hours).length} working days/week`
                            : 'Mon-Fri (Default)'}
                        </span>
                        {isSelected && <Badge variant="default" className="text-[10px]">Selected</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              size="lg"
              disabled={!selectedDoctor}
              onClick={() => setStep(3)}
              className="gap-2"
            >
              Continue to Date & Slots <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: SELECT DATE & AVAILABLE SLOTS */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <Badge variant="mustard" className="mb-2">Step 3 of 4</Badge>
              <h2 className="text-3xl font-serif font-bold text-foreground">
                Choose Date & Slot
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Consultation with <span className="font-bold text-foreground">Dr. {selectedDoctor?.full_name}</span>
                {' '}({selectedDoctor?.specialization || 'General'})
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(2)}
              className="w-fit text-xs gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Change Doctor
            </Button>
          </div>

          {/* Horizontal Date Picker */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground uppercase tracking-wider block">
              Select Appointment Date
            </label>
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {dates.map(d => {
                const isSelected = selectedDate === d.iso
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => handleDateSelect(d.iso)}
                    className={`flex-shrink-0 w-20 py-3 rounded-2xl border text-center transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary font-bold shadow-md'
                        : 'bg-card border-border/80 text-muted-foreground hover:border-secondary hover:text-foreground'
                    }`}
                  >
                    <span className="text-[10px] uppercase block tracking-wider opacity-80">{d.dayName}</span>
                    <span className="text-xl font-bold font-serif block my-0.5">{d.dayNum}</span>
                    <span className="text-[10px] block opacity-80">{d.month}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Available Slots Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground uppercase tracking-wider block">
                Available Consultation Windows
              </label>
              {loadingSlots && (
                <span className="text-xs text-secondary animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Calculating doctor roster...
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="h-12 rounded-2xl bg-card/60 animate-pulse border border-border/50" />
                ))}
              </div>
            ) : availableSlots.length === 0 ? (
              <Card className="text-center py-8 border-dashed bg-card/30">
                <CardContent className="space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-sm font-semibold">No available slots on this date</p>
                  <p className="text-xs text-muted-foreground">
                    Dr. {selectedDoctor?.full_name} is fully booked or on scheduled leave for this date. Please try another day.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {availableSlots.map((slot, i) => {
                  const startFormatted = new Date(slot.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                  const isSelected = selectedSlot?.start_time === slot.start_time

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={holdingSlot}
                      onClick={() => handleSlotClick(slot)}
                      className={`p-3 rounded-2xl border text-xs font-mono flex flex-col items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-secondary text-secondary-foreground border-secondary font-bold shadow-md'
                          : 'bg-card border-border/80 hover:border-secondary hover:bg-card/80 text-foreground'
                      }`}
                    >
                      <span className="text-sm font-bold">{startFormatted}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">{selectedDoctor?.slot_duration_minutes || 30} Mins</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* STEP 4: SYMPTOMS INTAKE & 10-MIN HOLD LOCK */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {/* Hold Lock Banner */}
          <div className="p-4 rounded-3xl bg-secondary/15 border-2 border-secondary text-foreground flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-5 h-5 text-secondary animate-pulse" />
              <div>
                <span className="text-xs font-bold block">Temporary Slot Reserved</span>
                <span className="text-[11px] text-muted-foreground block">
                  Your chosen slot is securely locked for{' '}
                  <span className="font-bold text-foreground">
                    {Math.floor(holdTimerSeconds / 60)}:{(holdTimerSeconds % 60).toString().padStart(2, '0')}
                  </span>
                </span>
              </div>
            </div>
            <Badge variant="mustard">Advisory Lock Active</Badge>
          </div>

          <div>
            <Badge variant="mustard" className="mb-2">Step 4 of 4</Badge>
            <h2 className="text-3xl font-serif font-bold text-foreground">
              Describe Your Symptoms
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Provide details about your health concern. Our AI engine will prepare a pre-visit summary for your physician.
            </p>
          </div>

          {/* Booking Summary Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-bold">Booking Summary</span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Specialty</span>
                  <span className="font-bold text-foreground">{selectedSpec || 'General'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Doctor</span>
                  <span className="font-bold text-foreground">Dr. {selectedDoctor?.full_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Date</span>
                  <span className="font-bold text-foreground">{selectedDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Time</span>
                  <span className="font-bold text-foreground">
                    {selectedSlot ? new Date(selectedSlot.start_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'}
                    {' – '}
                    {selectedSlot ? new Date(selectedSlot.end_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider block">
                How are you feeling? (Symptoms Description)
              </label>
              <textarea
                required
                rows={5}
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="Describe your primary complaints (e.g., severe headache, persistent dry cough for 3 days, mild fever in the evenings)..."
                className="w-full p-4 rounded-3xl bg-card border border-border focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none font-mono resize-none leading-relaxed"
              />
            </div>

            {/* Quick symptom tags */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Quick Suggestions:</span>
              <div className="flex flex-wrap gap-2">
                {['Severe headache', 'Fever & chills', 'Sore throat', 'Routine Health Checkup', 'Joint pain', 'Prescription renewal'].map(tag => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => setSymptoms(prev => prev ? `${prev}, ${tag}` : tag)}
                    className="px-3 py-1 rounded-full border border-border/80 text-[11px] bg-background/50 hover:border-secondary hover:text-foreground transition-all"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                disabled={confirming}
                className="text-xs"
              >
                Back to Slots
              </Button>

              <Button
                type="submit"
                size="lg"
                disabled={confirming || !symptoms.trim()}
                className="gap-2 text-base font-semibold shadow-md min-w-[220px]"
              >
                {confirming ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-secondary" />
                    Generating AI Summary...
                  </>
                ) : (
                  <>
                    Confirm Appointment <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* STEP 5: SUCCESS CONFIRMATION */}
      {step === 5 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center max-w-xl mx-auto py-8"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <Badge variant="mustard">Consultation Confirmed</Badge>
            <h2 className="text-3xl font-serif font-bold text-foreground">
              Your Session is Fully Booked!
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dr. {selectedDoctor?.full_name} has received your intake summary. Confirmation emails and calendar invites have been dispatched in the background.
            </p>
          </div>

          {confirmedData?.pre_visit_summary && (
            <Card className="text-left bg-card border-secondary/30">
              <CardHeader className="pb-2">
                <Badge variant="outline" className="w-fit mb-1">Gemini AI Pre-Visit Analysis</Badge>
                <CardTitle className="text-base font-serif">
                  Chief Complaint: {confirmedData.pre_visit_summary.chief_complaint}
                </CardTitle>
                <CardDescription className="text-xs">
                  Urgency Classification: <span className="font-bold text-foreground">{confirmedData.pre_visit_summary.urgency_level}</span>
                </CardDescription>
              </CardHeader>
              {confirmedData.pre_visit_summary.suggested_questions && (
                <CardContent className="space-y-1.5 pt-2 text-xs text-muted-foreground border-t border-border/40">
                  <span className="font-semibold text-secondary block">Suggested Diagnostic Questions:</span>
                  <ul className="list-disc list-inside space-y-1">
                    {confirmedData.pre_visit_summary.suggested_questions.map((q: string, i: number) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          )}

          <div className="pt-4 flex justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate('/patient')}
              className="gap-2"
            >
              Return to Patient Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
