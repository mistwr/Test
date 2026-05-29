export type UserRole = 'ADMIN' | 'PARCEIRO' | 'CHEFE_EQUIPA' | 'VENDEDOR'

export interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  team_id: string | null
  active: boolean
  avatar_url: string | null
  created_at: string
}

export interface Team {
  id: string
  name: string
  supervisor_id: string | null
  created_at: string
  supervisor?: Profile
  members?: Profile[]
}

export interface SalesResult {
  id: string
  seller_id: string
  team_id: string | null
  date: string
  fibers: number
  tvs: number
  mobiles: number
  fixed_lines: number
  validated: number
  cancelled: number
  pending: number
  notes: string | null
  created_by: string | null
  created_at: string
  seller?: Profile
  team?: Team
}

export interface CommissionRule {
  id: string
  min_fibers: number
  max_fibers: number | null
  fiber_value: number
  tv_value: number
  mobile_value: number
  fixed_value: number
  created_at: string
}

export interface Goal {
  id: string
  user_id: string | null
  team_id: string | null
  target_fibers: number
  period: string
  start_date: string | null
  end_date: string | null
  created_at: string
}

export interface Mission {
  id: string
  title: string
  description: string | null
  points: number
  active: boolean
  target_fibers: number | null
  target_tvs: number | null
  target_mobiles: number | null
  target_fixed: number | null
  badge_icon: string | null
  created_at: string
}

export interface LeaderboardPoint {
  id: string
  user_id: string
  points: number
  reason: string | null
  sale_id: string | null
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  icon: string
  requirement_type: string
  requirement_value: number
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

export interface SalesScript {
  id: string
  title: string
  category: string
  content: string
  active: boolean
  created_at: string
}

export interface Campaign {
  id: string
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  active: boolean
  created_by: string | null
  created_at: string
  materials?: CampaignMaterial[]
  creator?: Profile
}

export interface CampaignMaterial {
  id: string
  campaign_id: string | null
  title: string
  description: string | null
  file_url: string
  file_name: string
  file_type: string
  file_size: number | null
  category: string
  download_count: number
  uploaded_by: string | null
  created_at: string
  uploader?: Profile
}

export interface CommissionTier {
  minFibers: number
  maxFibers: number | null
  fiberValue: number
  tvValue: number
  mobileValue: number
  fixedValue: number
  tierName: string
}

export interface CommissionCalculation {
  totalFibers: number
  totalTvs: number
  totalMobiles: number
  totalFixed: number
  currentTier: CommissionTier
  fiberCommission: number
  tvCommission: number
  mobileCommission: number
  fixedCommission: number
  totalCommission: number
  baseSalary: number
  totalSalary: number
  nextTier: CommissionTier | null
  fibersToNextTier: number | null
  potentialIncrease: number | null
}
