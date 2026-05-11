import { LanguageMiningConfig } from './types'

export const en: LanguageMiningConfig = {
  language: 'en',

  questionModifiers: ['how to', 'how do', 'what is', 'when to', 'which', 'why', 'where to', 'who', 'can i', 'should i'],
  commercialModifiers: ['best', 'top', 'review', 'reviews', 'price', 'cost', 'buy', 'cheap', 'affordable', 'deal', 'discount', 'rated', 'recommended'],
  comparisonModifiers: ['vs', 'versus', 'compared to', 'alternative', 'alternatives', 'or', 'difference between'],
  temporalModifiers: ['2025', '2026', 'today', 'latest', 'updated', 'new', 'guide'],
  audienceModifiers: ['for beginners', 'for kids', 'for professionals', 'for seniors', 'diy', 'for small business', 'for home', 'advanced'],

  stopwords: new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'in', 'on',
    'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
    'is', 'it', 'its', 'be', 'was', 'are', 'were', 'been',
    'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would',
    'can', 'could', 'should', 'may', 'might', 'shall',
    'not', 'no', 'nor', 'so', 'yet', 'both', 'either',
    'that', 'this', 'these', 'those', 'my', 'your', 'our',
  ]),

  intentPatterns: {
    informational: [
      /^how\s/i, /^what\s/i, /^when\s/i, /^why\s/i, /^where\s/i,
      /\bguide\b/i, /\btutorial\b/i, /\bexplain/i, /\bmean(ing)?\b/i,
      /\bdefinition\b/i, /\blearn\b/i, /\btips\b/i,
    ],
    commercial: [
      /\bbest\b/i, /\btop\b/i, /\breview/i, /\brating/i,
      /\bprice\b/i, /\bcost\b/i, /\bcheap\b/i, /\baffordabl/i,
      /\bdeal\b/i, /\bdiscount\b/i,
    ],
    transactional: [
      /\bbuy\b/i, /\bpurchas/i, /\border\b/i, /\bshop\b/i,
      /\bcoupon\b/i, /\bcheckout\b/i, /\bsubscrib/i,
    ],
    navigational: [
      /\bwebsite\b/i, /\bofficial\b/i, /\blogin\b/i, /\bdownload\b/i,
      /\bapp\b/i, /\binstall\b/i, /\bsign in\b/i,
    ],
    comparison: [
      /\bvs\b/i, /\bversus\b/i, /\bcompar/i, /\balternativ/i,
      /\bdifference\b/i, /\bbetter\b.+\bor\b/i,
    ],
  },

  normalization: { removeAccents: true, collapseSpaces: true },

  minTokens: 2,
  maxTokens: 7,
}
