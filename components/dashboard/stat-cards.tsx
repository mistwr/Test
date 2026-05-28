'use client'

import { cn } from '@/lib/utils'
import { getTierColor, getTierBgColor } from '@/lib/commissions'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  highlight?: boolean
}

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  className,
  highlight 
}: StatCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-xl border bg-card p-4 lg:p-6 transition-all hover:shadow-md',
      highlight && 'border-primary/50 bg-primary/5',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            'text-2xl lg:text-3xl font-bold tracking-tight',
            highlight && 'text-primary'
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              'inline-flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <span className="text-muted-foreground">vs. ontem</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            highlight ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface TierBadgeProps {
  tierName: string
  size?: 'sm' | 'md' | 'lg'
}

export function TierBadge({ tierName, size = 'md' }: TierBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }

  return (
    <span className={cn(
      'inline-flex items-center font-semibold rounded-full',
      getTierBgColor(tierName),
      getTierColor(tierName),
      sizeClasses[size]
    )}>
      {tierName}
    </span>
  )
}

interface ProgressCardProps {
  title: string
  current: number
  target: number
  unit?: string
  description?: string
  showPercentage?: boolean
}

export function ProgressCard({ 
  title, 
  current, 
  target, 
  unit = '', 
  description,
  showPercentage = true 
}: ProgressCardProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100)
  
  return (
    <div className="rounded-xl border bg-card p-4 lg:p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">{title}</h3>
        {showPercentage && (
          <span className="text-sm font-bold text-primary">{percentage}%</span>
        )}
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 progress-shine" />
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">
          {current}{unit} / {target}{unit}
        </span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </div>
    </div>
  )
}

interface FiberAlertProps {
  fibersToNext: number
  nextTierName: string
  potentialIncrease: number
}

export function FiberAlert({ fibersToNext, nextTierName, potentialIncrease }: FiberAlertProps) {
  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 lg:p-6">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground shrink-0">
          <span className="text-xl font-bold">{fibersToNext}</span>
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            Faltam {fibersToNext} fibras para o proximo patamar!
          </h3>
          <p className="text-muted-foreground mt-1">
            Atinge o patamar <TierBadge tierName={nextTierName} size="sm" /> e ganha mais{' '}
            <span className="font-semibold text-green-600">+{potentialIncrease.toFixed(2)}€</span> em comissoes
          </p>
        </div>
      </div>
    </div>
  )
}
