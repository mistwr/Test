import { createClient } from '@/lib/supabase/server'
import { UserRole } from '@/lib/types'

// Normalize role to uppercase format for comparison
export function normalizeRole(role: string): UserRole {
  const upperRole = role.toUpperCase()
  if (upperRole === 'ADMIN') return 'ADMIN'
  if (upperRole === 'CHEFE_EQUIPA' || upperRole === 'SUPERVISOR') return 'CHEFE_EQUIPA'
  if (upperRole === 'VENDEDOR' || upperRole === 'PARCEIRO') return 'VENDEDOR'
  return 'VENDEDOR'
}

// Check if role matches (case-insensitive)
export function hasRole(userRole: string | undefined | null, ...allowedRoles: UserRole[]): boolean {
  if (!userRole) return false
  const normalized = normalizeRole(userRole)
  return allowedRoles.includes(normalized)
}

// Verify the current user is authenticated and has one of the allowed roles
export async function verifyRole(...allowedRoles: UserRole[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, status: 401, message: 'Nao autenticado', user: null, profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { ok: false, status: 403, message: 'Perfil nao encontrado', user, profile: null }
  }

  if (!hasRole(profile.role, ...allowedRoles)) {
    return { 
      ok: false, 
      status: 403, 
      message: `Acesso restrito a: ${allowedRoles.join(', ')}`, 
      user, 
      profile 
    }
  }

  return { ok: true, status: 200, message: 'ok', user, profile }
}
