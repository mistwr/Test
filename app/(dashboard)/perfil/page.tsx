'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { UserCircle, Save, Loader2, LogOut, Shield } from 'lucide-react'

export default function PerfilPage() {
  const router = useRouter()
  const { user, isLoading: authLoading, refetch } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [fullName, setFullName] = useState('')

  const handleSave = async () => {
    if (!user || !fullName.trim()) return

    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      toast.error('Erro ao guardar', { description: error.message })
    } else {
      toast.success('Perfil atualizado')
      refetch()
    }

    setIsSaving(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Sessao terminada')
    router.push('/login')
  }

  if (authLoading) {
    return <PerfilSkeleton />
  }

  if (!user) {
    return null
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      'ADMIN': { label: 'Administrador', variant: 'destructive' },
      'CHEFE_EQUIPA': { label: 'Chefe de Equipa', variant: 'default' },
      'VENDEDOR': { label: 'Vendedor', variant: 'secondary' },
    }
    return badges[role] || badges['VENDEDOR']
  }

  const badge = getRoleBadge(user.role)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-primary" />
          Meu Perfil
        </h1>
        <p className="text-muted-foreground">
          Gere as tuas informacoes pessoais
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{user.full_name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
              <Badge variant={badge.variant} className="mt-2">
                <Shield className="h-3 w-3 mr-1" />
                {badge.label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              defaultValue={user.full_name || ''}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="O teu nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email nao pode ser alterado
            </p>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={badge.label}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Contacta um administrador para alterar o role
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={isSaving || !fullName.trim()}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Guardar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Terminar Sessao
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function PerfilSkeleton() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  )
}
