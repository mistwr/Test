'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Campaign } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { 
  Plus, 
  Megaphone,
  Edit,
  Trash2,
  Calendar,
  FileText,
  Loader2,
} from 'lucide-react'

export default function AdminCampanhasPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [active, setActive] = useState(true)

  const canManage = user?.role === 'ADMIN' || user?.role === 'CHEFE_EQUIPA'

  useEffect(() => {
    if (user && !canManage) {
      router.push('/dashboard')
    }
  }, [user, canManage, router])

  const fetchCampaigns = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        creator:profiles!campaigns_created_by_fkey(id, full_name),
        materials:campaign_materials(id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erro ao carregar campanhas')
    } else {
      setCampaigns(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (canManage) {
      fetchCampaigns()
    }
  }, [canManage])

  const openCreateDialog = () => {
    setSelectedCampaign(null)
    setTitle('')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setActive(true)
    setDialogOpen(true)
  }

  const openEditDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setTitle(campaign.title)
    setDescription(campaign.description || '')
    setStartDate(campaign.start_date || '')
    setEndDate(campaign.end_date || '')
    setActive(campaign.active)
    setDialogOpen(true)
  }

  const openDeleteDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setDeleteDialogOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('O título é obrigatório')
      return
    }

    setSaving(true)
    const supabase = createClient()

    try {
      if (selectedCampaign) {
        // Update
        const { error } = await supabase
          .from('campaigns')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            start_date: startDate || null,
            end_date: endDate || null,
            active,
          })
          .eq('id', selectedCampaign.id)

        if (error) throw error
        toast.success('Campanha atualizada com sucesso')
      } else {
        // Create
        const { error } = await supabase
          .from('campaigns')
          .insert({
            title: title.trim(),
            description: description.trim() || null,
            start_date: startDate || null,
            end_date: endDate || null,
            active,
            created_by: user?.id,
          })

        if (error) throw error
        toast.success('Campanha criada com sucesso')
      }

      setDialogOpen(false)
      fetchCampaigns()
    } catch (error) {
      toast.error('Erro ao guardar campanha')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedCampaign) return

    const supabase = createClient()

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', selectedCampaign.id)

    if (error) {
      toast.error('Erro ao eliminar campanha')
    } else {
      toast.success('Campanha eliminada com sucesso')
      fetchCampaigns()
    }

    setDeleteDialogOpen(false)
    setSelectedCampaign(null)
  }

  if (!canManage) {
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-primary" />
            Gerir Campanhas
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gira campanhas para organizar materiais de vendas
          </p>
        </div>
        
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campanhas</CardTitle>
          <CardDescription>
            Lista de todas as campanhas criadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">Nenhuma campanha criada</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Crie a primeira campanha para organizar os materiais
              </p>
              <Button onClick={openCreateDialog} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Campanha
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Materiais</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{campaign.title}</p>
                        {campaign.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {campaign.start_date || campaign.end_date ? (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {campaign.start_date && format(new Date(campaign.start_date), 'd MMM', { locale: pt })}
                          {campaign.start_date && campaign.end_date && ' - '}
                          {campaign.end_date && format(new Date(campaign.end_date), 'd MMM yyyy', { locale: pt })}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sem período</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{(campaign.materials as unknown[])?.length || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaign.active ? 'default' : 'secondary'}>
                        {campaign.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(campaign)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(campaign)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCampaign ? 'Editar Campanha' : 'Nova Campanha'}
            </DialogTitle>
            <DialogDescription>
              {selectedCampaign 
                ? 'Atualize os detalhes da campanha'
                : 'Crie uma nova campanha para organizar materiais'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nome da campanha"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da campanha..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Estado</Label>
                <p className="text-sm text-muted-foreground">
                  Campanhas ativas são visíveis para todos
                </p>
              </div>
              <Switch
                checked={active}
                onCheckedChange={setActive}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A guardar...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar campanha?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar a campanha &quot;{selectedCampaign?.title}&quot;? 
              Todos os materiais associados também serão eliminados. Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
