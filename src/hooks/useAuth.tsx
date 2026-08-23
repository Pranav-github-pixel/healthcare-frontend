import React, { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN'

export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  specialization?: string | null
  google_credentials?: Record<string, any> | null
  avatar_url?: string | null
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null, role?: UserRole | null }>
  signUp: (email: string, password: string, fullName: string, role?: UserRole) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>
  updateSecurity: (email?: string, password?: string) => Promise<{ error: Error | null }>
  uploadAvatar: (file: File) => Promise<{ error: Error | null, url: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as UserProfile)
      } else {
        console.warn('Profile not found for user:', userId, error?.message)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
    }
  }

  useEffect(() => {
    // Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Sync Google Avatar if custom one is missing
  const activeAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null

  const profileWithFallback = profile ? { ...profile, avatar_url: activeAvatarUrl } : null

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) return { error }
      
      let fetchedRole = null
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()
        if (profileData) fetchedRole = profileData.role
      }
      return { error: null, role: fetchedRole }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: UserRole = 'PATIENT') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })
      if (error) return { error }

      // Update role explicitly if needed
      if (data.user && role !== 'PATIENT') {
        await supabase
          .from('profiles')
          .update({ role, full_name: fullName })
          .eq('id', data.user.id)
      }

      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/patient` // Default redirect
        }
      })
      if (error) return { error }
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user?.id) return { error: new Error('No user logged in') }
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
      if (error) return { error }
      
      // Optimistically update local state
      setProfile((prev) => prev ? { ...prev, ...updates } : null)
      
      // Also update auth user metadata if full_name changed
      if (updates.full_name) {
        await supabase.auth.updateUser({
          data: { full_name: updates.full_name }
        })
      }
      
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const updateSecurity = async (email?: string, password?: string) => {
    try {
      const updates: any = {}
      if (email) updates.email = email
      if (password) updates.password = password
      
      const { error } = await supabase.auth.updateUser(updates)
      if (error) return { error }
      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user?.id) return { error: new Error('No user logged in'), url: null }
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) return { error: uploadError, url: null }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      // Update profile with new URL
      const { error: profileError } = await updateProfile({ avatar_url: data.publicUrl })
      if (profileError) return { error: profileError, url: null }
      
      return { error: null, url: data.publicUrl }
    } catch (err) {
      return { error: err as Error, url: null }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile: profileWithFallback,
        role: profile?.role ?? null,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
        updateProfile,
        updateSecurity,
        uploadAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
