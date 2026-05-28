'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserRole } from '@/lib/types'

interface UseAuthReturn {
  user: Profile | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()
      
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        // If no profile exists, create one
        if (profileError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
              email: authUser.email,
              role: 'VENDEDOR' as UserRole,
              active: true,
            })
            .select()
            .single()

          if (createError) {
            setError('Failed to create profile')
          } else {
            setUser(newProfile)
          }
        } else {
          setError(profileError.message)
        }
      } else {
        setUser(profile)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUser])

  return { user, isLoading, error, refetch: fetchUser }
}

export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, isLoading, error } = useAuth()
  
  const hasAccess = user && (!allowedRoles || allowedRoles.includes(user.role))
  
  return { user, isLoading, error, hasAccess }
}
