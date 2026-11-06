import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Editor, { type OnMount } from '@monaco-editor/react'
import { Replace, Search, WrapText, Sparkles } from './icons'
import { Button } from './ui'
import type { editor } from 'monaco-editor'
import { Selection } from 'monaco-editor/editor/editor.api.js'
import { NoteFormatterClient } from '../lib/noteFormatterClient'
import { isCurrentFormat } from '../lib/noteFormatter'
import { configureEditorAppearance, editorOptions, releaseEditorModels, type EditorAppearance } from '../lib/monaco'

interface NoteEditorProps {
  id: string
  value: string
  language: string
  languageChoice: string
  theme: 'light' | 'dark'
  onChange: (value: string) => void
  toolsContainer: HTMLDivElement | null
  appearance?: EditorAppearance
}

export default function NoteEditor({ id, value, language, languageChoice, theme, onChange, appearance, toolsContainer }: NoteEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const choiceRef = useRef(languageChoice)
  const clientRef = useRef<NoteFormatterClient | null>(null)
  const actionRef = useRef<{ dispose: () => void } | null>(null)
  const requestRef = useRef(0)
  if (choiceRef.current !== languageChoice) { choiceRef.current = languageChoice; requestRef.current++ }
  const [status, setStatus] = useState('')
  const cursorListener = useRef<{ dispose: () => void } | null>(null)
  const [wrap, setWrap] = useState(true)
  const [position, setPosition] = useState({ lineNumber: 1, column: 1 })
  const modelId = useId()
  const modelPath = `canvas-note://${encodeURIComponent(modelId)}/${encodeURIComponent(id)}`

  useEffect(() => () => {
    requestRef.current++
    actionRef.current?.dispose()
    clientRef.current?.dispose()
    clientRef.current = null
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

  const format = async () => {
    const instance = editorRef.current
    const model = instance?.getModel()
    if (!instance || !model) return
    const text = model.getValue()
    const snapshot = { model, version: model.getVersionId(), choice: choiceRef.current }
    const selections = instance.getSelections()?.map(selection => ({
      start: model.getOffsetAt(selection.getSelectionStart()), end: model.getOffsetAt(selection.getPosition()),
    })) ?? []
    const scrollTop = instance.getScrollTop(), scrollLeft = instance.getScrollLeft()
    const request = ++requestRef.current
    setStatus('Formatting…')
    try {
      clientRef.current ??= new NoteFormatterClient()
      const result = await clientRef.current.format(text, snapshot.choice, selections.flatMap(({ start, end }) => [start, end]))
      if (request !== requestRef.current || !editorRef.current) return
      if (!isCurrentFormat(snapshot, { model: instance.getModel(), version: model.getVersionId(), choice: choiceRef.current })) { setStatus('Formatting cancelled because the note changed.'); return }
      if (result.kind === 'error' || result.kind === 'unsupported') { setStatus(result.message); return }
      if (result.kind === 'unchanged') { setStatus('Already formatted.'); return }
      instance.pushUndoStop()
      instance.executeEdits('canvas.format', [{ range: model.getFullModelRange(), text: result.text, forceMoveMarkers: true }], () => selections.length ? selections.map((_, index) => {
        const anchor = model.getPositionAt(result.offsets[index * 2])
        const active = model.getPositionAt(result.offsets[index * 2 + 1])
        return new Selection(anchor.lineNumber, anchor.column, active.lineNumber, active.column)
      }) : null)
      instance.pushUndoStop()
      instance.setScrollPosition({ scrollTop, scrollLeft })
      setStatus('Formatted.')
    } catch { if (request === requestRef.current && editorRef.current) setStatus('Formatter could not start.') }
  }
  const formatRef = useRef(format)
  formatRef.current = format

  const handleMount: OnMount = (instance, monaco) => {
    editorRef.current = instance
    actionRef.current?.dispose()
    actionRef.current = instance.addAction({ id: 'canvas.formatNote', label: 'Format note', keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF], run: () => { void formatRef.current() } })
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
      {toolsContainer && createPortal(
        <div className="flex items-center gap-0.5" role="toolbar" aria-label="Editor tools">
          <Button size="sm" title="Find (⌘/Ctrl F)" onClick={() => runAction('actions.find')}>
            <Search size={14} aria-hidden="true" /><span className="hidden sm:inline">Find</span><span className="sr-only sm:hidden">Find</span>
          </Button>
          <Button size="sm" title="Find and replace" onClick={() => runAction('editor.action.startFindReplaceAction')}>
            <Replace size={14} aria-hidden="true" /><span className="hidden sm:inline">Replace</span><span className="sr-only sm:hidden">Replace</span>
          </Button>
          <Button size="sm" title="Format (Shift Alt F)" onClick={() => { void format() }}><Sparkles size={14} aria-hidden="true"/><span>Format</span></Button>
          <span className="editor-toolbar-separator" aria-hidden="true" />
          <Button size="sm" className="note-icon-control" title="Toggle word wrap" aria-label="Word wrap" aria-pressed={wrap} onClick={() => setWrap((current) => !current)}>
            <WrapText size={15} aria-hidden="true" />
          </Button>
        </div>
      , toolsContainer)}
      <div className="min-h-0 flex-1" aria-label="Note content">
        <Editor
          key={id}
          path={modelPath}
          value={value}
          language={language}
          theme={appearance ? `canvas-custom-${theme}` : `canvas-${theme}`}
          beforeMount={() => configureEditorAppearance(theme, appearance)}
          onChange={(next) => { setStatus(''); onChange(next ?? '') }}
          onMount={handleMount}
          keepCurrentModel
          saveViewState={false}
          options={options}
          loading={<span className="text-xs text-[var(--canvas-muted,#73786f)]">Loading…</span>}
        />
      </div>
      <div className="editor-statusbar">
        <span role="status">{status}</span>
        <span>Ln {position.lineNumber}, Col {position.column}</span>
        <span>{value.length.toLocaleString()} characters</span>
      </div>
    </div>
  )
}
