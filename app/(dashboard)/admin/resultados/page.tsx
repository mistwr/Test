'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Profile, Team, SalesResult } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { ClipboardList, Plus, Loader2, Pencil, Trash2, CalendarIcon, Search } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { cn } from '@/lib/utils'

export default function AdminResultadosPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [results, setResults] = useState<(SalesResult & { seller?: Profile, team?: Team })[]>([])
  const [sellers, setSellers] = useState<Profile[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingResult, setEditingResult] = useState<SalesResult | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  
  const [formData, setFormData] = useState({
    seller_id: '',
    date: new Date(),
    fibers: 0,
    tvs: 0,
    mobiles: 0,
    fixed_lines: 0,
    validated: 0,
    cancelled: 0,
    pending: 0,
    notes: '',
  })

  const fetchData = async () => {
    const supabase = createClient()

    // Fetch results
    const { data: resultsData } = await supabase
      .from('sales_results')
      .select('*')
      .order('date', { ascending: false })
      .limit(100)

    // Fetch profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['VENDEDOR', 'CHEFE_EQUIPA'])
      .eq('active', true)

    // Fetch teams
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')

    if (resultsData && profilesData && teamsData) {
      const resultsWithRelations = resultsData.map(result => ({
        ...result,
        seller: profilesData.find(p => p.id === result.seller_id),
        team: teamsData.find(t => t.id === result.team_id),
      }))

      setResults(resultsWithRelations)
      setSellers(profilesData)
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
    if (!formData.seller_id) {
      toast.error('Seleciona um vendedor')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    const seller = sellers.find(s => s.id === formData.seller_id)

    try {
      if (editingResult) {
        const { error } = await supabase
          .from('sales_results')
          .update({
            seller_id: formData.seller_id,
            team_id: seller?.team_id || null,
            date: format(formData.date, 'yyyy-MM-dd'),
            fibers: formData.fibers,
            tvs: formData.tvs,
            mobiles: formData.mobiles,
            fixed_lines: formData.fixed_lines,
            validated: formData.validated,
            cancelled: formData.cancelled,
            pending: formData.pending,
            notes: formData.notes,
          })
          .eq('id', editingResult.id)

        if (error) throw error
        toast.success('Resultado atualizado')
      } else {
        const { error } = await supabase
          .from('sales_results')
          .insert({
            seller_id: formData.seller_id,
            team_id: seller?.team_id || null,
            date: format(formData.date, 'yyyy-MM-dd'),
            fibers: formData.fibers,
            tvs: formData.tvs,
            mobiles: formData.mobiles,
            fixed_lines: formData.fixed_lines,
            validated: formData.validated,
            cancelled: formData.cancelled,
            pending: formData.pending,
            notes: formData.notes,
            created_by: user?.id,
          })

        if (error) throw error
        toast.success('Resultado registado')
      }

      setIsDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      toast.error('Erro ao guardar', {
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setEditingResult(null)
    setFormData({
      seller_id: '',
      date: new Date(),
      fibers: 0,
      tvs: 0,
      mobiles: 0,
      fixed_lines: 0,
      validated: 0,
      cancelled: 0,
      pending: 0,
      notes: '',
    })
  }

  const handleEdit = (result: SalesResult) => {
    setEditingResult(result)
    setFormData({
      seller_id: result.seller_id,
      date: new Date(result.date),
      fibers: result.fibers,
      tvs: result.tvs,
      mobiles: result.mobiles,
      fixed_lines: result.fixed_lines,
      validated: result.validated,
      cancelled: result.cancelled,
      pending: result.pending,
      notes: result.notes || '',
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (resultId: string) => {
    if (!confirm('Tens a certeza que queres eliminar este registo?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('sales_results')
      .delete()
      .eq('id', resultId)

    if (error) {
      toast.error('Erro ao eliminar')
    } else {
      toast.success('Registo eliminado')
      fetchData()
    }
  }

  const filteredResults = results.filter(r => {
    const matchesSearch = r.seller?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !filterDate || r.date === format(filterDate, 'yyyy-MM-dd')
    return matchesSearch && matchesDate
  })

  if (authLoading || isLoading) {
    return <ResultadosSkeleton />
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
            <ClipboardList className="h-8 w-8 text-primary" />
            Resultados
          </h1>
          <p className="text-muted-foreground">
            Registar e gerir resultados de vendas
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Registo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingResult ? 'Editar Resultado' : 'Novo Resultado'}
                </DialogTitle>
                <DialogDescription>
                  Regista os resultados de vendas de um vendedor
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Vendedor</Label>
                  <Select
                    value={formData.seller_id}
                    onValueChange={(value) => setFormData({ ...formData, seller_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleciona um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.date, 'PPP', { locale: pt })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => date && setFormData({ ...formData, date })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-primary font-semibold">Fibras (KPI Principal)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.fibers}
                    onChange={(e) => setFormData({ ...formData, fibers: parseInt(e.target.value) || 0 })}
                    className="border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label>TVs</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.tvs}
                    onChange={(e) => setFormData({ ...formData, tvs: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Moveis</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.mobiles}
                    onChange={(e) => setFormData({ ...formData, mobiles: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fixos</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.fixed_lines}
                    onChange={(e) => setFormData({ ...formData, fixed_lines: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Validados</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.validated}
                    onChange={(e) => setFormData({ ...formData, validated: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cancelados</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.cancelled}
                    onChange={(e) => setFormData({ ...formData, cancelled: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pendentes</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.pending}
                    onChange={(e) => setFormData({ ...formData, pending: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observacoes opcionais..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingResult ? 'Guardar' : 'Registar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(!filterDate && 'text-muted-foreground')}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filterDate ? format(filterDate, 'PPP', { locale: pt }) : 'Filtrar por data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={filterDate}
              onSelect={setFilterDate}
            />
          </PopoverContent>
        </Popover>
        {filterDate && (
          <Button variant="ghost" onClick={() => setFilterDate(undefined)}>
            Limpar filtro
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Equipa</TableHead>
                  <TableHead className="text-right text-primary">Fibras</TableHead>
                  <TableHead className="text-right">TVs</TableHead>
                  <TableHead className="text-right">Moveis</TableHead>
                  <TableHead className="text-right">Fixos</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{format(new Date(result.date), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="font-medium">{result.seller?.full_name || '-'}</TableCell>
                    <TableCell>{result.team?.name || '-'}</TableCell>
                    <TableCell className="text-right font-bold text-primary">{result.fibers}</TableCell>
                    <TableCell className="text-right">{result.tvs}</TableCell>
                    <TableCell className="text-right">{result.mobiles}</TableCell>
                    <TableCell className="text-right">{result.fixed_lines}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Badge variant="default" className="bg-green-500">{result.validated}V</Badge>
                        <Badge variant="destructive">{result.cancelled}C</Badge>
                        <Badge variant="secondary">{result.pending}P</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEdit(result)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(result.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ResultadosSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
