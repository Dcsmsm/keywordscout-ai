import {
  SearchProvider,
  KeywordIdea,
  SerpAnalysis,
  KeywordOptions,
  SerpOptions,
} from '@/types/providers'

const MOCK_RESULTS = [
  { position: 1, title: 'Complete Guide to {keyword} in 2025', url: 'https://example.com/guide', domain: 'example.com', snippet: 'Learn everything about {keyword}.', type: 'organic' as const },
  { position: 2, title: 'Reddit: What is {keyword}?', url: 'https://reddit.com/r/seo/comments/abc/{keyword}', domain: 'reddit.com', snippet: 'Discussion about {keyword}.', type: 'forum' as const },
  { position: 3, title: '{keyword} - Wikipedia', url: 'https://en.wikipedia.org/wiki/{keyword}', domain: 'en.wikipedia.org', snippet: 'Wikipedia article about {keyword}.', type: 'organic' as const },
  { position: 4, title: 'How to use {keyword} effectively', url: 'https://hubpages.com/{keyword}', domain: 'hubpages.com', snippet: 'Tips for using {keyword}.', type: 'organic' as const },
  { position: 5, title: 'Quora: Best way to do {keyword}?', url: 'https://quora.com/What-is-{keyword}', domain: 'quora.com', snippet: 'Quora answers about {keyword}.', type: 'forum' as const },
]

export class MockSearchProvider implements SearchProvider {
  name = 'mock'

  async getKeywordIdeas(seed: string, options?: KeywordOptions): Promise<KeywordIdea[]> {
    await this.delay(200)
    return ([
      { keyword: seed, volume: 1200, cpc: 0.85, competition: 0.3, intent: 'informational' as const },
      { keyword: `${seed} guide`, volume: 800, cpc: 0.60, competition: 0.2, intent: 'informational' as const },
      { keyword: `best ${seed}`, volume: 2200, cpc: 1.20, competition: 0.5, intent: 'commercial' as const },
      { keyword: `${seed} tips`, volume: 600, cpc: 0.45, competition: 0.25, intent: 'informational' as const },
      { keyword: `how to ${seed}`, volume: 3400, cpc: 0.90, competition: 0.4, intent: 'informational' as const },
      { keyword: `${seed} examples`, volume: 1800, cpc: 0.55, competition: 0.3, intent: 'informational' as const },
      { keyword: `${seed} for beginners`, volume: 900, cpc: 0.70, competition: 0.2, intent: 'informational' as const },
      { keyword: `${seed} tools`, volume: 1500, cpc: 1.40, competition: 0.45, intent: 'commercial' as const },
    ] satisfies KeywordIdea[]).slice(0, options?.limit ?? 8)
  }

  async getSerpAnalysis(keyword: string, _options?: SerpOptions): Promise<SerpAnalysis> {
    await this.delay(300)
    return {
      keyword,
      results: MOCK_RESULTS.map((r) => ({
        ...r,
        title: r.title.replace(/{keyword}/g, keyword),
        url: r.url.replace(/{keyword}/g, encodeURIComponent(keyword)),
        snippet: r.snippet.replace(/{keyword}/g, keyword),
      })),
      peopleAlsoAsk: [
        `What is ${keyword}?`,
        `How to use ${keyword}?`,
        `Why is ${keyword} important?`,
        `Best practices for ${keyword}`,
      ],
      relatedSearches: [
        `${keyword} tutorial`,
        `${keyword} examples`,
        `${keyword} benefits`,
        `${keyword} vs alternatives`,
      ],
      totalResults: 450000,
    }
  }

  async getAutocomplete(seed: string): Promise<string[]> {
    await this.delay(100)
    return [`${seed} guide`, `${seed} tutorial`, `${seed} tips`, `${seed} examples`, `${seed} best practices`]
  }

  async getRelatedSearches(keyword: string): Promise<string[]> {
    await this.delay(100)
    return [`${keyword} alternative`, `${keyword} free`, `${keyword} online`, `${keyword} course`]
  }

  async getPeopleAlsoAsk(keyword: string) {
    await this.delay(100)
    return [{ question: `What is ${keyword}?` }, { question: `How does ${keyword} work?` }, { question: `Is ${keyword} free?` }]
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
