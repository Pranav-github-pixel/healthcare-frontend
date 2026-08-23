import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Heart, Calendar, Pill, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { NotificationToastBanner } from '@/components/NotificationToast'
import { useAuth } from '@/hooks/useAuth'
import SettingsModal from '@/components/SettingsModal'

export default function PatientLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const navItems = [
    { label: 'Overview', path: '/patient', icon: Heart },
    { label: 'Book Appointment', path: '/patient/book', icon: Calendar },
    { label: 'Prescriptions', path: '/patient/medications', icon: Pill },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono transition-colors duration-500">
      {/* Real-time Notification Banner */}
      <NotificationToastBanner />

      {/* Patient Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border/60 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Heart className="w-4 h-4 fill-secondary text-secondary" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-foreground block">
                  HealthCare
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground block -mt-1">
                  Patient Sanctuary
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-border/60">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-card'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-card border border-border/70 text-sm hover:border-primary/50 transition-colors shadow-sm"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-7 h-7 rounded-full object-cover border border-border/50" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center border border-border/50">
                  <User className="w-4 h-4 text-secondary" />
                </div>
              )}
              <span className="font-bold text-foreground truncate max-w-[140px] pr-1">
                {profile?.full_name || 'Patient'}
              </span>
            </button>
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="rounded-2xl h-10 w-10 text-muted-foreground hover:text-primary hover:border-primary/40 sm:hidden"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={signOut}
              title="Sign Out"
              className="rounded-2xl h-10 w-10 text-muted-foreground hover:text-red-600 hover:border-red-500/40"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Patient Content Outlet */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <Outlet />
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40 font-mono">
        HealthCare Patient Sanctuary • Connected to Health Engine
      </footer>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
