/* eslint-disable @typescript-eslint/no-explicit-any */
import { SearchProvider, ProviderKey } from '@/types/providers'
import { SerpApiProvider } from './serpapi'
import { SerperProvider } from './serper'
import { DataForSEOProvider } from './dataforseo'
import { MockSearchProvider } from './mock'
import { createAdminClient } from '@/lib/supabase/admin'
import { API_RETRY_ATTEMPTS, API_RETRY_DELAY_MS } from '@/lib/constants'

let activeProvider: SearchProvider | null = null
let fallbackProvider: SearchProvider | null = null

export function createProvider(key: ProviderKey, config?: Record<string, string>): SearchProvider {
  switch (key) {
    case 'serpapi':
      return new SerpApiProvider(config?.apiKey ?? process.env.SERPAPI_API_KEY ?? '')
    case 'serper':
      return new SerperProvider(config?.apiKey ?? process.env.SERPER_API_KEY ?? '')
    case 'dataforseo':
      return new DataForSEOProvider(
        config?.login ?? process.env.DATAFORSEO_LOGIN ?? '',
        config?.password ?? process.env.DATAFORSEO_PASSWORD ?? ''
      )
    case 'mock':
    default:
      return new MockSearchProvider()
  }
}

export async function getActiveProvider(): Promise<SearchProvider> {
  if (activeProvider) return activeProvider

  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from('serp_provider_configs') as any)
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single()

    // Only use DB config if it's a real provider (not mock), or if no env vars are available
    if (data && data.provider_key !== 'mock') {
      activeProvider = createProvider(data.provider_key as ProviderKey)
      return activeProvider
    }
  } catch {
    // Fall through to env var detection
  }

  // Auto-detect from env vars
  if (process.env.SERPAPI_API_KEY) {
    activeProvider = createProvider('serpapi')
    return activeProvider
  }
  if (process.env.SERPER_API_KEY) {
    activeProvider = createProvider('serper')
    return activeProvider
  }
  if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) {
    activeProvider = createProvider('dataforseo')
    return activeProvider
  }

  activeProvider = createProvider('mock')
  return activeProvider
}

export async function getFallbackProvider(): Promise<SearchProvider | null> {
  if (fallbackProvider) return fallbackProvider

  try {
    const supabase = createAdminClient()
    const { data } = await (supabase.from('serp_provider_configs') as any)
      .select('*')
      .eq('is_fallback', true)
      .limit(1)
      .single()

    if (data) {
      fallbackProvider = createProvider(data.provider_key as ProviderKey)
      return fallbackProvider
    }
  } catch {
    // No fallback configured
  }

  return null
}

export function invalidateProviderCache() {
  activeProvider = null
  fallbackProvider = null
}

export async function withRetry<T>(fn: () => Promise<T>, attempts = API_RETRY_ATTEMPTS): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (i < attempts) {
        await new Promise((resolve) => setTimeout(resolve, API_RETRY_DELAY_MS * (i + 1)))
      }
    }
  }

  throw lastError
}

export async function withFallback<T>(primary: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await withRetry(primary)
  } catch (primaryErr) {
    console.error('[Provider] Primary failed, trying fallback:', primaryErr)
    try {
      return await withRetry(fallback)
    } catch (fallbackErr) {
      throw new Error(`Both providers failed. Primary: ${primaryErr}. Fallback: ${fallbackErr}`)
    }
  }
}

export async function logProviderCall(
  providerKey: string,
  query: string,
  status: 'success' | 'error' | 'timeout',
  latencyMs: number,
  errorMessage?: string,
  responseData?: unknown
) {
  try {
    const supabase = createAdminClient()
    const { data: log } = await (supabase.from('serp_provider_logs') as any)
      .insert({ provider_key: providerKey, query, status, latency_ms: latencyMs, error_message: errorMessage ?? null })
      .select('id')
      .single()

    if (log && responseData) {
      await (supabase.from('serp_raw_responses') as any).insert({
        log_id: (log as any).id,
        response_data: responseData as Record<string, unknown>,
      })
    }
  } catch {
    // Non-critical
  }
}
