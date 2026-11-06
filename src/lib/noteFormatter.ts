import { detectLanguage } from './noteMode.ts'
import { formatJson } from './jsonFormatter.ts'

export type FormatResult = { kind: 'formatted' | 'unchanged'; text: string; offsets: number[] } | { kind: 'unsupported'; message: string } | { kind: 'error'; message: string }

export async function formatNote(text: string, choice: string, offsets: number[] = []): Promise<FormatResult> {
  const language = choice === 'auto' ? detectLanguage(text) : choice
  const parsers: Record<string, string> = { javascript: 'babel', typescript: 'typescript', html: 'html', css: 'css', markdown: 'markdown', yaml: 'yaml' }
  if (language !== 'json' && !parsers[language]) return { kind: 'unsupported', message: `Formatting is not supported for ${language}.` }
  try {
    const crlf = text.includes('\r\n')
    let output: string
    let mapped: number[] = []
    if (language === 'json') output = formatJson(text, 2)
    else {
      const prettier = await import('prettier/standalone')
      const plugins = language === 'javascript' ? [await import('prettier/plugins/babel'), await import('prettier/plugins/estree')]
        : language === 'typescript' ? [await import('prettier/plugins/typescript'), await import('prettier/plugins/estree')]
        : language === 'html' ? [await import('prettier/plugins/html')]
        : language === 'css' ? [await import('prettier/plugins/postcss')]
        : language === 'markdown' ? [await import('prettier/plugins/markdown')]
        : [await import('prettier/plugins/yaml')]
      const options = { parser: parsers[language], plugins, tabWidth: 2, proseWrap: 'preserve' as const, embeddedLanguageFormatting: 'off' as const, endOfLine: crlf ? 'crlf' as const : 'lf' as const }
      const positions = new Map<number, number>()
      output = ''
      for (const offset of new Set(offsets)) {
        const result = await prettier.formatWithCursor(text, { ...options, cursorOffset: Math.max(0, Math.min(text.length, offset)) })
        output = result.formatted
        positions.set(offset, result.cursorOffset)
      }
      if (!offsets.length) output = await prettier.format(text, options)
      mapped = offsets.map(offset => positions.get(offset)!)
    }
    if (crlf) output = output.replace(/\r?\n/g, '\r\n')
    if (language === 'json') mapped = offsets.map(offset => mapJsonOffset(text, output, offset))
    return { kind: output === text ? 'unchanged' : 'formatted', text: output, offsets: mapped }
  } catch (error) {
    return { kind: 'error', message: `Could not format ${language}: ${error instanceof Error ? error.message : String(error)}` }
  }
}

// JSON formatting preserves every token, including whitespace inside strings.
function mapJsonOffset(before: string, after: string, offset: number): number {
  const tokenPattern = /"(?:[^"\\]|\\[\s\S])*"|[^\s]/g
  const outputTokens = after.matchAll(tokenPattern)
  for (const token of before.matchAll(tokenPattern)) {
    const output = outputTokens.next().value!
    if (offset < token.index + token[0].length) return output.index + Math.max(0, offset - token.index)
  }
  return after.length
}

export function isCurrentFormat(snapshot: { model: unknown; version: number; choice: string }, current: { model: unknown; version: number; choice: string }): boolean {
  return snapshot.model === current.model && snapshot.version === current.version && snapshot.choice === current.choice
}
