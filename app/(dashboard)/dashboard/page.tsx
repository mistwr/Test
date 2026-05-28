'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/lib/supabase/client'
import { SalesResult, Profile } from '@/lib/types'
import { calculateCommission, formatCurrency, TOTAL_BASE } from '@/lib/commissions'
import { StatCard, TierBadge, ProgressCard, FiberAlert } from '@/components/dashboard/stat-cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Zap, 
  Tv, 
  Smartphone, 
  Phone, 
  TrendingUp, 
  Trophy, 
  Target,
  Users,
  Euro,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface DashboardStats {
  totalFibers: number
  totalTvs: number
  totalMobiles: number
  totalFixed: number
  totalValidated: number
  totalCancelled: number
  totalPending: number
}

interface TeamMemberStats {
  profile: Profile
  fibers: number
  tvs: number
  mobiles: number
  fixed: number
  commission: number
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([])
  const [globalStats, setGlobalStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const supabase = createClient()
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      try {
        if (user.role === 'ADMIN') {
          // Fetch global stats
          const { data: allSales } = await supabase
            .from('sales_results')
            .select('*')
            .gte('date', firstDayOfMonth)
            .lte('date', lastDayOfMonth)

          if (allSales) {
            const gStats = allSales.reduce((acc, sale) => ({
              totalFibers: acc.totalFibers + sale.fibers,
              totalTvs: acc.totalTvs + sale.tvs,
              totalMobiles: acc.totalMobiles + sale.mobiles,
              totalFixed: acc.totalFixed + sale.fixed_lines,
              totalValidated: acc.totalValidated + sale.validated,
              totalCancelled: acc.totalCancelled + sale.cancelled,
              totalPending: acc.totalPending + sale.pending,
            }), {
              totalFibers: 0,
              totalTvs: 0,
              totalMobiles: 0,
              totalFixed: 0,
              totalValidated: 0,
              totalCancelled: 0,
              totalPending: 0,
            })
            setGlobalStats(gStats)
          }

          // Fetch team rankings
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'VENDEDOR')
            .eq('active', true)

          if (profiles && allSales) {
            const memberStats = profiles.map(profile => {
              const memberSales = allSales.filter(s => s.seller_id === profile.id)
              const totals = memberSales.reduce((acc, sale) => ({
                fibers: acc.fibers + sale.fibers,
                tvs: acc.tvs + sale.tvs,
                mobiles: acc.mobiles + sale.mobiles,
                fixed: acc.fixed + sale.fixed_lines,
              }), { fibers: 0, tvs: 0, mobiles: 0, fixed: 0 })
              
              const commission = calculateCommission(totals.fibers, totals.tvs, totals.mobiles, totals.fixed)
              
              return {
                profile,
                ...totals,
                commission: commission.totalCommission,
              }
            }).sort((a, b) => b.fibers - a.fibers)

            setTeamStats(memberStats.slice(0, 10))
          }
        } else if (user.role === 'CHEFE_EQUIPA') {
          // Fetch team stats
          const { data: teamSales } = await supabase
            .from('sales_results')
            .select('*, seller:profiles(*)')
            .eq('team_id', user.team_id)
            .gte('date', firstDayOfMonth)
            .lte('date', lastDayOfMonth)

          if (teamSales) {
            const tStats = teamSales.reduce((acc, sale) => ({
              totalFibers: acc.totalFibers + sale.fibers,
              totalTvs: acc.totalTvs + sale.tvs,
              totalMobiles: acc.totalMobiles + sale.mobiles,
              totalFixed: acc.totalFixed + sale.fixed_lines,
              totalValidated: acc.totalValidated + sale.validated,
              totalCancelled: acc.totalCancelled + sale.cancelled,
              totalPending: acc.totalPending + sale.pending,
            }), {
              totalFibers: 0,
              totalTvs: 0,
              totalMobiles: 0,
              totalFixed: 0,
              totalValidated: 0,
              totalCancelled: 0,
              totalPending: 0,
            })
            setStats(tStats)
          }

          // Fetch team member stats
          const { data: teamMembers } = await supabase
            .from('profiles')
            .select('*')
            .eq('team_id', user.team_id)
            .eq('role', 'VENDEDOR')
            .eq('active', true)

          if (teamMembers && teamSales) {
            const memberStats = teamMembers.map(profile => {
              const memberSales = teamSales.filter(s => s.seller_id === profile.id)
              const totals = memberSales.reduce((acc, sale) => ({
                fibers: acc.fibers + sale.fibers,
                tvs: acc.tvs + sale.tvs,
                mobiles: acc.mobiles + sale.mobiles,
                fixed: acc.fixed + sale.fixed_lines,
              }), { fibers: 0, tvs: 0, mobiles: 0, fixed: 0 })
              
              const commission = calculateCommission(totals.fibers, totals.tvs, totals.mobiles, totals.fixed)
              
              return {
                profile,
                ...totals,
                commission: commission.totalCommission,
              }
            }).sort((a, b) => b.fibers - a.fibers)

            setTeamStats(memberStats)
          }
        } else {
          // Fetch individual stats
          const { data: mySales } = await supabase
            .from('sales_results')
            .select('*')
            .eq('seller_id', user.id)
            .gte('date', firstDayOfMonth)
            .lte('date', lastDayOfMonth)

          if (mySales) {
            const myStats = mySales.reduce((acc, sale) => ({
              totalFibers: acc.totalFibers + sale.fibers,
              totalTvs: acc.totalTvs + sale.tvs,
              totalMobiles: acc.totalMobiles + sale.mobiles,
              totalFixed: acc.totalFixed + sale.fixed_lines,
              totalValidated: acc.totalValidated + sale.validated,
              totalCancelled: acc.totalCancelled + sale.cancelled,
              totalPending: acc.totalPending + sale.pending,
            }), {
              totalFibers: 0,
              totalTvs: 0,
              totalMobiles: 0,
              totalFixed: 0,
              totalValidated: 0,
              totalCancelled: 0,
              totalPending: 0,
            })
            setStats(myStats)
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up realtime subscription
    const supabase = createClient()
    const channel = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_results' },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  if (authLoading || isLoading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return null
  }

  const displayStats = user.role === 'ADMIN' ? globalStats : stats
  const commission = displayStats 
    ? calculateCommission(displayStats.totalFibers, displayStats.totalTvs, displayStats.totalMobiles, displayStats.totalFixed)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {user.role === 'ADMIN' ? 'Dashboard Global' : 
           user.role === 'CHEFE_EQUIPA' ? 'Dashboard da Equipa' : 
           `Ola, ${user.full_name?.split(' ')[0]}!`}
        </h1>
        <p className="text-muted-foreground">
          {user.role === 'VENDEDOR' ? (
            <>FIBRAS = KPI PRINCIPAL - O teu verdadeiro nivel e definido pelas fibras!</>
          ) : user.role === 'CHEFE_EQUIPA' ? (
            <>Acompanha a performance da tua equipa em tempo real</>
          ) : (
            <>Visao geral de todas as equipas e vendedores</>
          )}
        </p>
      </div>

      {/* Alert for sellers */}
      {user.role === 'VENDEDOR' && commission?.nextTier && commission.fibersToNextTier && (
        <FiberAlert 
          fibersToNext={commission.fibersToNextTier}
          nextTierName={commission.nextTier.tierName}
          potentialIncrease={commission.potentialIncrease || 0}
        />
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fibras"
          value={displayStats?.totalFibers || 0}
          subtitle="KPI Principal"
          icon={<Zap className="h-5 w-5" />}
          highlight
        />
        <StatCard
          title="TVs"
          value={displayStats?.totalTvs || 0}
          icon={<Tv className="h-5 w-5" />}
        />
        <StatCard
          title="Moveis"
          value={displayStats?.totalMobiles || 0}
          icon={<Smartphone className="h-5 w-5" />}
        />
        <StatCard
          title="Fixos"
          value={displayStats?.totalFixed || 0}
          icon={<Phone className="h-5 w-5" />}
        />
      </div>

      {/* Commission and Tier */}
      {commission && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                {user.role === 'VENDEDOR' ? 'Previsao Salarial' : 'Comissoes Totais'}
              </CardTitle>
              <CardDescription>
                {user.role === 'VENDEDOR' 
                  ? 'Base fixa + comissoes do mes atual'
                  : 'Total de comissoes da equipa/empresa'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {user.role === 'VENDEDOR' && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Base Fixa</p>
                    <p className="text-xl font-bold">{formatCurrency(TOTAL_BASE)}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Comissao Fibras</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(commission.fiberCommission)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Comissao TVs</p>
                  <p className="text-xl font-bold">{formatCurrency(commission.tvCommission)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Comissao Moveis</p>
                  <p className="text-xl font-bold">{formatCurrency(commission.mobileCommission)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Comissao Fixos</p>
                  <p className="text-xl font-bold">{formatCurrency(commission.fixedCommission)}</p>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {user.role === 'VENDEDOR' ? 'Total Previsto' : 'Total Comissoes'}
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(user.role === 'VENDEDOR' ? commission.totalSalary : commission.totalCommission)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Patamar Atual</p>
                    <TierBadge tierName={commission.currentTier.tierName} size="lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Validados
                </span>
                <span className="font-semibold">{displayStats?.totalValidated || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Cancelados
                </span>
                <span className="font-semibold">{displayStats?.totalCancelled || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-yellow-500" />
                  Pendentes
                </span>
                <span className="font-semibold">{displayStats?.totalPending || 0}</span>
              </div>
              {commission?.nextTier && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Proximo Patamar</p>
                    <div className="flex items-center justify-between">
                      <TierBadge tierName={commission.nextTier.tierName} />
                      <span className="text-sm">
                        Faltam <span className="font-bold text-primary">{commission.fibersToNextTier}</span> fibras
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Ranking */}
      {teamStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {user.role === 'ADMIN' ? 'Top 10 Vendedores' : 'Ranking da Equipa'}
            </CardTitle>
            <CardDescription>
              Ranking baseado em fibras (KPI principal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamStats.map((member, index) => {
                const memberCommission = calculateCommission(member.fibers, member.tvs, member.mobiles, member.fixed)
                return (
                  <div 
                    key={member.profile.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                      ${index === 0 ? 'bg-yellow-500 text-yellow-950' :
                        index === 1 ? 'bg-gray-400 text-gray-950' :
                        index === 2 ? 'bg-amber-600 text-amber-950' :
                        'bg-muted-foreground/20 text-muted-foreground'}
                    `}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        <TierBadge tierName={memberCommission.currentTier.tierName} size="sm" />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{member.fibers} fibras</p>
                      <p className="text-xs text-muted-foreground">
                        {member.tvs} TVs | {member.mobiles} Mov | {member.fixed} Fix
                      </p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(memberCommission.totalCommission)}
                      </p>
                      <p className="text-xs text-muted-foreground">comissao</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}
