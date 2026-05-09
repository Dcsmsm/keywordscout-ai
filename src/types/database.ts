export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          plan: 'free' | 'pro' | 'business'
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          plan?: 'free' | 'pro' | 'business'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          plan?: 'free' | 'pro' | 'business'
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          updated_at?: string
        }
      }
      usage: {
        Row: {
          id: string
          user_id: string
          month: string
          analyses_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month: string
          analyses_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          analyses_count?: number
          updated_at?: string
        }
      }
      keyword_analyses: {
        Row: {
          id: string
          user_id: string
          seed_keyword: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          provider_used: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          seed_keyword: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          provider_used?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          provider_used?: string | null
          error_message?: string | null
          updated_at?: string
        }
      }
      keyword_results: {
        Row: {
          id: string
          analysis_id: string
          keyword: string
          estimated_volume: number | null
          intent: 'informational' | 'navigational' | 'commercial' | 'transactional' | null
          difficulty_estimate: number | null
          serp_weakness_score: number | null
          opportunity_score: number | null
          suggested_title: string | null
          content_angle: string | null
          topic_cluster: string | null
          serp_features: Json | null
          raw_serp_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          keyword: string
          estimated_volume?: number | null
          intent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | null
          difficulty_estimate?: number | null
          serp_weakness_score?: number | null
          opportunity_score?: number | null
          suggested_title?: string | null
          content_angle?: string | null
          topic_cluster?: string | null
          serp_features?: Json | null
          raw_serp_data?: Json | null
          created_at?: string
        }
        Update: {
          keyword?: string
          estimated_volume?: number | null
          intent?: 'informational' | 'navigational' | 'commercial' | 'transactional' | null
          difficulty_estimate?: number | null
          serp_weakness_score?: number | null
          opportunity_score?: number | null
          suggested_title?: string | null
          content_angle?: string | null
          topic_cluster?: string | null
          serp_features?: Json | null
          raw_serp_data?: Json | null
        }
      }
      serp_provider_configs: {
        Row: {
          id: string
          name: string
          provider_key: 'serpapi' | 'serper' | 'dataforseo' | 'mock'
          is_active: boolean
          is_fallback: boolean
          api_key_encrypted: string | null
          config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          provider_key: 'serpapi' | 'serper' | 'dataforseo' | 'mock'
          is_active?: boolean
          is_fallback?: boolean
          api_key_encrypted?: string | null
          config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          is_active?: boolean
          is_fallback?: boolean
          api_key_encrypted?: string | null
          config?: Json | null
          updated_at?: string
        }
      }
      serp_provider_logs: {
        Row: {
          id: string
          provider_key: string
          query: string
          status: 'success' | 'error' | 'timeout'
          latency_ms: number | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider_key: string
          query: string
          status: 'success' | 'error' | 'timeout'
          latency_ms?: number | null
          error_message?: string | null
          created_at?: string
        }
        Update: never
      }
      serp_raw_responses: {
        Row: {
          id: string
          log_id: string
          response_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          log_id: string
          response_data: Json
          created_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
