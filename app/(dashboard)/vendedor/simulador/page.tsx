'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { 
  calculateCommission, 
  simulateCommission, 
  formatCurrency, 
  COMMISSION_TIERS,
  TOTAL_BASE,
  getTierColor,
  getTierBgColor,
} from '@/lib/commissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { TierBadge } from '@/components/dashboard/stat-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { Calculator, TrendingUp, Zap, Tv, Smartphone, Phone, ArrowRight, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SimuladorPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [currentStats, setCurrentStats] = useState({
    fibers: 0,
    tvs: 0,
    mobiles: 0,
    fixed: 0,
  })
  const [additionalFibers, setAdditionalFibers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchCurrentStats = async () => {
      const supabase = createClient()
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const { data: mySales } = await supabase
        .from('sales_results')
        .select('*')
        .eq('seller_id', user.id)
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth)

      if (mySales) {
        const totals = mySales.reduce((acc, sale) => ({
          fibers: acc.fibers + sale.fibers,
          tvs: acc.tvs + sale.tvs,
          mobiles: acc.mobiles + sale.mobiles,
          fixed: acc.fixed + sale.fixed_lines,
        }), { fibers: 0, tvs: 0, mobiles: 0, fixed: 0 })
        setCurrentStats(totals)
      }
      setIsLoading(false)
    }

    fetchCurrentStats()
  }, [user])

  if (authLoading || isLoading) {
    return <SimuladorSkeleton />
  }

  const simulation = simulateCommission(
    currentStats.fibers,
    additionalFibers,
    currentStats.tvs,
    currentStats.mobiles,
    currentStats.fixed
  )

  const tierChanged = simulation.current.currentTier.tierName !== simulation.simulated.currentTier.tierName

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <Calculator className="h-8 w-8 text-primary" />
          Simulador de Comissoes
        </h1>
        <p className="text-muted-foreground">
          Descobre quanto podes ganhar se fizeres mais fibras!
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 pt-6">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Lembra-te: O patamar depende APENAS das fibras!</p>
            <p className="text-sm text-muted-foreground mt-1">
              TVs, moveis e fixos dao dinheiro, mas nao mudam o teu patamar. 
              Foca-te nas fibras para subir de nivel!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Simulator */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Simula o teu Cenario</CardTitle>
            <CardDescription>
              Arrasta o slider ou introduz um numero para ver o impacto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Stats Display */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Fibras Atuais</p>
                <p className="text-2xl font-bold text-primary">{currentStats.fibers}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Patamar Atual</p>
                <TierBadge tierName={simulation.current.currentTier.tierName} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">TVs</p>
                <p className="text-lg font-semibold">{currentStats.tvs}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Moveis</p>
                <p className="text-lg font-semibold">{currentStats.mobiles}</p>
              </div>
            </div>

            {/* Simulation Input */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Se fizer mais {additionalFibers} fibras...
              </Label>
              <Slider
                value={[additionalFibers]}
                onValueChange={(value) => setAdditionalFibers(value[0])}
                max={50}
                step={1}
                className="py-4"
              />
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={additionalFibers}
                  onChange={(e) => setAdditionalFibers(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">fibras adicionais</span>
              </div>
            </div>

            {/* Quick Select */}
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setAdditionalFibers(num)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    additionalFibers === num 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted hover:bg-muted-foreground/20'
                  )}
                >
                  +{num}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className={cn(tierChanged && 'border-green-500/50 bg-green-500/5')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Resultado da Simulacao
            </CardTitle>
            {tierChanged && (
              <CardDescription className="text-green-600 font-medium">
                Parabens! Vais subir de patamar!
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tier Comparison */}
            <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Atual</p>
                <TierBadge tierName={simulation.current.currentTier.tierName} />
                <p className="text-lg font-bold mt-1">{currentStats.fibers}</p>
                <p className="text-xs text-muted-foreground">fibras</p>
              </div>
              <ArrowRight className={cn(
                'h-6 w-6',
                tierChanged ? 'text-green-500' : 'text-muted-foreground'
              )} />
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">Simulado</p>
                <TierBadge tierName={simulation.simulated.currentTier.tierName} />
                <p className="text-lg font-bold mt-1">{currentStats.fibers + additionalFibers}</p>
                <p className="text-xs text-muted-foreground">fibras</p>
              </div>
            </div>

            {/* Commission Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-primary" />
                  Comissao Fibras
                </span>
                <div className="text-right">
                  <span className="text-muted-foreground line-through mr-2">
                    {formatCurrency(simulation.current.fiberCommission)}
                  </span>
                  <span className="font-bold text-primary">
                    {formatCurrency(simulation.simulated.fiberCommission)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="flex items-center gap-2 text-sm">
                  <Tv className="h-4 w-4" />
                  Comissao TVs
                </span>
                <span className="font-medium">{formatCurrency(simulation.simulated.tvCommission)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4" />
                  Comissao Moveis
                </span>
                <span className="font-medium">{formatCurrency(simulation.simulated.mobileCommission)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  Comissao Fixos
                </span>
                <span className="font-medium">{formatCurrency(simulation.simulated.fixedCommission)}</span>
              </div>
            </div>

            {/* Total */}
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Base Fixa</span>
                <span className="font-medium">{formatCurrency(TOTAL_BASE)}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Comissoes</span>
                <span className="font-medium">{formatCurrency(simulation.simulated.totalCommission)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-green-500/30">
                <span className="font-semibold">Salario Previsto</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(simulation.simulated.totalSalary)}
                </span>
              </div>
              {simulation.difference > 0 && (
                <p className="text-center text-sm text-green-600 mt-3 font-medium">
                  +{formatCurrency(simulation.difference)} em relacao ao atual
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tiers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabela de Patamares DIGI</CardTitle>
          <CardDescription>
            O valor das fibras aumenta conforme o patamar. TVs, moveis e fixos tem valores fixos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm">
                  <th className="text-left py-3 px-2 font-medium">Patamar</th>
                  <th className="text-left py-3 px-2 font-medium">Fibras</th>
                  <th className="text-right py-3 px-2 font-medium">Valor Fibra</th>
                  <th className="text-right py-3 px-2 font-medium">Valor TV</th>
                  <th className="text-right py-3 px-2 font-medium">Valor Movel</th>
                  <th className="text-right py-3 px-2 font-medium">Valor Fixo</th>
                </tr>
              </thead>
              <tbody>
                {COMMISSION_TIERS.map((tier) => {
                  const isCurrentTier = tier.tierName === simulation.simulated.currentTier.tierName
                  return (
                    <tr 
                      key={tier.tierName}
                      className={cn(
                        'border-b transition-colors',
                        isCurrentTier && 'bg-primary/10'
                      )}
                    >
                      <td className="py-3 px-2">
                        <TierBadge tierName={tier.tierName} size="sm" />
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {tier.minFibers} - {tier.maxFibers || '∞'}
                      </td>
                      <td className="py-3 px-2 text-right font-medium text-primary">
                        {tier.fiberValue.toFixed(2)}€
                      </td>
                      <td className="py-3 px-2 text-right">
                        {tier.tvValue.toFixed(2)}€
                      </td>
                      <td className="py-3 px-2 text-right">
                        {tier.mobileValue.toFixed(2)}€
                      </td>
                      <td className="py-3 px-2 text-right">
                        {tier.fixedValue.toFixed(2)}€
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SimuladorSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}
