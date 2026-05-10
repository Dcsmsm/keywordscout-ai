import {
  SearchProvider,
  KeywordIdea,
  SerpAnalysis,
  KeywordOptions,
  SerpOptions,
} from '@/types/providers'

type LangTemplates = {
  pre: string[]
  post: string[]
  paa: string[]
  related: string[]
}

const LANG_TEMPLATES: Record<string, LangTemplates> = {
  it: {
    pre: ['migliori', 'come fare', "cos'è", 'guida'],
    post: ['guida', 'consigli', 'esempi', 'per principianti', 'strumenti', 'tutorial'],
    paa: ["Cos'è {k}?", 'Come usare {k}?', 'Perché {k} è importante?', 'Come iniziare con {k}?'],
    related: ['{k} tutorial', '{k} esempi', '{k} vantaggi', '{k} alternativa'],
  },
  es: {
    pre: ['mejores', 'cómo hacer', 'qué es', 'guía de'],
    post: ['guía', 'consejos', 'ejemplos', 'para principiantes', 'herramientas', 'tutorial'],
    paa: ['¿Qué es {k}?', '¿Cómo usar {k}?', '¿Por qué es importante {k}?', 'Mejores prácticas de {k}'],
    related: ['{k} tutorial', '{k} ejemplos', '{k} beneficios', '{k} alternativas'],
  },
  fr: {
    pre: ['meilleurs', 'comment faire', "qu'est-ce que", 'guide'],
    post: ['guide', 'conseils', 'exemples', 'pour débutants', 'outils', 'tutoriel'],
    paa: ["Qu'est-ce que {k}?", 'Comment utiliser {k}?', 'Pourquoi {k} est-il important?', 'Meilleures pratiques pour {k}'],
    related: ['{k} tutoriel', '{k} exemples', '{k} avantages', '{k} alternatives'],
  },
  de: {
    pre: ['beste', 'wie man', 'was ist', 'leitfaden'],
    post: ['leitfaden', 'tipps', 'beispiele', 'für anfänger', 'werkzeuge', 'tutorial'],
    paa: ['Was ist {k}?', 'Wie verwendet man {k}?', 'Warum ist {k} wichtig?', 'Best Practices für {k}'],
    related: ['{k} tutorial', '{k} beispiele', '{k} vorteile', '{k} alternativen'],
  },
  pt: {
    pre: ['melhores', 'como fazer', 'o que é', 'guia de'],
    post: ['guia', 'dicas', 'exemplos', 'para iniciantes', 'ferramentas', 'tutorial'],
    paa: ['O que é {k}?', 'Como usar {k}?', 'Por que {k} é importante?', 'Melhores práticas para {k}'],
    related: ['{k} tutorial', '{k} exemplos', '{k} benefícios', '{k} alternativas'],
  },
  en: {
    pre: ['best', 'how to', 'what is', 'guide to'],
    post: ['guide', 'tips', 'examples', 'for beginners', 'tools', 'tutorial'],
    paa: ['What is {k}?', 'How to use {k}?', 'Why is {k} important?', 'Best practices for {k}'],
    related: ['{k} tutorial', '{k} examples', '{k} benefits', '{k} vs alternatives'],
  },
}

function getLangTemplates(language?: string): LangTemplates {
  const lang = (language ?? 'en').slice(0, 2).toLowerCase()
  return LANG_TEMPLATES[lang] ?? LANG_TEMPLATES.en
}

const MOCK_SERP = [
  { position: 1, title: 'Complete Guide to {k}', url: 'https://example.com/guide', domain: 'example.com', snippet: 'Learn everything about {k}.', type: 'organic' as const },
  { position: 2, title: 'Reddit: What is {k}?', url: 'https://reddit.com/r/seo/{k}', domain: 'reddit.com', snippet: 'Discussion about {k}.', type: 'forum' as const },
  { position: 3, title: '{k} - Wikipedia', url: 'https://en.wikipedia.org/wiki/{k}', domain: 'en.wikipedia.org', snippet: 'Wikipedia article about {k}.', type: 'organic' as const },
  { position: 4, title: 'How to use {k} effectively', url: 'https://hubpages.com/{k}', domain: 'hubpages.com', snippet: 'Tips for {k}.', type: 'organic' as const },
  { position: 5, title: 'Quora: Best way to do {k}?', url: 'https://quora.com/What-is-{k}', domain: 'quora.com', snippet: 'Quora answers about {k}.', type: 'forum' as const },
]

export class MockSearchProvider implements SearchProvider {
  name = 'mock'

  async getKeywordIdeas(seed: string, options?: KeywordOptions): Promise<KeywordIdea[]> {
    await this.delay(200)
    const t = getLangTemplates(options?.language)
    const intents = ['informational', 'informational', 'commercial', 'informational', 'informational', 'informational', 'informational', 'commercial'] as const

    const ideas: KeywordIdea[] = [
      { keyword: seed, volume: 1200, cpc: 0.85, competition: 0.3, intent: 'informational' },
      ...t.pre.map((p, i) => ({
        keyword: `${p} ${seed}`,
        volume: [2200, 3400, 800, 600][i] ?? 900,
        cpc: [1.20, 0.90, 0.60, 0.45][i] ?? 0.70,
        competition: [0.5, 0.4, 0.2, 0.25][i] ?? 0.3,
        intent: intents[i + 1] ?? 'informational',
      })),
      ...t.post.map((p, i) => ({
        keyword: `${seed} ${p}`,
        volume: [800, 600, 900, 1500, 1800, 700][i] ?? 500,
        cpc: [0.60, 0.45, 0.70, 1.40, 0.55, 0.50][i] ?? 0.60,
        competition: [0.2, 0.25, 0.2, 0.45, 0.3, 0.2][i] ?? 0.25,
        intent: 'informational',
      })),
    ] satisfies KeywordIdea[]

    return ideas.slice(0, options?.limit ?? 8)
  }

  async getSerpAnalysis(keyword: string, options?: SerpOptions): Promise<SerpAnalysis> {
    await this.delay(300)
    const t = getLangTemplates(options?.language)
    return {
      keyword,
      results: MOCK_SERP.map((r) => ({
        ...r,
        title: r.title.replace(/{k}/g, keyword),
        url: r.url.replace(/{k}/g, encodeURIComponent(keyword)),
        snippet: r.snippet.replace(/{k}/g, keyword),
      })),
      peopleAlsoAsk: t.paa.map((q) => q.replace(/{k}/g, keyword)),
      relatedSearches: t.related.map((r) => r.replace(/{k}/g, keyword)),
      totalResults: 450000,
    }
  }

  async getAutocomplete(seed: string, language?: string): Promise<string[]> {
    await this.delay(100)
    const t = getLangTemplates(language)
    return [`${seed} ${t.post[0]}`, `${seed} ${t.post[1]}`, `${t.pre[0]} ${seed}`, `${seed} ${t.post[2]}`, `${seed} ${t.post[3]}`]
  }

  async getRelatedSearches(keyword: string, language?: string): Promise<string[]> {
    await this.delay(100)
    const t = getLangTemplates(language)
    return t.related.map((r) => r.replace(/{k}/g, keyword))
  }

  async getPeopleAlsoAsk(keyword: string, language?: string) {
    await this.delay(100)
    const t = getLangTemplates(language)
    return t.paa.slice(0, 3).map((q) => ({ question: q.replace(/{k}/g, keyword) }))
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
