import type { editor, languages } from 'monaco-editor/editor/editor.api.js'

// Canvas dark's supplied accent, text, status and muted colors. Token categories
// come from Monaco's bundled Monarch grammars, not VS Code semantic analysis.
export const syntaxPalettes = {
  dark: {
    text: '#f8f8f2', identifier: '#9cdcfe', variable: '#9cdcfe',
    keyword: '#9580ff', string: '#ffff80', number: '#ff9580',
    comment: '#8aa4bd', type: '#bfb3ff', function: '#80ffea',
    key: '#80ffea', operator: '#9580ff', tag: '#ff9580',
  },
  light: {
    text: '#292824', identifier: '#245b85', variable: '#245b85',
    keyword: '#6541b2', string: '#6a5800', number: '#a43b29',
    comment: '#596575', type: '#684ca1', function: '#006e65',
    key: '#006e65', operator: '#6541b2', tag: '#a43b29',
  },
} as const

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(offset => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
}

export function contrastRatio(first: string, second: string): number {
  const a = luminance(first), b = luminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

function readable(color: string, background: string): string {
  if (contrastRatio(color, background) >= 4.5) return color
  const target = contrastRatio('#ffffff', background) > contrastRatio('#000000', background) ? 255 : 0
  // Preserve the hue as far as possible, including light mode on custom dark
  // backgrounds (and the reverse). Caller-selected editor foreground stays exact.
  for (let step = 1; step <= 100; step++) {
    const amount = step / 100
    const adjusted = '#' + [1, 3, 5].map(offset => Math.round(parseInt(color.slice(offset, offset + 2), 16) * (1 - amount) + target * amount).toString(16).padStart(2, '0')).join('')
    if (contrastRatio(adjusted, background) >= 4.5) return adjusted
  }
  return target ? '#ffffff' : '#000000'
}

export function createSyntaxRules(mode: 'light' | 'dark', background: string, foreground: string): editor.ITokenThemeRule[] {
  const source = syntaxPalettes[mode]
  const colors = Object.fromEntries(Object.entries(source).map(([key, value]) => [key, readable(value, background)])) as Record<keyof typeof source, string>
  // Monarch token names use dot-prefix inheritance, e.g. string.escape.js and
  // number.float.python. Specialized categories override the broader ones.
  const groups: [string[], string][] = [
    [['identifier', 'variable', 'variable.predefined', 'constant'], colors.variable],
    [['metatag.content'], foreground],
    [['keyword', 'keyword.control', 'keyword.flow', 'operator', 'operators'], colors.keyword],
    [['string', 'string.quote', 'string.escape', 'regexp', 'string.regexp', 'attribute.value'], colors.string],
    [['number', 'number.hex', 'number.float', 'constant.numeric'], colors.number],
    [['comment', 'comment.doc'], colors.comment],
    [['type', 'type.identifier', 'typeIdentifier', 'keyword.type', 'namespace', 'annotation', 'predefined'], colors.type],
    [['function', 'function.identifier', 'function.predefined', 'entity.name.function', 'predefined.sql', 'type.identifier.shell'], colors.function],
    [['key', 'string.key', 'string.key.json', 'attribute.name', 'attribute.name.html', 'attribute.name.css', 'type.yaml'], colors.key],
    [['tag', 'tag.html', 'metatag', 'tag.yaml'], colors.tag],
    [['delimiter', 'delimiter.bracket'], colors.comment],
    [['keyword.json'], colors.keyword],
    // These are the actual bundled Markdown categories. List markers and
    // headings share keyword.md; link labels are unclassified by the grammar.
    [['keyword.md', 'meta.separator.md'], colors.keyword],
    [['variable.md', 'variable.source.md'], colors.string],
    [['string.link.md', 'string.target.md'], colors.function],
    [['escape.md'], colors.operator],
    [['emphasis.md'], colors.tag],
    [['strong.md'], colors.type],
  ]
  return [
    { token: '', foreground: foreground.slice(1) },
    ...groups.flatMap(([tokens, color]) => tokens.map(token => ({ token, foreground: color.slice(1) }))),
    { token: 'emphasis', fontStyle: 'italic' },
    { token: 'strong', fontStyle: 'bold' },
  ]
}

// Tokenization only: deliberately no JSON language service or worker.
export const jsonTokenLanguage: languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/"([^"\\]|\\.)*"(?=\s*:)/, 'key'],
      [/"([^"\\]|\\.)*"/, 'string'],
      [/-?\d+(\.\d+)?([eE][+-]?\d+)?/, 'number'],
      [/\b(true|false|null)\b/, 'keyword'],
      [/[{}\[\]]/, '@brackets'],
      [/[,:]/, 'delimiter'],
    ],
  },
}

// Preserve the bundled keyword/string/comment rules and add only a lexical
// callable distinction. This recognizes same-line calls and declarations, not
// symbol identity, inferred types, or functions passed around as values.
export function withCallableTokens(language: languages.IMonarchLanguage): languages.IMonarchLanguage {
  return {
    ...language,
    tokenizer: Object.fromEntries(Object.entries(language.tokenizer).map(([state, rules]) => [state, rules.flatMap<languages.IMonarchLanguageRule>(rule => {
      if (!Array.isArray(rule)) return [rule];
      const [pattern, action] = rule;
      if (!(pattern instanceof RegExp) || typeof action !== 'object' || !('cases' in action)) return [rule];
      const cases = action.cases as Record<string, languages.IMonarchLanguageAction> | undefined;
      if (cases?.['@default'] !== 'identifier') return [rule];
      return [
        [new RegExp(`${pattern.source}(?=\\s*\\()`, pattern.flags), { cases: { ...cases, '@default': 'function' } }],
        rule,
      ];
    })])),
  };
}
