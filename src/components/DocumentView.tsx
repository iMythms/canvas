import { lazy, memo, Suspense } from 'react';
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
  preview: boolean;
  onPreviewChange: (preview: boolean) => void;
  onChange: (id: string, patch: Partial<Item>) => void;
};

export default memo(function DocumentView({ item, appearance, focus, preview, onPreviewChange, onChange }: Props) {
  const noteControls = item.kind === 'notes' && <div className="note-controls">
    <Select size="sm" className="note-language" aria-label="Note language" value={item.language} onChange={event => onChange(item.id, { language: event.target.value })}>{languages.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
    {item.language === 'markdown' && <div className="read-edit-switch" role="group" aria-label="Markdown view"><Button aria-pressed={preview} onClick={() => onPreviewChange(true)}>Read</Button><Button aria-pressed={!preview} onClick={() => onPreviewChange(false)}>Edit</Button></div>}
  </div>;
  return <PanelBoundary key={item.id}>
    <Suspense fallback={<div className="panel-loading">Loading…</div>}>
      {item.kind === 'notes' ? item.language === 'markdown' && preview
        ? <div className="note-preview"><div className="editor-toolbar">{noteControls}</div><div className="reading-scroll"><MarkdownPreview content={item.content}/></div></div>
        : <NoteEditor controls={noteControls} id={item.id} value={item.content} language={item.language} theme={appearance.mode} appearance={appearance} onChange={content => onChange(item.id, { content })}/>
        : item.kind === 'compare'
          ? <ComparePanel key={item.id} value={{ original: item.original, modified: item.modified, language: item.language }} theme={appearance.mode} appearance={appearance} onChange={value => onChange(item.id, value)}/>
          : item.kind === 'board' ? <BoardPanel id={item.id} value={item.data} theme={appearance.mode} accent={appearance.accent} focus={focus} onChange={data => onChange(item.id, { data })}/>
          : <FormatterPanel key={item.id} id={item.id} value={item.content} theme={appearance.mode} appearance={appearance} onChange={content => onChange(item.id, { content })}/>
      }
    </Suspense>
  </PanelBoundary>;
});
