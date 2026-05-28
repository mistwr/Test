import { CommissionRule, CommissionTier, CommissionCalculation } from './types'

// DIGI Commission Tiers based on FIBERS only
export const COMMISSION_TIERS: CommissionTier[] = [
  { minFibers: 0, maxFibers: 5, fiberValue: 6, tvValue: 6, mobileValue: 2, fixedValue: 1, tierName: 'Iniciante' },
  { minFibers: 6, maxFibers: 10, fiberValue: 8, tvValue: 6, mobileValue: 2, fixedValue: 1, tierName: 'Bronze' },
  { minFibers: 11, maxFibers: 15, fiberValue: 10, tvValue: 6, mobileValue: 2, fixedValue: 1, tierName: 'Prata' },
  { minFibers: 16, maxFibers: 20, fiberValue: 15, tvValue: 6, mobileValue: 2, fixedValue: 1, tierName: 'Ouro' },
  { minFibers: 21, maxFibers: 50, fiberValue: 20, tvValue: 6, mobileValue: 2, fixedValue: 1, tierName: 'Platina' },
  { minFibers: 51, maxFibers: 75, fiberValue: 20, tvValue: 6, mobileValue: 2.5, fixedValue: 1, tierName: 'Diamante' },
  { minFibers: 76, maxFibers: null, fiberValue: 20, tvValue: 6, mobileValue: 3, fixedValue: 1, tierName: 'Lenda' },
]

// Base salary components
export const BASE_SALARY = 920
export const TRANSPORT_ALLOWANCE = 40
export const FOOD_ALLOWANCE_PER_DAY = 8
export const AVERAGE_WORKING_DAYS = 22
export const TOTAL_BASE = BASE_SALARY + TRANSPORT_ALLOWANCE + (FOOD_ALLOWANCE_PER_DAY * AVERAGE_WORKING_DAYS)

// Get tier based on fiber count
export function getTierByFibers(fibers: number): CommissionTier {
  for (const tier of COMMISSION_TIERS) {
    if (tier.maxFibers === null) {
      if (fibers >= tier.minFibers) return tier
    } else {
      if (fibers >= tier.minFibers && fibers <= tier.maxFibers) return tier
    }
  }
  return COMMISSION_TIERS[0]
}

// Get next tier
export function getNextTier(currentTier: CommissionTier): CommissionTier | null {
  const currentIndex = COMMISSION_TIERS.findIndex(t => t.tierName === currentTier.tierName)
  if (currentIndex < COMMISSION_TIERS.length - 1) {
    return COMMISSION_TIERS[currentIndex + 1]
  }
  return null
}

// Calculate commission
export function calculateCommission(
  fibers: number,
  tvs: number,
  mobiles: number,
  fixed: number,
  customRules?: CommissionRule[]
): CommissionCalculation {
  // Get current tier based on FIBERS ONLY
  const currentTier = getTierByFibers(fibers)
  const nextTier = getNextTier(currentTier)

  // Calculate individual commissions
  const fiberCommission = fibers * currentTier.fiberValue
  const tvCommission = tvs * currentTier.tvValue
  const mobileCommission = mobiles * currentTier.mobileValue
  const fixedCommission = fixed * currentTier.fixedValue
  
  const totalCommission = fiberCommission + tvCommission + mobileCommission + fixedCommission
  const totalSalary = TOTAL_BASE + totalCommission

  // Calculate fibers needed for next tier
  let fibersToNextTier: number | null = null
  let potentialIncrease: number | null = null

  if (nextTier) {
    fibersToNextTier = nextTier.minFibers - fibers
    // Calculate potential increase if they reach next tier
    const nextTierFiberCommission = nextTier.minFibers * nextTier.fiberValue
    const nextTierTvCommission = tvs * nextTier.tvValue
    const nextTierMobileCommission = mobiles * nextTier.mobileValue
    const nextTierFixedCommission = fixed * nextTier.fixedValue
    const nextTierTotal = nextTierFiberCommission + nextTierTvCommission + nextTierMobileCommission + nextTierFixedCommission
    potentialIncrease = nextTierTotal - totalCommission
  }

  return {
    totalFibers: fibers,
    totalTvs: tvs,
    totalMobiles: mobiles,
    totalFixed: fixed,
    currentTier,
    fiberCommission,
    tvCommission,
    mobileCommission,
    fixedCommission,
    totalCommission,
    baseSalary: TOTAL_BASE,
    totalSalary,
    nextTier,
    fibersToNextTier,
    potentialIncrease,
  }
}

// Simulate commission with additional fibers
export function simulateCommission(
  currentFibers: number,
  additionalFibers: number,
  tvs: number,
  mobiles: number,
  fixed: number
): { current: CommissionCalculation; simulated: CommissionCalculation; difference: number } {
  const current = calculateCommission(currentFibers, tvs, mobiles, fixed)
  const simulated = calculateCommission(currentFibers + additionalFibers, tvs, mobiles, fixed)
  
  return {
    current,
    simulated,
    difference: simulated.totalSalary - current.totalSalary,
  }
}

// Gamification points calculation
export const POINTS_CONFIG = {
  FIBER_VALIDATED: 10,
  TV: 4,
  MOBILE: 3,
  FIXED: 1,
  CANCELLED: -5,
}

export function calculatePoints(
  fibers: number,
  tvs: number,
  mobiles: number,
  fixed: number,
  cancelled: number
): number {
  return (
    fibers * POINTS_CONFIG.FIBER_VALIDATED +
    tvs * POINTS_CONFIG.TV +
    mobiles * POINTS_CONFIG.MOBILE +
    fixed * POINTS_CONFIG.FIXED +
    cancelled * POINTS_CONFIG.CANCELLED
  )
}

// Format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

// Get tier color
export function getTierColor(tierName: string): string {
  const colors: Record<string, string> = {
    'Iniciante': 'text-gray-500',
    'Bronze': 'text-amber-600',
    'Prata': 'text-gray-400',
    'Ouro': 'text-yellow-500',
    'Platina': 'text-cyan-400',
    'Diamante': 'text-blue-400',
    'Lenda': 'text-purple-500',
  }
  return colors[tierName] || 'text-gray-500'
}

export function getTierBgColor(tierName: string): string {
  const colors: Record<string, string> = {
    'Iniciante': 'bg-gray-500/10',
    'Bronze': 'bg-amber-600/10',
    'Prata': 'bg-gray-400/10',
    'Ouro': 'bg-yellow-500/10',
    'Platina': 'bg-cyan-400/10',
    'Diamante': 'bg-blue-400/10',
    'Lenda': 'bg-purple-500/10',
  }
  return colors[tierName] || 'bg-gray-500/10'
}
