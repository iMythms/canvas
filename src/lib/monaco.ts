import { loader } from '@monaco-editor/react'
import { createSyntaxRules, jsonTokenLanguage, withCallableTokens } from './syntaxPalette'
import { defaultAppearance, resolveAppearance } from './themes'
import * as monaco from 'monaco-editor/editor/editor.api.js'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import 'monaco-editor/features/codicon/register.js'
import 'monaco-editor/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js'
import 'monaco-editor/languages/definitions/java/register.js'
import 'monaco-editor/languages/definitions/cpp/register.js'
import 'monaco-editor/languages/definitions/go/register.js'
import 'monaco-editor/languages/definitions/rust/register.js'
import 'monaco-editor/editor/contrib/find/browser/findController.js'
import 'monaco-editor/editor/contrib/folding/browser/folding.js'
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching.js'
// @ts-expect-error Monaco ships these bundled grammar modules without declarations.
import { conf as javascriptConfiguration, language as javascriptGrammar } from 'monaco-editor/languages/definitions/javascript/javascript.js'
// @ts-expect-error Monaco ships these bundled grammar modules without declarations.
import { conf as typescriptConfiguration, language as typescriptGrammar } from 'monaco-editor/languages/definitions/typescript/typescript.js'
import 'monaco-editor/languages/definitions/markdown/register.js'
// @ts-expect-error Monaco ships these bundled grammar modules without declarations.
import { conf as pythonConfiguration, language as pythonGrammar } from 'monaco-editor/languages/definitions/python/python.js'
import 'monaco-editor/languages/definitions/css/register.js'
import 'monaco-editor/languages/definitions/html/register.js'
import 'monaco-editor/languages/definitions/sql/register.js'
import 'monaco-editor/languages/definitions/shell/register.js'
import 'monaco-editor/languages/definitions/yaml/register.js'

// All assets are bundled by Vite. The loader never needs the Monaco CDN.
self.MonacoEnvironment = { getWorker: () => new EditorWorker() }
loader.config({ monaco })

export function releaseEditorModels(...paths: string[]) {
  // The React wrapper disposes editors during passive cleanup. Wait until that
  // cleanup finishes: Monaco 0.57 rejects disposing models still used by a diff.
  // Capture now so a newly mounted editor at the same path is never affected.
  const models = paths.map((path) => monaco.editor.getModel(monaco.Uri.parse(path)))
  queueMicrotask(() => {
    for (const model of models) {
      if (model && !model.isDisposed() && !model.isAttachedToEditor()) model.dispose()
    }
  })
}

export interface EditorAppearance {
  accent: string
  background: string
  foreground: string
  muted: string
  border: string
  codeFontFamily: string
  codeFontSize: number
}

function editorThemeData(theme: 'light' | 'dark', appearance: Pick<EditorAppearance, 'accent' | 'background' | 'foreground' | 'muted' | 'border'>): monaco.editor.IStandaloneThemeData {
  return {
    base: theme === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: createSyntaxRules(theme, appearance.background, appearance.foreground),
    colors: {
      'editor.background': appearance.background,
      'editor.foreground': appearance.foreground,
      'editorLineNumber.foreground': appearance.muted,
      'editorLineNumber.activeForeground': appearance.accent,
      'editorCursor.foreground': appearance.accent,
      'editor.selectionBackground': `${appearance.accent}44`,
      'editor.inactiveSelectionBackground': `${appearance.accent}22`,
      'editor.lineHighlightBackground': `${appearance.accent}0b`,
      'editorIndentGuide.background1': appearance.border,
      'editorWidget.background': appearance.background,
      'editorWidget.border': appearance.border,
      'focusBorder': appearance.accent,
    },
  }
}

export function configureEditorAppearance(theme: 'light' | 'dark', appearance?: EditorAppearance) {
  if (!appearance) {
    monaco.editor.setTheme(`canvas-${theme}`)
    return
  }
  monaco.editor.defineTheme(`canvas-custom-${theme}`, editorThemeData(theme, appearance))
  monaco.editor.setTheme(`canvas-custom-${theme}`)
}

// Register these grammars directly so a lazy bundled provider cannot replace
// the small callable-token enhancement on the first editor/model activation.
for (const [id, grammar, configuration] of [
  ['javascript', javascriptGrammar, javascriptConfiguration],
  ['typescript', typescriptGrammar, typescriptConfiguration],
  ['python', pythonGrammar, pythonConfiguration],
] as const) {
  const metadata = {
    javascript: { extensions: ['.js', '.es6', '.jsx', '.mjs', '.cjs'], firstLine: '^#!.*\\bnode', filenames: ['jakefile'], aliases: ['JavaScript', 'javascript', 'js'], mimetypes: ['text/javascript'] },
    typescript: { extensions: ['.ts', '.tsx', '.cts', '.mts'], aliases: ['TypeScript', 'ts', 'typescript'], mimetypes: ['text/typescript'] },
    python: { extensions: ['.py', '.rpy', '.pyw', '.cpy', '.gyp', '.gypi'], aliases: ['Python', 'py'], firstLine: '^#!/.*\\bpython[0-9.-]*\\b' },
  }
  monaco.languages.register({ id, ...metadata[id] })
  monaco.languages.setLanguageConfiguration(id, configuration)
  monaco.languages.setMonarchTokensProvider(id, withCallableTokens(grammar))
}

// JSON only needs tokenization here; omit language servers and their large workers.
monaco.languages.register({ id: 'json' })
monaco.languages.setMonarchTokensProvider('json', jsonTokenLanguage)

// The wrapper also uses these stable names when no appearance is supplied.
for (const mode of ['light', 'dark'] as const) {
  const appearance = resolveAppearance({ ...defaultAppearance, mode }, mode === 'dark')
  monaco.editor.defineTheme(`canvas-${mode}`, editorThemeData(mode, appearance))
}

export const editorLanguages = [
  ['plaintext', 'Plain text'],
  ['markdown', 'Markdown'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['json', 'JSON'],
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['python', 'Python'],
  ['sql', 'SQL'],
  ['shell', 'Shell'],
  ['yaml', 'YAML'],
  ['java', 'Java'],
  ['cpp', 'C++'],
  ['go', 'Go'],
  ['rust', 'Rust'],
] as const

export const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fontFamily: '"Geist Mono Variable", monospace',
  fontSize: 15,
  lineHeight: 23,
  minimap: { enabled: false },
  lineNumbersMinChars: 4,
  padding: { top: 8, bottom: 8 },
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  renderLineHighlight: 'line',
  tabSize: 2,
  insertSpaces: true,
  wordWrap: 'on',
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  scrollbar: { verticalScrollbarSize: 7, horizontalScrollbarSize: 7 },
  bracketPairColorization: { enabled: true },
  stickyScroll: { enabled: false },
  accessibilitySupport: 'auto',
}
