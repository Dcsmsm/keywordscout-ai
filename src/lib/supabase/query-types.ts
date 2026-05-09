export interface UserProfile {
  full_name: string | null
  email: string
  role: string
}

export interface SubscriptionData {
  plan: string
  status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

export interface UsageData {
  analyses_count: number
}

export interface AnalysisRow {
  id: string
  seed_keyword: string
  status: string
  provider_used: string | null
  created_at: string
}

export interface ProviderConfig {
  id: string
  name: string
  provider_key: string
  is_active: boolean
  is_fallback: boolean
  api_key_encrypted: string | null
  config: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface ProviderLog {
  status: string
  latency_ms: number | null
  created_at: string
}
