import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import Editor, { type OnMount } from '@monaco-editor/react'
import { Replace, Search, WrapText } from './icons'
import { Button } from './ui'
import type { editor } from 'monaco-editor'
import { configureEditorAppearance, editorOptions, releaseEditorModels, type EditorAppearance } from '../lib/monaco'

interface NoteEditorProps {
  id: string
  value: string
  language: string
  theme: 'light' | 'dark'
  onChange: (value: string) => void
  controls: ReactNode
  appearance?: EditorAppearance
}

export default function NoteEditor({ id, value, language, theme, onChange, appearance, controls }: NoteEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const cursorListener = useRef<{ dispose: () => void } | null>(null)
  const [wrap, setWrap] = useState(true)
  const [position, setPosition] = useState({ lineNumber: 1, column: 1 })
  const modelId = useId()
  const modelPath = `canvas-note://${encodeURIComponent(modelId)}/${encodeURIComponent(id)}`

  useEffect(() => () => {
    cursorListener.current?.dispose()
    cursorListener.current = null
    editorRef.current = null
    releaseEditorModels(modelPath)
  }, [modelPath])
  useEffect(() => { configureEditorAppearance(theme, appearance) }, [theme, appearance?.accent, appearance?.background, appearance?.foreground, appearance?.muted, appearance?.border])
  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => ({
    ...editorOptions,
    fontFamily: appearance?.codeFontFamily ?? editorOptions.fontFamily,
    fontSize: appearance?.codeFontSize ?? editorOptions.fontSize,
    lineHeight: appearance ? Math.round(appearance.codeFontSize * 1.75) : editorOptions.lineHeight,
    ariaLabel: 'Note content',
    wordWrap: wrap ? 'on' : 'off',
  }), [appearance?.codeFontFamily, appearance?.codeFontSize, wrap])

  const handleMount: OnMount = (instance) => {
    editorRef.current = instance
    instance.focus()
    cursorListener.current?.dispose()
    setPosition(instance.getPosition() ?? { lineNumber: 1, column: 1 })
    cursorListener.current = instance.onDidChangeCursorPosition((event) => setPosition(event.position))
  }

  const runAction = (action: string) => {
    editorRef.current?.focus()
    void editorRef.current?.getAction(action)?.run()
  }


  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--canvas-surface,#fff)]">
      <div className="editor-toolbar note-editor-toolbar">
        {controls}
        <div className="flex items-center gap-0.5" role="toolbar" aria-label="Editor tools">
          <Button size="sm" title="Find (⌘/Ctrl F)" onClick={() => runAction('actions.find')}>
            <Search size={14} aria-hidden="true" /><span className="hidden sm:inline">Find</span><span className="sr-only sm:hidden">Find</span>
          </Button>
          <Button size="sm" title="Find and replace" onClick={() => runAction('editor.action.startFindReplaceAction')}>
            <Replace size={14} aria-hidden="true" /><span className="hidden sm:inline">Replace</span><span className="sr-only sm:hidden">Replace</span>
          </Button>
          <span className="editor-toolbar-separator" aria-hidden="true" />
          <Button size="sm" title="Toggle word wrap" aria-label="Word wrap" aria-pressed={wrap} onClick={() => setWrap((current) => !current)}>
            <WrapText size={15} aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1" aria-label="Note content">
        <Editor
          key={id}
          path={modelPath}
          value={value}
          language={language}
          theme={appearance ? `canvas-custom-${theme}` : `canvas-${theme}`}
          beforeMount={() => configureEditorAppearance(theme, appearance)}
          onChange={(next) => onChange(next ?? '')}
          onMount={handleMount}
          keepCurrentModel
          saveViewState={false}
          options={options}
          loading={<span className="text-xs text-[var(--canvas-muted,#73786f)]">Loading…</span>}
        />
      </div>
      <div className="editor-statusbar">
        <span>Ln {position.lineNumber}, Col {position.column}</span>
        <span>{value.length.toLocaleString()} characters</span>
      </div>
    </div>
  )
}
