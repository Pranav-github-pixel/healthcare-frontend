import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface NotificationItem {
  id: string
  type: string
  message: string
  created_at: string
}

export function useRealtimeNotifications() {
  const { user } = useAuth()
  const [toast, setToast] = useState<NotificationItem | null>(null)

  useEffect(() => {
    if (!user) return

    // Subscribe to real-time inserts on the notifications table for this user
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem
          setToast(newNotif)
          // Auto-dismiss after 6 seconds
          setTimeout(() => {
            setToast((current) => (current?.id === newNotif.id ? null : current))
          }, 6000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const dismiss = () => setToast(null)

  return { toast, dismiss }
}

export function NotificationToastBanner() {
  const { toast, dismiss } = useRealtimeNotifications()

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed top-5 right-5 z-50 max-w-md w-full px-4"
        >
          <div className="p-4 rounded-3xl bg-card border-2 border-secondary/60 text-card-foreground shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 font-mono">
            <div className="p-2 rounded-2xl bg-secondary text-secondary-foreground flex-shrink-0 mt-0.5">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                <span>Live Health Alert</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={dismiss}
              className="p-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
