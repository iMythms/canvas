export type JsonIndentation = 2 | 4 | 'tabs'

/** Native JSON syntax errors vary by engine; retain a location when supplied. */
export class JsonFormatError extends SyntaxError {
  readonly line?: number
  readonly column?: number

  constructor(source: string, cause: unknown) {
    const message = cause instanceof Error ? cause.message : 'Invalid JSON'
    super(message)
    this.name = 'JsonFormatError'
    const location = /line (\d+) column (\d+)/i.exec(message)
    if (location) {
      this.line = Number(location[1])
      this.column = Number(location[2])
    } else {
      const position = /position (\d+)/i.exec(message)
      const offset = position ? Number(position[1]) : /unexpected end/i.test(message) ? source.length : undefined
      if (offset !== undefined) {
        const lines = source.slice(0, offset).split(/\r\n|\r|\n/)
        this.line = lines.length
        this.column = lines[lines.length - 1]!.length + 1
      }
    }
  }
}

function tokens(source: string): string[] {
  try {
    // Validate only. Never serialize the parsed value: doing so loses duplicate
    // keys, exact numeric literals, property order, and original string escapes.
    JSON.parse(source)
  } catch (error) {
    throw new JsonFormatError(source, error)
  }
  return source.match(/"(?:[^"\\]|\\[\s\S])*"|[{}\[\],:]|[^\x20\t\r\n{}\[\],:]+/g) ?? []
}

export function minifyJson(source: string): string {
  return tokens(source).join('')
}

export function formatJson(source: string, indentation: JsonIndentation = 2): string {
  const input = tokens(source)
  const unit = indentation === 'tabs' ? '\t' : ' '.repeat(indentation)
  const output: string[] = []
  let depth = 0
  const newline = () => output.push('\n', unit.repeat(depth))
  for (let index = 0; index < input.length; index++) {
    const token = input[index]!
    if (token === '{' || token === '[') {
      output.push(token)
      depth++
      if (input[index + 1] !== (token === '{' ? '}' : ']')) newline()
    } else if (token === '}' || token === ']') {
      depth--
      if (input[index - 1] !== (token === '}' ? '{' : '[')) newline()
      output.push(token)
    } else if (token === ',') {
      output.push(token)
      newline()
    } else if (token === ':') {
      output.push(': ')
    } else {
      output.push(token)
    }
  }
  return output.join('')
}
