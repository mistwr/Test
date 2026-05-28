'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Profile, Team, UserRole } from '@/lib/types'
import { calculateCommission, formatCurrency } from '@/lib/commissions'
import { Card, CardContent } from '@/components/ui/card'
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
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Users, Plus, Loader2, Pencil, Search, KeyRound, Trash2, Eye, EyeOff } from 'lucide-react'
import { TierBadge } from '@/components/dashboard/stat-cards'

interface SellerWithStats extends Profile {
  team?: Team
  fibers: number
  tvs: number
  mobiles: number
  fixed: number
}

export default function AdminVendedoresPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [sellers, setSellers] = useState<SellerWithStats[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Password reset dialog
  const [passwordTarget, setPasswordTarget] = useState<Profile | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'VENDEDOR' as UserRole,
    team_id: '',
    active: true,
  })

  const resetForm = () =>
    setFormData({ full_name: '', email: '', password: '', role: 'VENDEDOR', team_id: '', active: true })

  const fetchData = async () => {
    const supabase = createClient()
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: profilesData } = await supabase.from('profiles').select('*').order('full_name')
    const { data: teamsData } = await supabase.from('teams').select('*')
    const { data: salesData } = await supabase
      .from('sales_results')
      .select('*')
      .gte('date', firstDayOfMonth)
      .lte('date', lastDayOfMonth)

    if (profilesData && teamsData) {
      const sellersWithStats = profilesData.map((profile) => {
        const team = teamsData.find((t) => t.id === profile.team_id)
        const sellerSales = salesData?.filter((s) => s.seller_id === profile.id) || []
        const totals = sellerSales.reduce(
          (acc, sale) => ({
            fibers: acc.fibers + sale.fibers,
            tvs: acc.tvs + sale.tvs,
            mobiles: acc.mobiles + sale.mobiles,
            fixed: acc.fixed + sale.fixed_lines,
          }),
          { fibers: 0, tvs: 0, mobiles: 0, fixed: 0 },
        )
        return { ...profile, team, ...totals }
      })
      setSellers(sellersWithStats)
      setTeams(teamsData)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (user?.role !== 'ADMIN') return
    fetchData()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.full_name.trim()) {
      toast.error('Nome e obrigatorio')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      if (editingProfile) {
        // Update existing profile (does not touch auth credentials)
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            role: formData.role,
            team_id: formData.team_id || null,
            active: formData.active,
          })
          .eq('id', editingProfile.id)

        if (error) throw error
        toast.success('Perfil atualizado com sucesso')
      } else {
        // Create new user via admin API (email + password)
        if (!formData.email.trim() || !formData.password.trim()) {
          toast.error('Email e password sao obrigatorios')
          setIsSubmitting(false)
          return
        }

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim(),
            password: formData.password,
            full_name: formData.full_name.trim(),
            role: formData.role,
            team_id: formData.team_id || null,
          }),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error)

        toast.success('Conta criada com sucesso', {
          description: `${formData.email} pode agora fazer login`,
        })
      }

      setIsDialogOpen(false)
      setEditingProfile(null)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast.error('Erro ao guardar', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!passwordTarget || newPassword.length < 4) {
      toast.error('A password deve ter pelo menos 4 caracteres')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passwordTarget.id, password: newPassword }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success('Password alterada com sucesso')
      setPasswordTarget(null)
      setNewPassword('')
    } catch (error: any) {
      toast.error('Erro ao alterar password', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      toast.success('Utilizador eliminado')
      setDeleteTarget(null)
      fetchData()
    } catch (error: any) {
      toast.error('Erro ao eliminar', { description: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile)
    setFormData({
      full_name: profile.full_name || '',
      email: profile.email || '',
      password: '',
      role: profile.role,
      team_id: profile.team_id || '',
      active: profile.active,
    })
    setIsDialogOpen(true)
  }

  const openCreate = () => {
    setEditingProfile(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const toggleActive = async (profile: Profile) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ active: !profile.active })
      .eq('id', profile.id)

    if (error) {
      toast.error('Erro ao atualizar estado')
    } else {
      toast.success(profile.active ? 'Utilizador desativado' : 'Utilizador ativado')
      fetchData()
    }
  }

  const filteredSellers = sellers.filter(
    (s) =>
      s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (authLoading || isLoading) {
    return <VendedoresSkeleton />
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
            <Users className="h-8 w-8 text-primary" />
            Vendedores
          </h1>
          <p className="text-muted-foreground">Gerir utilizadores, roles e equipas</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Conta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{sellers.length}</div>
            <p className="text-sm text-muted-foreground">Total Utilizadores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{sellers.filter((s) => s.role === 'VENDEDOR').length}</div>
            <p className="text-sm text-muted-foreground">Vendedores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{sellers.filter((s) => s.role === 'CHEFE_EQUIPA').length}</div>
            <p className="text-sm text-muted-foreground">Chefes de Equipa</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{sellers.filter((s) => s.active).length}</div>
            <p className="text-sm text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Equipa</TableHead>
                  <TableHead className="text-right">Fibras</TableHead>
                  <TableHead className="text-right">Patamar</TableHead>
                  <TableHead className="text-right">Comissao</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.map((seller) => {
                  const commission = calculateCommission(seller.fibers, seller.tvs, seller.mobiles, seller.fixed)
                  return (
                    <TableRow key={seller.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{seller.full_name}</p>
                          <p className="text-xs text-muted-foreground">{seller.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            seller.role === 'ADMIN'
                              ? 'destructive'
                              : seller.role === 'CHEFE_EQUIPA'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {seller.role === 'ADMIN'
                            ? 'Admin'
                            : seller.role === 'CHEFE_EQUIPA'
                              ? 'Chefe'
                              : 'Vendedor'}
                        </Badge>
                      </TableCell>
                      <TableCell>{seller.team?.name || '-'}</TableCell>
                      <TableCell className="text-right font-medium text-primary">{seller.fibers}</TableCell>
                      <TableCell className="text-right">
                        <TierBadge tierName={commission.currentTier.tierName} size="sm" />
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(commission.totalCommission)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={seller.active} onCheckedChange={() => toggleActive(seller)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEdit(seller)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Alterar password"
                            onClick={() => {
                              setPasswordTarget(seller)
                              setNewPassword('')
                            }}
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {seller.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Eliminar"
                              onClick={() => setDeleteTarget(seller)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingProfile(null)
            resetForm()
            setShowPassword(false)
          }
        }}
      >
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingProfile ? 'Editar Utilizador' : 'Criar Nova Conta'}</DialogTitle>
              <DialogDescription>
                {editingProfile
                  ? 'Atualiza os detalhes do utilizador'
                  : 'Define o email e password de acesso para o novo utilizador'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              {!editingProfile && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Define a password de acesso"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                    <SelectItem value="CHEFE_EQUIPA">Chefe de Equipa</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="team">Equipa</Label>
                <Select
                  value={formData.team_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, team_id: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleciona uma equipa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem equipa</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editingProfile && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Utilizador ativo</Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingProfile ? 'Guardar' : 'Criar Conta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog
        open={!!passwordTarget}
        onOpenChange={(open) => {
          if (!open) {
            setPasswordTarget(null)
            setNewPassword('')
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Password</DialogTitle>
            <DialogDescription>
              Define uma nova password para {passwordTarget?.full_name} ({passwordTarget?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="new_password">Nova Password</Label>
            <Input
              id="new_password"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova password de acesso"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={handlePasswordReset} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Alterar Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar utilizador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao e permanente. A conta de {deleteTarget?.full_name} ({deleteTarget?.email}) sera eliminada e
              perdera o acesso a aplicacao.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function VendedoresSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
