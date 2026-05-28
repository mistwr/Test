'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Profile } from '@/lib/types'
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { ClipboardList, Plus, Loader2, CalendarIcon, Zap, Tv, Smartphone, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

export default function SupervisorResultadosPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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

  useEffect(() => {
    if (!user || user.role !== 'CHEFE_EQUIPA') return

    const fetchTeamMembers = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', user.team_id)
        .eq('role', 'VENDEDOR')
        .eq('active', true)
        .order('full_name')

      if (data) {
        setTeamMembers(data)
      }
      setIsLoading(false)
    }

    fetchTeamMembers()
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.seller_id) {
      toast.error('Seleciona um vendedor')
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('sales_results')
        .insert({
          seller_id: formData.seller_id,
          team_id: user?.team_id,
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

      toast.success('Resultado registado com sucesso!')
      setIsDialogOpen(false)
      resetForm()
    } catch (error: any) {
      toast.error('Erro ao registar', {
        description: error.message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
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

  if (authLoading || isLoading) {
    return <ResultadosSkeleton />
  }

  if (user?.role !== 'CHEFE_EQUIPA') {
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
            Registar Vendas
          </h1>
          <p className="text-muted-foreground">
            Regista os resultados de vendas da tua equipa
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              Registar Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Novo Registo de Vendas</DialogTitle>
                <DialogDescription>
                  Preenche os resultados do vendedor
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Vendedor</Label>
                  <Select
                    value={formData.seller_id}
                    onValueChange={(value) => setFormData({ ...formData, seller_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleciona um vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name}
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-primary font-semibold">
                      <Zap className="h-4 w-4" />
                      Fibras
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.fibers}
                      onChange={(e) => setFormData({ ...formData, fibers: parseInt(e.target.value) || 0 })}
                      className="border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Tv className="h-4 w-4" />
                      TVs
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.tvs}
                      onChange={(e) => setFormData({ ...formData, tvs: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Moveis
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.mobiles}
                      onChange={(e) => setFormData({ ...formData, mobiles: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Fixos
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.fixed_lines}
                      onChange={(e) => setFormData({ ...formData, fixed_lines: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-green-600">Validados</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.validated}
                      onChange={(e) => setFormData({ ...formData, validated: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-red-600">Cancelados</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.cancelled}
                      onChange={(e) => setFormData({ ...formData, cancelled: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-yellow-600">Pendentes</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.pending}
                      onChange={(e) => setFormData({ ...formData, pending: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notas (opcional)</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observacoes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Registar Venda
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Entry Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <Card 
            key={member.id} 
            className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50"
            onClick={() => {
              setFormData({ ...formData, seller_id: member.id })
              setIsDialogOpen(true)
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{member.full_name}</CardTitle>
              <CardDescription>{member.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Registar Venda
              </Button>
            </CardContent>
          </Card>
        ))}

        {teamMembers.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhum vendedor na equipa</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function ResultadosSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-12 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
