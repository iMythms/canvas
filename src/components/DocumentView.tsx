import { lazy, memo, Suspense, useDeferredValue, useState, type CSSProperties } from 'react';
import { detectLanguage, togglePane } from '../lib/noteMode';
import PanelBoundary from './PanelBoundary';
import MarkdownPreview from './MarkdownPreview';
import { languages, type Item } from '../lib/workspace';
import { Button, Select } from './ui';
import type { ResolvedAppearance } from '../lib/themes';

const NoteEditor = lazy(() => import('./NoteEditor'));
const ComparePanel = lazy(() => import('./ComparePanel'));
const BoardPanel = lazy(() => import('./BoardPanel'));
const FormatterPanel = lazy(() => import('./FormatterPanel'));

type Props = {
  item: Item;
  appearance: ResolvedAppearance & { codeFontSize: number };
  focus: boolean;
  onFontSizeChange: (size: number) => void;
  onChange: (id: string, patch: Partial<Item>) => void;
};

export default memo(function DocumentView({ item, appearance, focus, onFontSizeChange, onChange }: Props) {
  const [panes, setPanes] = useState({ edit: true, read: true });
  const [toolsContainer, setToolsContainer] = useState<HTMLDivElement | null>(null);
  const deferredContent = useDeferredValue(item.kind === 'notes' ? item.content : '');
  const language = item.kind === 'notes' && item.language === 'auto' ? detectLanguage(deferredContent) : item.kind === 'notes' ? item.language : 'plaintext';
  const noteControls = item.kind === 'notes' && <div className="note-controls">
    <Select size="sm" className="note-language" aria-label="Note language" value={item.language} onChange={event => onChange(item.id, { language: event.target.value })}><option value="auto">Auto{item.language === 'auto' ? ` (${languages.find(([value]) => value === language)?.[1] ?? language})` : ''}</option>{languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
    <Select size="sm" aria-label="Editor font size" value={String(appearance.codeFontSize)} onChange={event => onFontSizeChange(Number(event.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 11).map(size => <option key={size} value={size}>{size}px</option>)}</Select>
    {language === 'markdown' && <div className="read-edit-switch" role="group" aria-label="Markdown panes"><Button aria-pressed={panes.edit} disabled={panes.edit && !panes.read} onClick={() => setPanes(current => togglePane(current, 'edit'))}>Edit</Button><Button aria-pressed={panes.read} disabled={panes.read && !panes.edit} onClick={() => setPanes(current => togglePane(current, 'read'))}>Read</Button></div>}
  </div>;
  return <PanelBoundary key={item.id}>
    <Suspense fallback={<div className="panel-loading">Loading…</div>}>
      {item.kind === 'notes' ? <div className="note-preview" style={{ '--markdown-size': `${appearance.codeFontSize}px` } as CSSProperties}>
        <div className="editor-toolbar note-toolbar">{noteControls}<div ref={setToolsContainer} className="note-tools-slot"/></div>
        <div className="markdown-layout">
          {(language !== 'markdown' || panes.edit) && <NoteEditor toolsContainer={toolsContainer} id={item.id} value={item.content} language={language} languageChoice={item.language} theme={appearance.mode} appearance={appearance} onChange={content => onChange(item.id, { content })}/>}
          {language === 'markdown' && panes.read && <div className="reading-scroll"><MarkdownPreview content={item.content} appearance={appearance}/></div>}
        </div>
      </div>        : item.kind === 'compare'
          ? <ComparePanel key={item.id} value={{ original: item.original, modified: item.modified, language: item.language }} theme={appearance.mode} appearance={appearance} onChange={value => onChange(item.id, value)}/>
          : item.kind === 'board' ? <BoardPanel id={item.id} value={item.data} theme={appearance.mode} accent={appearance.accent} focus={focus} onChange={data => onChange(item.id, { data })}/>
          : <FormatterPanel key={item.id} id={item.id} value={item.content} theme={appearance.mode} appearance={appearance} onChange={content => onChange(item.id, { content })}/>
      }
    </Suspense>
  </PanelBoundary>;
});
