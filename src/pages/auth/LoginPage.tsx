import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Lock, Mail, User, ShieldCheck, Stethoscope, ArrowRight, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth, UserRole } from '@/hooks/useAuth'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('PATIENT')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { signIn, signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSubmitting(true)

    try {
      let targetRole = role
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName, role)
        if (error) {
          setErrorMsg(error.message)
          setSubmitting(false)
          return
        }
      } else {
        const { error, role: fetchedRole } = await signIn(email, password)
        if (error) {
          setErrorMsg(error.message)
          setSubmitting(false)
          return
        }
        if (fetchedRole) {
          targetRole = fetchedRole as UserRole
        }
      }

      // Successful auth: redirect based on intended role / destination
      if (from) {
        navigate(from, { replace: true })
      } else {
        if (targetRole === 'DOCTOR') navigate('/doctor', { replace: true })
        else if (targetRole === 'ADMIN') navigate('/admin', { replace: true })
        else navigate('/patient', { replace: true })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between relative overflow-hidden transition-colors duration-500 font-mono">
      {/* Animated Glassy Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten" 
        />
        <motion.div 
          animate={{ x: [0, -40, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/4 right-0 w-[30rem] h-[30rem] bg-secondary/20 rounded-full blur-3xl opacity-40 mix-blend-multiply dark:mix-blend-lighten" 
        />
        <motion.div 
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-32 left-1/3 w-96 h-96 bg-accent/30 rounded-full blur-3xl opacity-50 mix-blend-multiply dark:mix-blend-lighten" 
        />
      </div>

      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full relative z-20">
        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Heart className="w-5 h-5 fill-secondary text-secondary" />
          </div>
          <div>
            <span className="text-2xl font-bold tracking-tight text-foreground block group-hover:text-primary transition-colors">
              HealthCare
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground block -mt-1">
              Thoughtful Health
            </span>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="glass-card">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-fit mb-2">
                <Badge variant="mustard" className="text-xs uppercase tracking-wider">
                  {isSignUp ? 'New Member Registration' : 'Secure Member Portal'}
                </Badge>
              </div>
              <CardTitle className="text-3xl">
                {isSignUp ? 'Create Your Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-xs">
                {isSignUp
                  ? 'Join HealthCare for personalized healthcare scheduling and AI guidance.'
                  : 'Enter your credentials to access your clinical dashboard.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <AnimatePresence mode="wait">
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3.5"
                    >
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Eleanor Vance"
                            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-background border border-border focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Account Role
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'PATIENT', label: 'Patient', icon: Heart },
                            { id: 'DOCTOR', label: 'Doctor', icon: Stethoscope },
                            { id: 'ADMIN', label: 'Admin', icon: ShieldCheck },
                          ].map((r) => {
                            const Icon = r.icon
                            return (
                              <button
                                type="button"
                                key={r.id}
                                onClick={() => setRole(r.id as UserRole)}
                                className={`p-2.5 rounded-2xl border text-xs flex flex-col items-center gap-1 transition-all ${
                                  role === r.id
                                    ? 'bg-primary text-primary-foreground border-primary font-bold shadow-sm'
                                    : 'border-border text-muted-foreground hover:border-secondary hover:text-foreground'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{r.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      placeholder="name@domain.com"
                      className="w-full h-11 pl-10 pr-4 rounded-2xl bg-background border border-border focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-4 rounded-2xl bg-background border border-border focus:border-secondary focus:ring-1 focus:ring-secondary text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full gap-2 h-12 text-base font-semibold mt-2 shadow-md"
                >
                  {submitting ? (
                    'Processing...'
                  ) : isSignUp ? (
                    <>
                      Create HealthCare Account <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
                
                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative bg-card px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    Or continue with
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true)
                    const { error } = await signInWithGoogle()
                    if (error) setErrorMsg(error.message)
                    setSubmitting(false)
                  }}
                  className="w-full gap-2 h-11 text-sm font-semibold"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google Account
                </Button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setErrorMsg(null)
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  {isSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account yet? Sign up"}
                </button>
              </div>


            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        HealthCare Secure Healthcare Portal • Supabase Auth Guarded
      </footer>
    </div>
  )
}
