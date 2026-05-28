'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Team, Profile } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Building2, Plus, Users, Loader2, Pencil, Trash2 } from 'lucide-react'

export default function AdminEquipasPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [teams, setTeams] = useState<(Team & { members: Profile[], supervisor: Profile | null })[]>([])
  const [supervisors, setSupervisors] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    supervisor_id: '',
  })

  const fetchData = async () => {
    const supabase = createClient()

    // Fetch teams with members
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false })

    // Fetch all profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .eq('active', true)

    if (teamsData && profilesData) {
      const teamsWithMembers = teamsData.map(team => ({
        ...team,
        members: profilesData.filter(p => p.team_id === team.id),
        supervisor: profilesData.find(p => p.id === team.supervisor_id) || null,
      }))
      setTeams(teamsWithMembers)
      setSupervisors(profilesData.filter(p => p.role === 'CHEFE_EQUIPA'))
    }

    setIsLoading(false)
  }

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    fetchData()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Nome da equipa e obrigatorio')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      if (editingTeam) {
        const { error } = await supabase
          .from('teams')
          .update({
            name: formData.name,
            supervisor_id: formData.supervisor_id || null,
          })
          .eq('id', editingTeam.id)

        if (error) throw error
        toast.success('Equipa atualizada com sucesso')
      } else {
        const { error } = await supabase
          .from('teams')
          .insert({
            name: formData.name,
            supervisor_id: formData.supervisor_id || null,
          })

        if (error) throw error
        toast.success('Equipa criada com sucesso')
      }

      setIsDialogOpen(false)
      setEditingTeam(null)
      setFormData({ name: '', supervisor_id: '' })
      fetchData()
    } catch (error: any) {
      toast.error('Erro ao guardar equipa', {
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (team: Team) => {
    setEditingTeam(team)
    setFormData({
      name: team.name,
      supervisor_id: team.supervisor_id || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (teamId: string) => {
    if (!confirm('Tens a certeza que queres eliminar esta equipa?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)

    if (error) {
      toast.error('Erro ao eliminar equipa', {
        description: error.message,
      })
    } else {
      toast.success('Equipa eliminada')
      fetchData()
    }
  }

  if (authLoading || isLoading) {
    return <EquipasSkeleton />
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso nao autorizado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Equipas
          </h1>
          <p className="text-muted-foreground">
            Gerir equipas e atribuir supervisores
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingTeam(null)
            setFormData({ name: '', supervisor_id: '' })
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Equipa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTeam ? 'Editar Equipa' : 'Nova Equipa'}
                </DialogTitle>
                <DialogDescription>
                  {editingTeam 
                    ? 'Atualiza os detalhes da equipa'
                    : 'Cria uma nova equipa e atribui um supervisor'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Equipa</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Equipa Norte"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supervisor">Chefe de Equipa</Label>
                  <Select
                    value={formData.supervisor_id}
                    onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleciona um supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sem supervisor</SelectItem>
                      {supervisors.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id}>
                          {sup.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTeam ? 'Guardar' : 'Criar Equipa'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Teams Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleEdit(team)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(team.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {team.supervisor && (
                <Badge variant="secondary" className="w-fit">
                  Chefe: {team.supervisor.full_name}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">{team.members.length} membros</span>
              </div>
              {team.members.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {team.members.slice(0, 5).map((member) => (
                    <Badge key={member.id} variant="outline" className="text-xs">
                      {member.full_name?.split(' ')[0]}
                    </Badge>
                  ))}
                  {team.members.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{team.members.length - 5}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {teams.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Ainda nao ha equipas</p>
              <p className="text-sm text-muted-foreground">Cria a primeira equipa para comecar</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function EquipasSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
