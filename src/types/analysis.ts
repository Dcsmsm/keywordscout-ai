export interface AnalysisResult {
  id: string
  keyword: string
  estimatedVolume: number | null
  intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null
  difficultyEstimate: number | null
  serpWeaknessScore: number | null
  opportunityScore: number | null
  suggestedTitle: string | null
  contentAngle: string | null
  topicCluster: string | null
  serpFeatures: SerpFeatures | null
}

export interface SerpFeatures {
  hasReddit: boolean
  hasQuora: boolean
  hasForums: boolean
  hasWeakDomains: boolean
  hasOutdatedResults: boolean
  hasExactTitleMatches: boolean
  hasVideoResults: boolean
  hasPAA: boolean
}

export interface AnalysisHistory {
  id: string
  seedKeyword: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  providerUsed: string | null
  resultsCount: number
  createdAt: string
}

export interface PlanLimits {
  free: number
  pro: number
  business: number
}

export const PLAN_LIMITS: PlanLimits = {
  free: 5,
  pro: 100,
  business: 500,
}

export const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  business: 'Business',
}

export const PLAN_PRICES = {
  free: 0,
  pro: 29,
  business: 99,
} as const
