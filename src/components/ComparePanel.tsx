import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { DiffEditor, type DiffOnMount } from '@monaco-editor/react'
import { ArrowLeftRight, Columns2, Rows2 } from './icons'
import { Button, Select } from './ui'
import type { editor, IDisposable } from 'monaco-editor'
import { configureEditorAppearance, editorLanguages, editorOptions, releaseEditorModels, type EditorAppearance } from '../lib/monaco'

interface Comparison {
  original: string
  modified: string
  language: string
}

interface ComparePanelProps {
  value: Comparison
  theme: 'light' | 'dark'
  onChange: (value: Comparison) => void
  appearance?: EditorAppearance
}

export default function ComparePanel({ value, theme, onChange, appearance }: ComparePanelProps) {
  const [sideBySide, setSideBySide] = useState(true)
  const [changes, setChanges] = useState<number | null>(null)
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null)
  const subscriptions = useRef<IDisposable[]>([])
  const applyingChange = useRef(false)
  const latest = useRef({ value, onChange })
  latest.current = { value, onChange }
  // The wrapper receives initial values only. Synchronize the two models together
  // below so a programmatic swap cannot emit a partially updated comparison.
  const initial = useRef(value)
  const modelId = useId()
  const originalModelPath = `canvas-diff://${encodeURIComponent(modelId)}/original`
  const modifiedModelPath = `canvas-diff://${encodeURIComponent(modelId)}/modified`
  useEffect(() => { configureEditorAppearance(theme, appearance) }, [theme, appearance?.accent, appearance?.background, appearance?.foreground, appearance?.muted, appearance?.border])
  const options = useMemo<editor.IStandaloneDiffEditorConstructionOptions>(() => ({
    ...editorOptions,
    fontFamily: appearance?.codeFontFamily ?? editorOptions.fontFamily,
    fontSize: appearance?.codeFontSize ?? editorOptions.fontSize,
    lineHeight: appearance ? Math.round(appearance.codeFontSize * 1.75) : editorOptions.lineHeight,
    renderSideBySide: sideBySide,
    useInlineViewWhenSpaceIsLimited: false,
    originalEditable: true,
    readOnly: false,
    renderOverviewRuler: false,
    renderIndicators: true,
    diffWordWrap: 'on',
    enableSplitViewResizing: true,
    ariaLabel: 'Editable text comparison',
    originalAriaLabel: 'Original text',
    modifiedAriaLabel: 'Modified text',
    ignoreTrimWhitespace: false,
  }), [appearance?.codeFontFamily, appearance?.codeFontSize, sideBySide])

  const synchronizeModels = (instance: editor.IStandaloneDiffEditor, next: Comparison) => {
    const models = instance.getModel()
    if (!models) return
    applyingChange.current = true
    try {
      if (models.original.getValue() !== next.original) models.original.setValue(next.original)
      if (models.modified.getValue() !== next.modified) models.modified.setValue(next.modified)
    } finally {
      applyingChange.current = false
    }
  }

  useEffect(() => {
    if (editorRef.current) synchronizeModels(editorRef.current, value)
  }, [value.original, value.modified])

  useEffect(() => () => {
    subscriptions.current.forEach((subscription) => subscription.dispose())
    subscriptions.current = []
    editorRef.current = null
    releaseEditorModels(originalModelPath, modifiedModelPath)
  }, [originalModelPath, modifiedModelPath])

  const handleMount: DiffOnMount = (instance) => {
    editorRef.current = instance
    instance.getModifiedEditor().focus()
    subscriptions.current.forEach((subscription) => subscription.dispose())
    synchronizeModels(instance, latest.current.value)
    const emitChange = () => {
      if (applyingChange.current) return
      const models = instance.getModel()
      if (!models) return
      const next = {
        original: models.original.getValue(),
        modified: models.modified.getValue(),
        language: latest.current.value.language,
      }
      latest.current = { ...latest.current, value: next }
      latest.current.onChange(next)
    }
    subscriptions.current = [
      instance.getOriginalEditor().onDidChangeModelContent(emitChange),
      instance.getModifiedEditor().onDidChangeModelContent(emitChange),
      instance.onDidUpdateDiff(() => setChanges(instance.getLineChanges()?.length ?? null)),
    ]
  }

  const updateValue = (next: Comparison) => {
    latest.current = { ...latest.current, value: next }
    if (editorRef.current) synchronizeModels(editorRef.current, next)
    onChange(next)
  }


  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--canvas-surface,#fff)]">
      <div className="editor-toolbar">
        <label className="flex items-center gap-2 text-xs text-[var(--canvas-muted,#73786f)]">
          <span className="sr-only">Language</span>
          <Select size="sm" aria-label="Comparison language" value={value.language} onChange={(event) => updateValue({ ...latest.current.value, language: event.target.value })} className="comparison-language">
            {editorLanguages.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </Select>
        </label>
        <div className="flex items-center gap-1" role="toolbar" aria-label="Comparison tools">
          <div className="ui-segmented">
            <Button size="sm" aria-label="Split comparison" aria-pressed={sideBySide} onClick={() => setSideBySide(true)}>
              <Columns2 size={14} aria-hidden="true" /><span className="hidden sm:inline">Split</span>
            </Button>
            <Button size="sm" aria-label="Unified comparison" aria-pressed={!sideBySide} onClick={() => setSideBySide(false)}>
              <Rows2 size={14} aria-hidden="true" /><span className="hidden sm:inline">Unified</span>
            </Button>
          </div>
          <Button size="sm" aria-label="Swap original and modified" title="Swap original and modified" onClick={() => {
            const current = latest.current.value
            updateValue({ ...current, original: current.modified, modified: current.original })
          }}>
            <ArrowLeftRight size={14} aria-hidden="true" /><span className="hidden md:inline">Swap</span>
          </Button>
        </div>
      </div>
      <div className="grid h-6 shrink-0 grid-cols-2 border-b border-[var(--canvas-border,#e5e7e1)] bg-[var(--canvas-surface,#fafbf8)] text-[10px] font-medium text-[var(--canvas-muted,#93998d)]">
        <span className="flex items-center gap-2 px-3"><span className="size-1.5 rounded-full bg-[#d7a89b]" />Original</span>
        <span className={`flex items-center gap-2 px-3 ${sideBySide ? 'border-l border-[var(--canvas-border,#e5e7e1)] ' : 'justify-end'}`}><span className="size-1.5 rounded-full bg-[#97b287]" />Modified</span>
      </div>
      <div className="relative min-h-0 flex-1">
        <DiffEditor
          original={initial.current.original}
          modified={initial.current.modified}
          originalModelPath={originalModelPath}
          modifiedModelPath={modifiedModelPath}
          language={value.language}
          theme={appearance ? `canvas-custom-${theme}` : `canvas-${theme}`}
          beforeMount={() => configureEditorAppearance(theme, appearance)}
          onMount={handleMount}
          keepCurrentOriginalModel
          keepCurrentModifiedModel
          options={options}
          loading={<span className="text-xs text-[var(--canvas-muted,#73786f)]">Loading…</span>}
        />
      </div>
      <div className="editor-statusbar">
        <span aria-live="polite">{changes === null ? 'Comparing…' : changes === 0 ? 'No differences' : `${changes} ${changes === 1 ? 'change' : 'changes'}`}</span>
      </div>
    </div>
  )
}
