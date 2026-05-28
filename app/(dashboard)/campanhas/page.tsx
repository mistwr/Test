'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { Campaign, CampaignMaterial } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { FileUploadDialog } from '@/components/campaigns/file-upload-dialog'
import { MaterialCard } from '@/components/campaigns/material-card'
import { toast } from 'sonner'
import { 
  Plus, 
  Search, 
  FolderOpen, 
  FileText,
  Filter,
  LayoutGrid,
  List,
  Megaphone,
  Sparkles,
} from 'lucide-react'

const CATEGORIES = [
  { value: 'all', label: 'Todos' },
  { value: 'geral', label: 'Geral' },
  { value: 'precos', label: 'Preços' },
  { value: 'promocoes', label: 'Promoções' },
  { value: 'formacao', label: 'Formação' },
  { value: 'scripts', label: 'Scripts' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'contratos', label: 'Contratos' },
]

export default function CampanhasPage() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [materials, setMaterials] = useState<CampaignMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const canManage = user?.role === 'ADMIN' || user?.role === 'CHEFE_EQUIPA'

  const fetchData = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select(`
          *,
          creator:profiles!campaigns_created_by_fkey(id, full_name)
        `)
        .eq('active', true)
        .order('created_at', { ascending: false })

      // Fetch all materials
      const { data: materialsData } = await supabase
        .from('campaign_materials')
        .select(`
          *,
          uploader:profiles!campaign_materials_uploaded_by_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false })

      setCampaigns(campaignsData || [])
      setMaterials(materialsData || [])
    } catch (error) {
      toast.error('Erro ao carregar campanhas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter materials
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = searchTerm === '' || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Group materials by category for stats
  const categoryStats = CATEGORIES.slice(1).map(cat => ({
    ...cat,
    count: materials.filter(m => m.category === cat.value).length
  }))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
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
            Campanhas e Materiais
          </h1>
          <p className="text-muted-foreground mt-1">
            Material de apoio, PDFs e documentos para a equipa de vendas
          </p>
        </div>
        
        {canManage && (
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Carregar Material
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{materials.length}</p>
                <p className="text-xs text-muted-foreground">Total Materiais</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-600">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{campaigns.length}</p>
                <p className="text-xs text-muted-foreground">Campanhas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {materials.filter(m => m.file_type.includes('pdf')).length}
                </p>
                <p className="text-xs text-muted-foreground">PDFs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {categoryStats.filter(c => c.count > 0).length}
                </p>
                <p className="text-xs text-muted-foreground">Categorias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar materiais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-2">
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full sm:w-auto">
                <TabsList className="flex-wrap h-auto gap-1 bg-transparent p-0">
                  {CATEGORIES.map(cat => (
                    <TabsTrigger 
                      key={cat.value} 
                      value={cat.value}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {cat.label}
                      {cat.value !== 'all' && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                          {categoryStats.find(c => c.value === cat.value)?.count || 0}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              
              <div className="hidden sm:flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 font-semibold">Nenhum material encontrado</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Tente ajustar os filtros de pesquisa'
                  : canManage 
                    ? 'Comece por carregar o primeiro material'
                    : 'Ainda não foram carregados materiais'}
              </p>
              {canManage && !searchTerm && selectedCategory === 'all' && (
                <Button onClick={() => setUploadDialogOpen(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Carregar Material
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' 
            : 'space-y-3'
        }>
          {filteredMaterials.map(material => (
            <MaterialCard
              key={material.id}
              material={material}
              canManage={canManage}
              onDelete={fetchData}
            />
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <FileUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={fetchData}
      />
    </div>
  )
}
