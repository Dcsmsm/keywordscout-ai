import {
  SearchProvider,
  KeywordIdea,
  SerpAnalysis,
  KeywordOptions,
  SerpOptions,
  AutocompleteOptions,
  Question,
} from '@/types/providers'
import { normalizeSerpResult } from './normalizer'
import { API_TIMEOUT_MS } from '@/lib/constants'

export class SerpApiProvider implements SearchProvider {
  name = 'serpapi'
  private apiKey: string
  private baseUrl = 'https://serpapi.com/search'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getKeywordIdeas(seed: string, options?: KeywordOptions): Promise<KeywordIdea[]> {
    const params = new URLSearchParams({
      engine: 'google_autocomplete',
      q: seed,
      gl: options?.country ?? 'us',
      hl: options?.language ?? 'en',
      api_key: this.apiKey,
    })

    const data = await this.fetchUrl(`${this.baseUrl}?${params}`)
    const suggestions: string[] = (data.suggestions as Array<{ value: string }> ?? []).map((s) => s.value)

    return suggestions.slice(0, options?.limit ?? 10).map((kw) => ({
      keyword: kw,
      intent: 'informational' as const,
    }))
  }

  async getSerpAnalysis(keyword: string, options?: SerpOptions): Promise<SerpAnalysis> {
    const params = new URLSearchParams({
      engine: 'google',
      q: keyword,
      gl: options?.country ?? 'us',
      hl: options?.language ?? 'en',
      device: options?.device ?? 'desktop',
      num: '10',
      api_key: this.apiKey,
    })

    const data = await this.fetchUrl(`${this.baseUrl}?${params}`)

    const results = ((data.organic_results as Array<{ position: number; title: string; link: string; snippet?: string }>) ?? [])
      .map((r) => normalizeSerpResult(r))

    const paa: string[] = ((data.related_questions as Array<{ question: string }>) ?? [])
      .map((q) => q.question)

    const related: string[] = ((data.related_searches as Array<{ query: string }>) ?? [])
      .map((r) => r.query)

    const searchInfo = data.search_information as { total_results?: number } | undefined

    return {
      keyword,
      results,
      peopleAlsoAsk: paa,
      relatedSearches: related,
      totalResults: searchInfo?.total_results,
    }
  }

  async getAutocomplete(seed: string, options?: AutocompleteOptions): Promise<string[]> {
    const params = new URLSearchParams({
      engine: 'google_autocomplete',
      q: seed,
      gl: options?.country ?? 'us',
      hl: options?.language ?? 'en',
      api_key: this.apiKey,
    })
    const data = await this.fetchUrl(`${this.baseUrl}?${params}`)
    return ((data.suggestions as Array<{ value: string }>) ?? []).map((s) => s.value)
  }

  async getRelatedSearches(keyword: string): Promise<string[]> {
    const analysis = await this.getSerpAnalysis(keyword)
    return analysis.relatedSearches ?? []
  }

  async getPeopleAlsoAsk(keyword: string): Promise<Question[]> {
    const analysis = await this.getSerpAnalysis(keyword)
    return (analysis.peopleAlsoAsk ?? []).map((q) => ({ question: q }))
  }

  private async fetchUrl(url: string): Promise<Record<string, unknown>> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
    try {
      const response = await globalThis.fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error(`SerpApi error: ${response.status}`)
      return response.json()
    } finally {
      clearTimeout(timeout)
    }
  }
}
