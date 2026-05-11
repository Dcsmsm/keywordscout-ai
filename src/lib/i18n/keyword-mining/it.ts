import { LanguageMiningConfig } from './types'

export const it: LanguageMiningConfig = {
  language: 'it',

  questionModifiers: ['come', 'quando', 'quale', 'quali', 'quanto', 'quanti', 'perché', 'dove', 'chi', 'cosa è', 'cos è'],
  commercialModifiers: ['migliore', 'miglior', 'conviene', 'recensioni', 'opinioni', 'costo', 'prezzo', 'economico', 'economica', 'offerta', 'acquistare', 'comprare', 'acquisto'],
  comparisonModifiers: ['vs', 'versus', 'confronto', 'alternative', 'differenza tra', 'meglio o'],
  temporalModifiers: ['2025', '2026', 'oggi', 'aggiornato', 'guida', 'nuovo', 'ultima versione'],
  audienceModifiers: ['per principianti', 'per famiglie', 'per partita iva', 'per aziende', 'per bambini', 'per anziani', 'fai da te', 'professionale'],

  stopwords: new Set([
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
    'di', 'del', 'dello', 'della', 'dei', 'degli', 'delle',
    'a', 'al', 'allo', 'alla', 'ai', 'agli', 'alle',
    'da', 'dal', 'dallo', 'dalla', 'dai', 'dagli', 'dalle',
    'in', 'nel', 'nello', 'nella', 'nei', 'negli', 'nelle',
    'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'ma', 'se',
    'che', 'chi', 'cui', 'non', 'ne', 'ci', 'si',
  ]),

  intentPatterns: {
    informational: [
      /^come\s/i, /^quando\s/i, /^perch[eé]\s/i, /^cosa\s/i, /^cos[\'è]\s/i,
      /^quale\s/i, /^quanto\s/i, /\bguida\b/i, /\btutorial\b/i, /\bspiegaz/i,
      /\bsignifica\b/i, /\bdefiniz/i,
    ],
    commercial: [
      /\bmiglior\b/i, /\brecension/i, /\bopinion/i, /\bvoto\b/i,
      /\bconvenien/i, /\bcosto\b/i, /\bprezzo\b/i, /\beconomic/i,
      /\boffert/i,
    ],
    transactional: [
      /\bacquist/i, /\bcompr/i, /\border/i, /\bscont/i,
      /\bspediz/i, /\bshop\b/i, /\bnegozio\b/i,
    ],
    navigational: [
      /\bsito\b/i, /\bufficiale\b/i, /\baccesso\b/i, /\bdownload\b/i,
      /\bapp\b/i, /\binstalla/i,
    ],
    comparison: [
      /\bvs\b/i, /\bversus\b/i, /\bconfronto\b/i, /\balternativ/i,
      /\bdifferenza\b/i, /\bmeglio\b.+\bo\b/i,
    ],
  },

  normalization: { removeAccents: false, collapseSpaces: true },

  minTokens: 2,
  maxTokens: 7,
}
