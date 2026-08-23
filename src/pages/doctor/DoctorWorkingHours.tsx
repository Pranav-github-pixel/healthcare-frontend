import { useState } from 'react'
import { Clock, Save, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function DoctorWorkingHours() {
  const { user, refreshProfile } = useAuth()

  const [slotDuration, setSlotDuration] = useState<number>(30)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSaved(false)

    try {
      const defaultWorkingHours = {
        monday: [["09:00", "13:00"], ["14:00", "18:00"]],
        tuesday: [["09:00", "13:00"], ["14:00", "18:00"]],
        wednesday: [["09:00", "13:00"], ["14:00", "18:00"]],
        thursday: [["09:00", "13:00"], ["14:00", "18:00"]],
        friday: [["09:00", "13:00"], ["14:00", "18:00"]]
      }

      await supabase
        .from('profiles')
        .update({
          slot_duration_minutes: slotDuration,
          working_hours: defaultWorkingHours
        })
        .eq('id', user.id)

      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to save working hours')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-mono pb-12">
      <div>
        <Link
          to="/doctor"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Schedule Stream
        </Link>
        <Badge variant="mustard" className="mb-1">Availability Configuration</Badge>
        <h1 className="text-3xl font-serif font-bold text-foreground">
          Consultation Hours & Slot Interval
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Define your clinical operating schedule. Slots are automatically segmented based on your preferred duration.
        </p>
      </div>

      <Card className="border-t-4 border-t-primary shadow-soft dark:shadow-soft-dark">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="default">Schedule Rules</Badge>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-xl mt-1">Weekly Operating Windows</CardTitle>
          <CardDescription className="text-xs">
            Standard schedule: Monday to Friday (09:00 - 13:00, 14:00 - 18:00 UTC) with 1-hour midday recess.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider block font-bold">
                Consultation Slot Duration
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[15, 30, 45].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    onClick={() => setSlotDuration(mins)}
                    className={`p-3.5 rounded-2xl border text-center transition-all ${
                      slotDuration === mins
                        ? 'bg-secondary text-secondary-foreground border-secondary font-bold shadow-md'
                        : 'bg-card border-border hover:border-secondary text-muted-foreground'
                    }`}
                  >
                    <span className="text-lg font-bold font-serif block">{mins} Mins</span>
                    <span className="text-[10px] block opacity-80">Per Patient Slot</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-background/60 border border-border/80 text-xs space-y-2">
              <span className="font-bold text-foreground block">Active Days & Shifts:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                <div className="p-2.5 rounded-xl bg-card border border-border/60">
                  <span className="font-bold text-foreground block">Mon - Fri Morning</span>
                  <span>09:00 AM - 01:00 PM UTC</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/60">
                  <span className="font-bold text-foreground block">Mon - Fri Afternoon</span>
                  <span>02:00 PM - 06:00 PM UTC</span>
                </div>
              </div>
            </div>
          </CardContent>

          <div className="p-6 pt-0 flex items-center justify-between border-t border-border/50 mt-4">
            {saved ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Operating settings saved!
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                Changes take effect for future bookings immediately.
              </span>
            )}

            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
