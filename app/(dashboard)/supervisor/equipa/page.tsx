'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { Profile, SalesResult } from '@/lib/types'
import { calculateCommission, formatCurrency } from '@/lib/commissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TierBadge, StatCard } from '@/components/dashboard/stat-cards'
import { Users, Zap, Tv, Smartphone, Phone, Trophy, TrendingUp } from 'lucide-react'

interface TeamMemberStats {
  profile: Profile
  fibers: number
  tvs: number
  mobiles: number
  fixed: number
  validated: number
  cancelled: number
}

export default function SupervisorEquipaPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMemberStats[]>([])
  const [teamTotals, setTeamTotals] = useState({
    fibers: 0,
    tvs: 0,
    mobiles: 0,
    fixed: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'CHEFE_EQUIPA') return

    const fetchTeamData = async () => {
      const supabase = createClient()
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      // Fetch team members
      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('team_id', user.team_id)
        .eq('role', 'VENDEDOR')
        .eq('active', true)

      // Fetch sales
      const { data: sales } = await supabase
        .from('sales_results')
        .select('*')
        .eq('team_id', user.team_id)
        .gte('date', firstDayOfMonth)
        .lte('date', lastDayOfMonth)

      if (members) {
        const memberStats = members.map(profile => {
          const memberSales = sales?.filter(s => s.seller_id === profile.id) || []
          return {
            profile,
            ...memberSales.reduce((acc, sale) => ({
              fibers: acc.fibers + sale.fibers,
              tvs: acc.tvs + sale.tvs,
              mobiles: acc.mobiles + sale.mobiles,
              fixed: acc.fixed + sale.fixed_lines,
              validated: acc.validated + sale.validated,
              cancelled: acc.cancelled + sale.cancelled,
            }), { fibers: 0, tvs: 0, mobiles: 0, fixed: 0, validated: 0, cancelled: 0 }),
          }
        }).sort((a, b) => b.fibers - a.fibers)

        setTeamMembers(memberStats)

        const totals = memberStats.reduce((acc, m) => ({
          fibers: acc.fibers + m.fibers,
          tvs: acc.tvs + m.tvs,
          mobiles: acc.mobiles + m.mobiles,
          fixed: acc.fixed + m.fixed,
        }), { fibers: 0, tvs: 0, mobiles: 0, fixed: 0 })

        setTeamTotals(totals)
      }

      setIsLoading(false)
    }

    fetchTeamData()

    // Real-time subscription
    const supabase = createClient()
    const channel = supabase
      .channel('team_sales')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_results' },
        () => fetchTeamData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  if (authLoading || isLoading) {
    return <EquipaSkeleton />
  }

  if (user?.role !== 'CHEFE_EQUIPA') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Acesso nao autorizado</p>
      </div>
    )
  }

  const teamCommission = calculateCommission(teamTotals.fibers, teamTotals.tvs, teamTotals.mobiles, teamTotals.fixed)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Minha Equipa
        </h1>
        <p className="text-muted-foreground">
          Acompanha a performance da tua equipa em tempo real
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Fibras da Equipa"
          value={teamTotals.fibers}
          subtitle="KPI Principal"
          icon={<Zap className="h-5 w-5" />}
          highlight
        />
        <StatCard
          title="TVs"
          value={teamTotals.tvs}
          icon={<Tv className="h-5 w-5" />}
        />
        <StatCard
          title="Moveis"
          value={teamTotals.mobiles}
          icon={<Smartphone className="h-5 w-5" />}
        />
        <StatCard
          title="Fixos"
          value={teamTotals.fixed}
          icon={<Phone className="h-5 w-5" />}
        />
      </div>

      {/* Team Commission */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Comissao Total da Equipa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(teamCommission.totalCommission)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Total de comissoes geradas pela equipa este mes
          </p>
        </CardContent>
      </Card>

      {/* Team Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking da Equipa
          </CardTitle>
          <CardDescription>
            Ordenado por fibras (KPI principal)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member, index) => {
              const memberCommission = calculateCommission(member.fibers, member.tvs, member.mobiles, member.fixed)
              return (
                <div 
                  key={member.profile.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm
                    ${index === 0 ? 'bg-yellow-500 text-yellow-950' :
                      index === 1 ? 'bg-gray-400 text-gray-950' :
                      index === 2 ? 'bg-amber-600 text-amber-950' :
                      'bg-muted-foreground/20 text-muted-foreground'}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{member.profile.full_name}</p>
                    <TierBadge tierName={memberCommission.currentTier.tierName} size="sm" />
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{member.fibers}</p>
                    <p className="text-xs text-muted-foreground">fibras</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="font-medium">{member.tvs} TV</p>
                    <p className="text-xs text-muted-foreground">{member.mobiles} Mov | {member.fixed} Fix</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(memberCommission.totalCommission)}
                    </p>
                    <p className="text-xs text-muted-foreground">comissao</p>
                  </div>
                </div>
              )
            })}

            {teamMembers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum vendedor na equipa</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function EquipaSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
