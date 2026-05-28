'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SalesScript } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  BookOpen, 
  MessageSquare, 
  ShieldAlert, 
  Target, 
  Zap as Energy,
  Lightbulb,
  Copy,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const CATEGORIES = [
  { id: 'pitch', label: 'Pitch', icon: MessageSquare },
  { id: 'objecoes', label: 'Objecoes', icon: ShieldAlert },
  { id: 'fecho', label: 'Fecho', icon: Target },
  { id: 'energia', label: 'Energia', icon: Energy },
  { id: 'dicas', label: 'Dicas', icon: Lightbulb },
]

export default function CentralVendasPage() {
  const [scripts, setScripts] = useState<SalesScript[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pitch')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchScripts = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('sales_scripts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: true })

      if (data) {
        setScripts(data)
      }
      setIsLoading(false)
    }

    fetchScripts()
  }, [])

  const handleCopy = async (script: SalesScript) => {
    try {
      await navigator.clipboard.writeText(script.content)
      setCopiedId(script.id)
      toast.success('Copiado!', {
        description: 'O script foi copiado para a area de transferencia',
      })
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  if (isLoading) {
    return <CentralVendasSkeleton />
  }

  const getScriptsByCategory = (category: string) => 
    scripts.filter(s => s.category === category)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Central de Vendas
        </h1>
        <p className="text-muted-foreground">
          Scripts, tecnicas de fecho e dicas para aumentar as tuas vendas
        </p>
      </div>

      {/* Tips Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Dica do Dia</p>
            <p className="text-sm text-muted-foreground mt-1">
              Lembra-te: o cliente nao compra o produto, compra a solucao para o problema dele. 
              Descobre primeiro qual e o problema antes de apresentar a solucao!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Scripts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 h-auto">
          {CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id}
              className="flex flex-col sm:flex-row gap-1 sm:gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <cat.icon className="h-4 w-4" />
              <span className="text-xs sm:text-sm">{cat.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {getScriptsByCategory(cat.id).map((script) => (
                <Card key={script.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{script.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(script)}
                        className="shrink-0"
                      >
                        {copiedId === script.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {cat.label}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {script.content}
                    </p>
                  </CardContent>
                </Card>
              ))}

              {getScriptsByCategory(cat.id).length === 0 && (
                <Card className="col-span-2">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <cat.icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Ainda nao ha scripts nesta categoria
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Estrutura de Venda AIDA</CardTitle>
          <CardDescription>
            Tecnica classica de vendas - segue esta estrutura em cada abordagem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="font-bold text-blue-600 text-lg">A - Atencao</p>
              <p className="text-sm text-muted-foreground mt-2">
                Capta a atencao do cliente nos primeiros 5 segundos. Usa uma pergunta ou afirmacao impactante.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="font-bold text-green-600 text-lg">I - Interesse</p>
              <p className="text-sm text-muted-foreground mt-2">
                Desperta o interesse falando dos beneficios. Foca no que o cliente ganha, nao nas caracteristicas.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="font-bold text-yellow-600 text-lg">D - Desejo</p>
              <p className="text-sm text-muted-foreground mt-2">
                Cria desejo mostrando como a vida dele melhora. Usa exemplos concretos e comparacoes.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="font-bold text-red-600 text-lg">A - Acao</p>
              <p className="text-sm text-muted-foreground mt-2">
                Pede a acao diretamente. Usa tecnicas de fecho e cria urgencia para fechar agora.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CentralVendasSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-12 rounded-lg" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  )
}
