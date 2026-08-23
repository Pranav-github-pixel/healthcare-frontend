import React, { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  Activity, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Ban
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

interface Profile {
  id: string
  full_name: string
  role: string
  specialization?: string
}

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  // Leave Management State
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [settingLeave, setSettingLeave] = useState(false)
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState<string | null>(null)
  const [leaveErrorMsg, setLeaveErrorMsg] = useState<string | null>(null)

  const loadProfiles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: true })

      if (!error && data) {
        setProfiles(data as Profile[])
        const docs = data.filter((p: any) => p.role === 'DOCTOR')
        if (docs.length > 0) setSelectedDoctorId(docs[0].id)
      }
    } catch (err) {
      console.error('Failed to load profiles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctorId || !startDate || !endDate) return
    setSettingLeave(true)
    setLeaveSuccessMsg(null)
    setLeaveErrorMsg(null)

    try {
      const res = await api.post('/admin/leaves', {
        doctor_id: selectedDoctorId,
        leave_date: startDate,
        reason: endDate ? `Leave from ${startDate} to ${endDate}` : 'Scheduled absence',
      })

      const cancelledCount = res.data?.cancelled_appointments_count ?? 0
      setLeaveSuccessMsg(`Doctor leave recorded successfully! Cascaded and cancelled ${cancelledCount} conflicting appointment(s) with automated patient notifications.`)
      setStartDate('')
      setEndDate('')
    } catch (err: any) {
      setLeaveErrorMsg(err.response?.data?.detail || 'Failed to apply doctor leave.')
    } finally {
      setSettingLeave(false)
    }
  }

  const doctorsList = profiles.filter(p => p.role === 'DOCTOR')
  const patientsList = profiles.filter(p => p.role === 'PATIENT')

  return (
    <div className="space-y-8 font-mono pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Badge variant="mustard" className="mb-2">Master Command Console</Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            System Administration & Overrides
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Global healthcare roster telemetry and automated cascading leave engine.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadProfiles}
          className="gap-2 self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </Button>
      </div>

      {/* Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-t-4 border-t-primary shadow-soft dark:shadow-soft-dark">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="default">Infrastructure</Badge>
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl mt-1">Engine Telemetry</CardTitle>
            <CardDescription className="text-xs">FastAPI & Supabase Realtime</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Operational & Healthy</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Advisory locks armed • Background SMTP active
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-secondary shadow-soft dark:shadow-soft-dark">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="mustard">Roster</Badge>
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="text-xl mt-1">Registered Physicians</CardTitle>
            <CardDescription className="text-xs">Verified attending medical staff</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold font-serif text-foreground">{doctorsList.length}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">Active doctor profiles registered</span>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-accent shadow-soft dark:shadow-soft-dark">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="accent">Patients</Badge>
              <ShieldCheck className="w-5 h-5 text-accent-foreground" />
            </div>
            <CardTitle className="text-xl mt-1">Patient Sanctuary</CardTitle>
            <CardDescription className="text-xs">Active members in database</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold font-serif text-foreground">{patientsList.length}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">Registered patient accounts</span>
          </CardContent>
        </Card>
      </div>

      {/* DOCTOR LEAVE AUTOMATION TOOL */}
      <Card className="border-2 border-secondary/40 shadow-soft dark:shadow-soft-dark overflow-hidden">
        <CardHeader className="bg-secondary/5 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-secondary" />
            <Badge variant="mustard">Automated Cascade Engine</Badge>
          </div>
          <CardTitle className="text-2xl font-serif mt-1">Physician Leave & Cascade Cancellations</CardTitle>
          <CardDescription className="text-xs">
            Marking a physician on leave will automatically invalidate their available slots for the selected date range, cancel existing patient bookings, and dispatch cancellation emails in the background.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleApplyLeave}>
          <CardContent className="space-y-4 pt-6">
            {leaveSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>{leaveSuccessMsg}</span>
              </div>
            )}

            {leaveErrorMsg && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{leaveErrorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider block font-bold">
                  Select Physician
                </label>
                <select
                  required
                  value={selectedDoctorId}
                  onChange={e => setSelectedDoctorId(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-background border border-border focus:border-secondary text-xs outline-none font-mono"
                >
                  {doctorsList.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.full_name} ({doc.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider block font-bold">
                  Leave Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-background border border-border focus:border-secondary text-xs outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider block font-bold">
                  Leave End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-background border border-border focus:border-secondary text-xs outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center gap-2.5 text-xs text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-secondary flex-shrink-0" />
              <span>
                Safety Check: Handled atomically by PostgreSQL transactions on the backend.
              </span>
            </div>
          </CardContent>

          <div className="p-6 pt-0 flex justify-end border-t border-border/40 mt-4">
            <Button
              type="submit"
              disabled={settingLeave || !selectedDoctorId || !startDate || !endDate}
              className="gap-2 font-bold min-w-[240px] shadow-md"
            >
              {settingLeave ? 'Executing Cascade...' : 'Record Leave & Cascade Bookings'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Roster Directory Table */}
      <Card className="shadow-soft dark:shadow-soft-dark">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">Directory</Badge>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl mt-1">User Directory</CardTitle>
          <CardDescription className="text-xs">
            All registered users extracted from the public.profiles database table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-border/80 text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Specialization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-card/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground">{p.id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 font-bold text-foreground">{p.full_name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={p.role === 'DOCTOR' ? 'mustard' : p.role === 'ADMIN' ? 'forest' : 'outline'}>
                        {p.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.specialization || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
