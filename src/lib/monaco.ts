import { loader } from '@monaco-editor/react'
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
import 'monaco-editor/languages/definitions/javascript/register.js'
import 'monaco-editor/languages/definitions/typescript/register.js'
import 'monaco-editor/languages/definitions/markdown/register.js'
import 'monaco-editor/languages/definitions/python/register.js'
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

export function configureEditorAppearance(theme: 'light' | 'dark', appearance?: EditorAppearance) {
  if (!appearance) {
    monaco.editor.setTheme(`canvas-${theme}`)
    return
  }
  monaco.editor.defineTheme(`canvas-custom-${theme}`, {
    base: theme === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [],
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
  })
  monaco.editor.setTheme(`canvas-custom-${theme}`)
}

// JSON only needs tokenization here; omit language servers and their large workers.
monaco.languages.register({ id: 'json' })
monaco.languages.setMonarchTokensProvider('json', {
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
})

monaco.editor.defineTheme('canvas-light', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#343b34',
    'editorLineNumber.foreground': '#b0b6ac',
    'editorLineNumber.activeForeground': '#63785e',
    'editor.lineHighlightBackground': '#f7f8f5',
    'editor.selectionBackground': '#dce8dc',
    'editor.inactiveSelectionBackground': '#edf1e9',
    'editorCursor.foreground': '#55705c',
    'editorIndentGuide.background1': '#edf0e9',
    'editorWidget.border': '#e5e7e1',
    'focusBorder': '#92a88d',
    'diffEditor.insertedTextBackground': '#b8d9b950',
    'diffEditor.removedTextBackground': '#eabcb050',
    'diffEditor.insertedLineBackground': '#eef6eb',
    'diffEditor.removedLineBackground': '#fcf1ed',
  },
})

monaco.editor.defineTheme('canvas-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#202120',
    'editor.foreground': '#d7ded4',
    'editorLineNumber.foreground': '#686f65',
    'editorLineNumber.activeForeground': '#a7b8a1',
    'editor.lineHighlightBackground': '#262925',
    'editor.selectionBackground': '#3d5140',
    'editor.inactiveSelectionBackground': '#303a30',
    'editorCursor.foreground': '#b3c9a9',
    'editorIndentGuide.background1': '#343a32',
    'editorWidget.border': '#3a4137',
    'focusBorder': '#92a88d',
    'diffEditor.insertedTextBackground': '#537c4c60',
    'diffEditor.removedTextBackground': '#a25f4e50',
    'diffEditor.insertedLineBackground': '#283326',
    'diffEditor.removedLineBackground': '#352823',
  },
})

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
  fontSize: 13,
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
