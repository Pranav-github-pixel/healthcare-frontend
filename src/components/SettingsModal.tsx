import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, Mail, Lock, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { profile, user, updateProfile, updateSecurity, uploadAvatar } = useAuth()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Profile State
  const [fullName, setFullName] = useState(profile?.full_name || '')
  
  // Security State
  const [email, setEmail] = useState(user?.email || '')
  const [password, setPassword] = useState('')
  
  // Avatar upload ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync state if profile loads later
  React.useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name)
    if (user?.email) setEmail(user.email)
  }, [profile, user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return
    setLoading(true)
    setMsg(null)
    const { error } = await updateProfile({ full_name: fullName })
    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Profile updated successfully!' })
    }
    setLoading(false)
  }

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    
    // Only send fields that actually changed
    const emailToUpdate = email !== user?.email ? email : undefined
    const passToUpdate = password.trim() ? password : undefined
    
    if (!emailToUpdate && !passToUpdate) {
      setLoading(false)
      return
    }

    const { error } = await updateSecurity(emailToUpdate, passToUpdate)
    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ 
        type: 'success', 
        text: emailToUpdate 
          ? 'Check your new email for a verification link to confirm the change.' 
          : 'Password updated successfully!' 
      })
      setPassword('')
    }
    setLoading(false)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setMsg(null)
    const { error } = await uploadAvatar(file)
    if (error) {
      setMsg({ type: 'error', text: `Upload failed: ${error.message}` })
    } else {
      setMsg({ type: 'success', text: 'Profile picture updated!' })
    }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 sm:p-6"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-lg rounded-3xl border border-border/50 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Account Settings</h2>
                  <p className="text-xs text-muted-foreground">Manage your profile and security preferences.</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border/50 px-2">
                <button
                  onClick={() => { setActiveTab('profile'); setMsg(null) }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <User className="w-4 h-4" /> Profile Info
                </button>
                <button
                  onClick={() => { setActiveTab('security'); setMsg(null) }}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === 'security' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> Security
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto">
                {msg && (
                  <div className={`mb-6 p-3 rounded-2xl border text-xs flex items-center gap-2 ${
                    msg.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
                      : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  }`}>
                    {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                    <span>{msg.text}</span>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center relative">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-muted-foreground" />
                          )}
                          
                          {/* Hover Overlay */}
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                          >
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">Profile Picture</h3>
                        <p className="text-xs text-muted-foreground mb-2">JPG, GIF or PNG. Max size of 5MB.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={loading}
                          className="h-8 text-xs rounded-xl"
                        >
                          Upload New
                        </Button>
                      </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
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
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none transition-all"
                          />
                        </div>
                      </div>
                      <Button type="submit" disabled={loading} className="w-full h-10 rounded-xl">
                        Save Profile Changes
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === 'security' && (
                  <form onSubmit={handleSecuritySubmit} className="space-y-4">
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
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        If you change your email, a confirmation link will be sent to the new address.
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/50">
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Leave blank to keep current password"
                          className="w-full h-10 pl-10 pr-4 rounded-xl bg-background border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={loading || (email === user?.email && !password.trim())} className="w-full h-10 rounded-xl mt-4">
                      Update Security Settings
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
