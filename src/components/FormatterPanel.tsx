import { useEffect, useId, useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { ArrowDownToLine, Check, Code2, Copy, Minimize2 } from './icons'
import { Button, Select } from './ui'
import { configureEditorAppearance, editorOptions, releaseEditorModels, type EditorAppearance } from '../lib/monaco'
import { formatJson, JsonFormatError, minifyJson, type JsonIndentation } from '../lib/jsonFormatter'
import { downloadFile } from '../lib/storage'
import '../formatter.css'

interface FormatterPanelProps {
  id: string
  value: string
  theme: 'light' | 'dark'
  appearance?: EditorAppearance
  onChange: (value: string) => void
}

export default function FormatterPanel({ id, value, theme, appearance, onChange }: FormatterPanelProps) {
  const [mode, setMode] = useState<'format' | 'minify'>('format')
  const [indentation, setIndentation] = useState<JsonIndentation>(2)
  const [feedback, setFeedback] = useState<{ output: string; message: string } | null>(null)
  const modelId = useId()
  const sourcePath = `canvas-json://${encodeURIComponent(modelId)}/${encodeURIComponent(id)}/source`
  const outputPath = `canvas-json://${encodeURIComponent(modelId)}/${encodeURIComponent(id)}/output`
  const result = useMemo(() => {
    if (/^[\x20\t\r\n]*$/.test(value)) return { output: '', error: null }
    try {
      return { output: mode === 'format' ? formatJson(value, indentation) : minifyJson(value), error: null }
    } catch (error) {
      return { output: '', error: error instanceof JsonFormatError ? error : new JsonFormatError(value, error) }
    }
  }, [value, mode, indentation])
  const { output, error } = result
  const currentFeedback = feedback?.output === output ? feedback.message : null

  useEffect(() => () => releaseEditorModels(sourcePath, outputPath), [sourcePath, outputPath])
  useEffect(() => { configureEditorAppearance(theme, appearance) }, [theme, appearance?.accent, appearance?.background, appearance?.foreground, appearance?.muted, appearance?.border])
  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(null), 2500)
    return () => window.clearTimeout(timer)
  }, [feedback])

  const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => ({
    ...editorOptions,
    fontFamily: appearance?.codeFontFamily ?? '"Geist Mono Variable", monospace',
    fontSize: appearance?.codeFontSize ?? editorOptions.fontSize,
    lineHeight: appearance ? Math.round(appearance.codeFontSize * 1.75) : editorOptions.lineHeight,
    tabSize: indentation === 4 ? 4 : 2,
    insertSpaces: indentation !== 'tabs',
    detectIndentation: false,
    ariaLabel: 'JSON source',
  }), [appearance?.codeFontFamily, appearance?.codeFontSize, indentation])
  const outputOptions = useMemo<editor.IStandaloneEditorConstructionOptions>(() => ({
    ...options, readOnly: true, domReadOnly: true, ariaLabel: 'JSON output',
  }), [options])
  const editorTheme = appearance ? `canvas-custom-${theme}` : `canvas-${theme}`
  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setFeedback({ output, message: 'Copied output' })
    } catch {
      setFeedback({ output, message: 'Could not copy. Select and copy the output.' })
    }
  }
  const downloadOutput = () => {
    downloadFile(mode === 'format' ? 'formatted.json' : 'minified.json', output, 'application/json;charset=utf-8')
  }

  return (
    <div className="formatter-panel">
      <div className="editor-toolbar formatter-toolbar" role="toolbar" aria-label="JSON formatter tools">
        <div className="formatter-actions">
          <div className="ui-segmented" role="group" aria-label="Output format">
            <Button size="sm" aria-pressed={mode === 'format'} onClick={() => setMode('format')}><Code2 size={14} />Format</Button>
            <Button size="sm" aria-pressed={mode === 'minify'} onClick={() => setMode('minify')}><Minimize2 size={14} />Minify</Button>
          </div>
          <Select size="sm" aria-label="JSON indentation" value={String(indentation)} onChange={event => setIndentation(event.target.value === 'tabs' ? 'tabs' : event.target.value === '4' ? 4 : 2)}>
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tabs">Tabs</option>
          </Select>
        </div>
        <div className="formatter-actions">
          <Button size="sm" title="Copy output" aria-label="Copy JSON output" disabled={!output} onClick={() => void copyOutput()}>
            {currentFeedback === 'Copied output' ? <Check size={14} /> : <Copy size={14} />}<span className="formatter-action-label">Copy</span>
          </Button>
          <Button size="sm" title="Download output" aria-label="Download JSON output" disabled={!output} onClick={downloadOutput}><ArrowDownToLine size={14} /><span className="formatter-action-label">Download</span></Button>
        </div>
      </div>
      <div className="formatter-panes">
        <section className="formatter-pane" aria-label="JSON source pane">
          <div className="formatter-pane-header"><span>Source</span><span>JSON</span></div>
          <div className="formatter-editor">
            <Editor key={sourcePath} path={sourcePath} value={value} language="json" theme={editorTheme} beforeMount={() => configureEditorAppearance(theme, appearance)} onChange={next => onChange(next ?? '')} keepCurrentModel saveViewState={false} options={options} loading={<span className="formatter-loading">Loading…</span>} />
          </div>
        </section>
        <section className="formatter-pane" aria-label="JSON output pane">
          <div className="formatter-pane-header"><span>Output</span><span>{mode === 'format' ? 'Formatted' : 'Minified'}</span></div>
          <div className="formatter-editor">
            <Editor key={outputPath} path={outputPath} value={output} language="json" theme={editorTheme} beforeMount={() => configureEditorAppearance(theme, appearance)} keepCurrentModel saveViewState={false} options={outputOptions} loading={<span className="formatter-loading">Loading…</span>} />
          </div>
        </section>
      </div>
      <div className={`editor-statusbar formatter-status${error ? ' formatter-status--error' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        <span>{error ? `Invalid JSON${error.line !== undefined ? ` at line ${error.line}, column ${error.column}` : ''}: ${error.message}` : currentFeedback ?? (output ? 'Valid JSON' : 'Enter JSON to format')}</span>
        {!error && output && <span className="formatter-output-size">{output.length.toLocaleString()} characters</span>}
      </div>
    </div>
  )
}
