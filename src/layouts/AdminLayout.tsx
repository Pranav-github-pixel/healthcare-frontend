import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { ShieldCheck, LogOut, Settings, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import SettingsModal from '@/components/SettingsModal'

export default function AdminLayout() {
  const { profile, signOut } = useAuth()
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-mono transition-colors duration-500">
      {/* Admin Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border/60 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <ShieldCheck className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-foreground block">
                  HealthCare
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground block -mt-1">
                  Master Command Console
                </span>
              </div>
            </Link>
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
              <span className="font-bold text-foreground pr-1">
                Admin: {profile?.full_name || 'Root'}
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

      {/* Main Admin Content Outlet */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
        <Outlet />
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40 font-mono">
        HealthCare Master Command Console • Cascading Leave System Armed
      </footer>
      
      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
