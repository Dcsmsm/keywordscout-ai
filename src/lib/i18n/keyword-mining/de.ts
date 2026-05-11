import { LanguageMiningConfig } from './types'

export const de: LanguageMiningConfig = {
  language: 'de',

  questionModifiers: ['wie', 'wann', 'welcher', 'welche', 'welches', 'warum', 'wo', 'wer', 'was ist', 'kann man'],
  commercialModifiers: ['beste', 'bestes', 'bester', 'günstig', 'günstige', 'preis', 'bewertung', 'erfahrungen', 'kaufen', 'angebot', 'rabatt', 'empfehlung'],
  comparisonModifiers: ['vs', 'versus', 'vergleich', 'alternative', 'alternativen', 'unterschied zwischen', 'oder'],
  temporalModifiers: ['2025', '2026', 'heute', 'aktuell', 'leitfaden', 'neu', 'aktuelle version'],
  audienceModifiers: ['für anfänger', 'für familien', 'für unternehmen', 'für kinder', 'für senioren', 'selbst machen', 'professionell'],

  stopwords: new Set([
    'der', 'die', 'das', 'ein', 'eine', 'einem', 'einen', 'eines', 'einer',
    'des', 'dem', 'den', 'im', 'ins', 'am', 'ans', 'zum', 'zur',
    'von', 'mit', 'bei', 'nach', 'aus', 'zu', 'an', 'auf', 'in', 'über',
    'unter', 'vor', 'hinter', 'neben', 'und', 'oder', 'aber', 'wenn',
    'dass', 'weil', 'da', 'ob', 'als', 'wie', 'so', 'noch', 'auch',
    'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'nicht', 'kein',
    'sehr', 'mehr', 'nur', 'schon', 'noch', 'hier', 'da',
  ]),

  intentPatterns: {
    informational: [
      /^wie\s/i, /^was\s/i, /^wann\s/i, /^warum\s/i, /^wo\s/i,
      /\bleitfaden\b/i, /\btutorial\b/i, /\berklärung\b/i, /\bbedeutet\b/i,
      /\bdefinition\b/i, /\blernen\b/i, /\btipps\b/i,
    ],
    commercial: [
      /\bbest(e[rns]?)?\b/i, /\bbewertung\b/i, /\berfahrungen\b/i,
      /\bpreis\b/i, /\bgünstig\b/i, /\bangebot\b/i, /\brabatt\b/i,
      /\bempfehl/i,
    ],
    transactional: [
      /\bkaufen\b/i, /\bbestellen\b/i, /\bshop\b/i, /\bonlineshop\b/i,
      /\bgutschein\b/i, /\babonnieren\b/i,
    ],
    navigational: [
      /\bwebsite\b/i, /\boffiziell\b/i, /\banmeldung\b/i, /\bdownload\b/i,
      /\bapp\b/i, /\binstallieren\b/i, /\beinloggen\b/i,
    ],
    comparison: [
      /\bvs\b/i, /\bversus\b/i, /\bvergleich\b/i, /\balternativ/i,
      /\bunterschied\b/i, /\bbesser\b.+\boder\b/i,
    ],
  },

  normalization: { removeAccents: false, collapseSpaces: true },

  minTokens: 2,
  maxTokens: 7,
}
