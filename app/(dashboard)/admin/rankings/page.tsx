'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Trophy, 
  Medal, 
  Crown, 
  Zap, 
  TrendingUp,
  Users,
  Building2,
  Coins
} from 'lucide-react'
import { calculateCommission, getTierInfo, COMMISSION_TIERS } from '@/lib/commissions'
import type { Profile, Team, SalesResult } from '@/lib/types'

interface RankedSeller {
  profile: Profile
  team: Team | null
  totalFibers: number
  totalTvs: number
  totalMobiles: number
  totalFixed: number
  totalCommission: number
  totalPoints: number
  tier: ReturnType<typeof getTierInfo>
}

interface RankedTeam {
  team: Team
  totalFibers: number
  totalTvs: number
  totalMobiles: number
  totalFixed: number
  totalCommission: number
  memberCount: number
  averageFibers: number
}

export default function AdminRankingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [sellers, setSellers] = useState<RankedSeller[]>([])
  const [teams, setTeams] = useState<RankedTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  const fetchRankings = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)

    // Calculate date range
    const now = new Date()
    let startDate: Date
    if (period === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      startDate = new Date(now.getFullYear(), 0, 1)
    }

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'VENDEDOR')
      .eq('active', true)

    // Fetch teams
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')

    // Fetch sales results
    const { data: results } = await supabase
      .from('sales_results')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])

    // Fetch leaderboard points
    const { data: points } = await supabase
      .from('leaderboard_points')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (!profiles || !teamsData || !results) {
      setIsLoading(false)
      return
    }

    // Calculate seller rankings
    const sellerRankings: RankedSeller[] = profiles.map(profile => {
      const sellerResults = results.filter(r => r.seller_id === profile.id)
      const sellerTeam = teamsData.find(t => t.id === profile.team_id) || null
      const sellerPoints = points?.filter(p => p.user_id === profile.id)
        .reduce((sum, p) => sum + p.points, 0) || 0

      const totalFibers = sellerResults.reduce((sum, r) => sum + r.fibers, 0)
      const totalTvs = sellerResults.reduce((sum, r) => sum + r.tvs, 0)
      const totalMobiles = sellerResults.reduce((sum, r) => sum + r.mobiles, 0)
      const totalFixed = sellerResults.reduce((sum, r) => sum + r.fixed_lines, 0)

      const commission = calculateCommission(totalFibers, totalTvs, totalMobiles, totalFixed)
      const tier = getTierInfo(totalFibers)

      return {
        profile,
        team: sellerTeam,
        totalFibers,
        totalTvs,
        totalMobiles,
        totalFixed,
        totalCommission: commission.totalCommission,
        totalPoints: sellerPoints,
        tier
      }
    })

    // Sort by fibers (main KPI)
    sellerRankings.sort((a, b) => b.totalFibers - a.totalFibers)
    setSellers(sellerRankings)

    // Calculate team rankings
    const teamRankings: RankedTeam[] = teamsData.map(team => {
      const teamMembers = profiles.filter(p => p.team_id === team.id)
      const teamResults = results.filter(r => r.team_id === team.id)

      const totalFibers = teamResults.reduce((sum, r) => sum + r.fibers, 0)
      const totalTvs = teamResults.reduce((sum, r) => sum + r.tvs, 0)
      const totalMobiles = teamResults.reduce((sum, r) => sum + r.mobiles, 0)
      const totalFixed = teamResults.reduce((sum, r) => sum + r.fixed_lines, 0)

      // Calculate total commission for all team members
      let totalCommission = 0
      teamMembers.forEach(member => {
        const memberResults = teamResults.filter(r => r.seller_id === member.id)
        const memberFibers = memberResults.reduce((sum, r) => sum + r.fibers, 0)
        const memberTvs = memberResults.reduce((sum, r) => sum + r.tvs, 0)
        const memberMobiles = memberResults.reduce((sum, r) => sum + r.mobiles, 0)
        const memberFixed = memberResults.reduce((sum, r) => sum + r.fixed_lines, 0)
        const commission = calculateCommission(memberFibers, memberTvs, memberMobiles, memberFixed)
        totalCommission += commission.totalCommission
      })

      return {
        team,
        totalFibers,
        totalTvs,
        totalMobiles,
        totalFixed,
        totalCommission,
        memberCount: teamMembers.length,
        averageFibers: teamMembers.length > 0 ? totalFibers / teamMembers.length : 0
      }
    })

    teamRankings.sort((a, b) => b.totalFibers - a.totalFibers)
    setTeams(teamRankings)

    setIsLoading(false)
  }, [period])

  useEffect(() => {
    if (!authLoading && user) {
      fetchRankings()
    }
  }, [authLoading, user, fetchRankings])

  if (authLoading || !user) {
    return <RankingSkeleton />
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Acesso restrito a administradores</p>
      </div>
    )
  }

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 0: return <Crown className="h-6 w-6 text-yellow-500" />
      case 1: return <Medal className="h-6 w-6 text-gray-400" />
      case 2: return <Medal className="h-6 w-6 text-amber-600" />
      default: return null
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Rankings Globais
          </h1>
          <p className="text-muted-foreground">
            Performance de vendedores e equipas
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mes</SelectItem>
            <SelectItem value="year">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="fibers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fibers" className="gap-2">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Fibras</span>
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Comissao</span>
          </TabsTrigger>
          <TabsTrigger value="points" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Pontos</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Equipas</span>
          </TabsTrigger>
        </TabsList>

        {/* Fibers Ranking */}
        <TabsContent value="fibers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Ranking de Fibras
              </CardTitle>
              <CardDescription>
                KPI principal - ordenado por numero de fibras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {sellers.map((seller, index) => (
                    <div
                      key={seller.profile.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        index < 3 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-center w-10 h-10">
                        {index < 3 ? (
                          getPodiumIcon(index)
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={index < 3 ? 'bg-primary text-primary-foreground' : ''}>
                          {getInitials(seller.profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {seller.profile.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {seller.team?.name || 'Sem equipa'}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="hidden sm:flex"
                        style={{ borderColor: seller.tier.color, color: seller.tier.color }}
                      >
                        {seller.tier.name}
                      </Badge>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {seller.totalFibers}
                        </p>
                        <p className="text-xs text-muted-foreground">fibras</p>
                      </div>
                    </div>
                  ))}
                  {sellers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum vendedor encontrado
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commission Ranking */}
        <TabsContent value="commission">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-green-500" />
                Ranking de Comissao
              </CardTitle>
              <CardDescription>
                Ordenado por comissao total estimada
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[...sellers]
                    .sort((a, b) => b.totalCommission - a.totalCommission)
                    .map((seller, index) => (
                      <div
                        key={seller.profile.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          index < 3 ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-center w-10 h-10">
                          {index < 3 ? (
                            getPodiumIcon(index)
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={index < 3 ? 'bg-green-500 text-white' : ''}>
                            {getInitials(seller.profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {seller.profile.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {seller.totalFibers} fibras
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-500">
                            {seller.totalCommission.toFixed(0)}€
                          </p>
                          <p className="text-xs text-muted-foreground">comissao</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Points Ranking */}
        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                Ranking de Pontos
              </CardTitle>
              <CardDescription>
                Gamificacao - pontos acumulados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[...sellers]
                    .sort((a, b) => b.totalPoints - a.totalPoints)
                    .map((seller, index) => (
                      <div
                        key={seller.profile.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          index < 3 ? 'bg-purple-500/5 border-purple-500/20' : 'bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-center w-10 h-10">
                          {index < 3 ? (
                            getPodiumIcon(index)
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={index < 3 ? 'bg-purple-500 text-white' : ''}>
                            {getInitials(seller.profile.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {seller.profile.full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {seller.totalFibers} fibras
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-500">
                            {seller.totalPoints}
                          </p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Ranking */}
        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                Ranking de Equipas
              </CardTitle>
              <CardDescription>
                Performance por equipa
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {teams.map((team, index) => (
                    <div
                      key={team.team.id}
                      className={`p-4 rounded-lg border ${
                        index < 3 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10">
                          {index < 3 ? (
                            getPodiumIcon(index)
                          ) : (
                            <span className="text-lg font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{team.team.name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            {team.memberCount} membros
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-500">
                            {team.totalFibers}
                          </p>
                          <p className="text-xs text-muted-foreground">fibras totais</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-lg font-semibold">{team.averageFibers.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground">Media/Vendedor</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">{team.totalTvs}</p>
                          <p className="text-xs text-muted-foreground">TVs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">{team.totalMobiles}</p>
                          <p className="text-xs text-muted-foreground">Moveis</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-green-500">
                            {team.totalCommission.toFixed(0)}€
                          </p>
                          <p className="text-xs text-muted-foreground">Comissao</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma equipa encontrada
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RankingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  )
}
