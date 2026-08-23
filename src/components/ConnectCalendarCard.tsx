import { Calendar, CheckCircle2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'

import { supabase } from '@/lib/supabase'

export function ConnectCalendarCard() {
  const { profile } = useAuth()
  const isConnected = Boolean(profile?.google_credentials)

  const handleConnect = async () => {
    // Get token to pass to backend so it knows who is authenticating
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token || ''
    
    // Direct browser redirect to FastAPI OAuth initiation endpoint
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
    window.location.href = `${backendUrl}/calendar/auth?token=${token}`
  }

  if (isConnected) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Google Calendar Synchronized</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Appointments and medication alerts are automatically synchronized to your schedule.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
            Active Sync
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-secondary/40 bg-gradient-to-br from-card to-secondary/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="mustard">Seamless Schedule</Badge>
          <Calendar className="w-5 h-5 text-secondary" />
        </div>
        <CardTitle className="text-xl mt-1">Sync With Your Life</CardTitle>
        <CardDescription>
          Connect your Google Calendar so all appointment slots and daily prescription schedules appear on your personal devices automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleConnect}
          variant="secondary"
          className="w-full sm:w-auto gap-2 font-mono"
        >
          <Calendar className="w-4 h-4" />
          Connect Google Calendar
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </Button>
      </CardContent>
    </Card>
  )
}

export default ConnectCalendarCard
