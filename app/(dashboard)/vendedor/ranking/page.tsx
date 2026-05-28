'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Profile } from '@/lib/types'
import { calculateCommission, formatCurrency, calculatePoints } from '@/lib/commissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TierBadge } from '@/components/dashboard/stat-cards'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Zap, Euro, Medal, Crown, Award, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RankedSeller {
  profile: Profile
  fibers: number
  tvs: number
  mobiles: number
  fixed: number
  commission: number
  points: number
  cancelled: number
}

export default function RankingPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [rankings, setRankings] = useState<RankedSeller[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('fibers')

  useEffect(() => {
    const fetchRankings = async () => {
      const supabase = createClient()
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      try {
        // Fetch all sellers
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'VENDEDOR')
          .eq('active', true)

        // Fetch all sales for the month
        const { data: sales } = await supabase
          .from('sales_results')
          .select('*')
          .gte('date', firstDayOfMonth)
          .lte('date', lastDayOfMonth)

        if (profiles && sales) {
          const rankedSellers = profiles.map(profile => {
            const sellerSales = sales.filter(s => s.seller_id === profile.id)
            const totals = sellerSales.reduce((acc, sale) => ({
              fibers: acc.fibers + sale.fibers,
              tvs: acc.tvs + sale.tvs,
              mobiles: acc.mobiles + sale.mobiles,
              fixed: acc.fixed + sale.fixed_lines,
              cancelled: acc.cancelled + sale.cancelled,
            }), { fibers: 0, tvs: 0, mobiles: 0, fixed: 0, cancelled: 0 })

            const commission = calculateCommission(totals.fibers, totals.tvs, totals.mobiles, totals.fixed)
            const points = calculatePoints(totals.fibers, totals.tvs, totals.mobiles, totals.fixed, totals.cancelled)

            return {
              profile,
              ...totals,
              commission: commission.totalCommission,
              points,
            }
          })

          setRankings(rankedSellers)
        }
      } catch (error) {
        console.error('Error fetching rankings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRankings()

    // Real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('ranking_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_results' },
        () => fetchRankings()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (authLoading || isLoading) {
    return <RankingSkeleton />
  }

  const sortedByFibers = [...rankings].sort((a, b) => b.fibers - a.fibers)
  const sortedByCommission = [...rankings].sort((a, b) => b.commission - a.commission)
  const sortedByPoints = [...rankings].sort((a, b) => b.points - a.points)

  const currentRanking = activeTab === 'fibers' ? sortedByFibers :
    activeTab === 'commission' ? sortedByCommission : sortedByPoints

  const myPosition = user 
    ? currentRanking.findIndex(r => r.profile.id === user.id) + 1
    : 0

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-bold text-muted-foreground">{position}</span>
  }

  const getRankBg = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30'
    if (position === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30'
    if (position === 3) return 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30'
    return 'bg-muted/50'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Ranking
        </h1>
        <p className="text-muted-foreground">
          Ranking baseado em fibras (KPI principal) - Atualizado em tempo real
        </p>
      </div>

      {/* My Position */}
      {user && myPosition > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center justify-between py-6">
            <div>
              <p className="text-sm text-muted-foreground">A tua posicao</p>
              <p className="text-3xl font-bold text-primary">#{myPosition}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">de {rankings.length} vendedores</p>
              {myPosition <= 3 && (
                <p className="text-sm font-medium text-green-600 flex items-center gap-1 justify-end">
                  <Star className="h-4 w-4" /> Top 3!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fibers" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Por Fibras</span>
            <span className="sm:hidden">Fibras</span>
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-2">
            <Euro className="h-4 w-4" />
            <span className="hidden sm:inline">Por Comissao</span>
            <span className="sm:hidden">Comissao</span>
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Por Pontos</span>
            <span className="sm:hidden">Pontos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fibers" className="mt-6">
          <RankingList 
            rankings={sortedByFibers} 
            type="fibers" 
            userId={user?.id}
            getRankIcon={getRankIcon}
            getRankBg={getRankBg}
          />
        </TabsContent>

        <TabsContent value="commission" className="mt-6">
          <RankingList 
            rankings={sortedByCommission} 
            type="commission" 
            userId={user?.id}
            getRankIcon={getRankIcon}
            getRankBg={getRankBg}
          />
        </TabsContent>

        <TabsContent value="points" className="mt-6">
          <RankingList 
            rankings={sortedByPoints} 
            type="points" 
            userId={user?.id}
            getRankIcon={getRankIcon}
            getRankBg={getRankBg}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface RankingListProps {
  rankings: RankedSeller[]
  type: 'fibers' | 'commission' | 'points'
  userId?: string
  getRankIcon: (position: number) => React.ReactNode
  getRankBg: (position: number) => string
}

function RankingList({ rankings, type, userId, getRankIcon, getRankBg }: RankingListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {type === 'fibers' && 'Ranking por Fibras'}
          {type === 'commission' && 'Ranking por Comissao'}
          {type === 'points' && 'Ranking por Pontos'}
        </CardTitle>
        <CardDescription>
          {type === 'fibers' && 'O ranking principal - baseado no KPI mais importante'}
          {type === 'commission' && 'Quem esta a ganhar mais este mes'}
          {type === 'points' && 'Gamificacao - pontos por vendas validadas'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rankings.map((seller, index) => {
            const position = index + 1
            const isMe = seller.profile.id === userId
            const commission = calculateCommission(seller.fibers, seller.tvs, seller.mobiles, seller.fixed)

            return (
              <div
                key={seller.profile.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-all',
                  getRankBg(position),
                  isMe && 'ring-2 ring-primary ring-offset-2'
                )}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background">
                  {getRankIcon(position)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">
                      {seller.profile.full_name}
                      {isMe && <span className="text-primary ml-1">(Tu)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <TierBadge tierName={commission.currentTier.tierName} size="sm" />
                    <span className="text-xs text-muted-foreground">
                      {seller.tvs} TVs | {seller.mobiles} Mov | {seller.fixed} Fix
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {type === 'fibers' && (
                    <>
                      <p className="text-xl font-bold text-primary">{seller.fibers}</p>
                      <p className="text-xs text-muted-foreground">fibras</p>
                    </>
                  )}
                  {type === 'commission' && (
                    <>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(seller.commission)}</p>
                      <p className="text-xs text-muted-foreground">comissao</p>
                    </>
                  )}
                  {type === 'points' && (
                    <>
                      <p className="text-xl font-bold text-yellow-600">{seller.points}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </>
                  )}
                </div>
              </div>
            )
          })}

          {rankings.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ainda nao ha dados para mostrar</p>
              <p className="text-sm">Os rankings aparecem quando houver vendas registadas</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RankingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-12 rounded-lg" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
