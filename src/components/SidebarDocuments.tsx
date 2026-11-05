import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Code2, Columns2, FileText, GitCompareArrows, Pin, Shapes, X } from './icons';
import { Button } from './ui';
import { languages, type Item } from '../lib/workspace';
import { documentSummary, groupDocuments } from '../lib/documentPreview';
import '../sidebar-documents.css';

const details = {
  notes: { label: 'Note', icon: FileText }, board: { label: 'Board', icon: Shapes },
  compare: { label: 'Comparison', icon: GitCompareArrows }, formatter: { label: 'JSON', icon: Code2 },
};

function DocumentContent({ item }: { item: Item }) {
  if (item.kind === 'board') {
    const elements = (item.data?.elements ?? []).filter(element => !element.isDeleted).slice(0, 80);
    if (!elements.length) return <span className="document-preview-empty"><Shapes size={24}/></span>;
    const left = Math.min(...elements.map(element => element.x));
    const top = Math.min(...elements.map(element => element.y));
    const width = Math.max(1, Math.max(...elements.map(element => element.x + element.width)) - left);
    const height = Math.max(1, Math.max(...elements.map(element => element.y + element.height)) - top);
    const padding = Math.max(width, height) * .06;
    return <svg className="document-preview-board" viewBox={`${left - padding} ${top - padding} ${width + padding * 2} ${height + padding * 2}`} aria-label="Drawing preview" role="img">
      {elements.map(element => {
        const { x, y, width: w, height: h } = element;
        const angle = Number.isFinite(element.angle) ? element.angle : 0;
        const transform = `rotate(${angle * 180 / Math.PI} ${x + w / 2} ${y + h / 2})`;
        if (element.type === 'text') {
          const fontSize = Number.isFinite(element.fontSize) ? element.fontSize : 12;
          return <text key={element.id} x={x} y={y + fontSize} fontSize={fontSize} fill="currentColor" stroke="none" transform={transform}>{typeof element.text === 'string' ? element.text.slice(0, 80) : ''}</text>;
        }
        if (element.type === 'freedraw' || element.type === 'line' || element.type === 'arrow') {
          const points = Array.isArray(element.points) ? element.points.filter(point => Array.isArray(point) && Number.isFinite(point[0]) && Number.isFinite(point[1])) : [];
          return <polyline key={element.id} points={points.map(point => `${x + point[0]},${y + point[1]}`).join(' ')} transform={transform}/>;
        }
        if (element.type === 'ellipse') return <ellipse key={element.id} cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} transform={transform}/>;
        if (element.type === 'diamond') return <polygon key={element.id} points={`${x + w / 2},${y} ${x + w},${y + h / 2} ${x + w / 2},${y + h} ${x},${y + h / 2}`} transform={transform}/>;
        return <rect key={element.id} x={x} y={y} width={w} height={h} rx={element.type === 'rectangle' ? 4 : 0} transform={transform}/>;
      })}
    </svg>;
  }
  if (item.kind === 'compare') return <div className="document-preview-comparison"><div><span>Original</span><pre>{item.original.slice(0, 500) || '—'}</pre></div><div><span>Modified</span><pre>{item.modified.slice(0, 500) || '—'}</pre></div></div>;
  return item.content.trim() ? <pre className="document-preview-text">{item.content.slice(0, 900)}</pre> : <span className="document-preview-empty">{item.kind === 'formatter' ? <Code2 size={24}/> : <FileText size={24}/>}</span>;
}

type Props = {
  openItems: Item[];
  closedItems: Item[];
  activeId?: string;
  renameId: string | null;
  query: string;
  enabled: boolean;
  canSplit: boolean;
  renderRename: (item: Item) => ReactNode;
  onOpen: (item: Item) => void;
  onRename: (item: Item) => void;
  onClose: (id: string) => void;
  onPin: (item: Item) => void;
  onSplit: (item: Item) => void;
};

export default function SidebarDocuments({ openItems, closedItems, activeId, renameId, query, enabled, canSplit, renderRename, onOpen, onRename, onClose, onPin, onSplit }: Props) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const focusCard = useRef(false);
  const interaction = useRef<'pointer' | 'keyboard'>('pointer');
  const item = [...openItems, ...closedItems].find(document => document.id === previewId);
  const previewIdRef = useRef(previewId);
  previewIdRef.current = previewId;
  const cancelTimer = useCallback(() => clearTimeout(timer.current), []);
  const dismiss = useCallback(() => { cancelTimer(); focusCard.current = false; setPreviewId(null); }, [cancelTimer]);
  const leave = () => {
    cancelTimer();
    timer.current = setTimeout(() => {
      // Pointer clicks focus action buttons too; only keyboard focus keeps a card open.
      if (interaction.current === 'keyboard' && (card.current?.contains(document.activeElement) || anchor.current?.contains(document.activeElement))) return;
      dismiss();
    }, 180);
  };
  const show = (document: Item, target: HTMLElement, intent: 'pointer' | 'keyboard', focusActions = false) => {
    if (!enabled) return;
    cancelTimer(); anchor.current = target; interaction.current = intent; focusCard.current = focusActions;
    if (focusActions || previewIdRef.current === document.id) setPreviewId(document.id);
    else timer.current = setTimeout(() => setPreviewId(document.id), 280);
  };

  useEffect(() => cancelTimer, [cancelTimer]);
  useEffect(() => { if (renameId) dismiss(); }, [renameId, dismiss]);
  useEffect(() => { if (!enabled) dismiss(); }, [enabled, dismiss]);
  useEffect(() => { dismiss(); }, [query, dismiss]);
  useLayoutEffect(() => {
    if (!item || !card.current || !anchor.current) return;
    const place = () => {
      // Pinning can move the row between groups while its preview remains open.
      const currentRow = document.getElementById(`sidebar-document-${item.id}`)?.parentElement;
      if (currentRow) anchor.current = currentRow;
      const row = anchor.current?.getBoundingClientRect();
      const panel = card.current;
      const sidebar = root.current?.closest('aside')?.getBoundingClientRect();
      if (!row || !panel || !sidebar) return;
      const left = Math.max(8, Math.min(sidebar.right + 8, window.innerWidth - panel.offsetWidth - 8));
      const top = Math.max(8, Math.min(row.top, window.innerHeight - panel.offsetHeight - 8));
      setPosition({ left, top });
    };
    place();
    if (focusCard.current) { card.current.querySelector<HTMLButtonElement>('button')?.focus(); focusCard.current = false; }
    window.addEventListener('resize', place);
    // Scrolling away from the anchor should never leave a detached card behind.
    const scroll = (event: Event) => { if (!card.current?.contains(event.target as Node)) dismiss(); };
    window.addEventListener('scroll', scroll, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', scroll, true); };
  }, [item?.id, item?.pinned, dismiss]);
  useEffect(() => {
    if (!item) return;
    const outside = (event: PointerEvent) => { if (!card.current?.contains(event.target as Node) && !anchor.current?.contains(event.target as Node)) dismiss(); };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (card.current?.contains(document.activeElement)) anchor.current?.querySelector<HTMLButtonElement>('.item-link')?.focus();
      event.preventDefault(); dismiss();
    };
    window.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('pointerdown', outside); window.removeEventListener('keydown', keydown); };
  }, [item?.id, dismiss]);

  const renderDocument = (document: Item, closed = false) => {
    const Icon = document.kind === 'notes' && !['markdown', 'plaintext'].includes(document.language) ? Code2 : details[document.kind].icon;
    const expanded = previewId === document.id;
    return <div key={document.id} className={`sidebar-document ${document.id === activeId ? 'selected' : ''} ${expanded && enabled ? 'previewed' : ''}`}
      onMouseEnter={event => { if (renameId !== document.id) show(document, event.currentTarget, 'pointer'); }} onMouseLeave={leave}
      onPointerDownCapture={() => { interaction.current = 'pointer'; }}
      onKeyDownCapture={() => { interaction.current = 'keyboard'; }}
      onFocus={event => { if (renameId !== document.id && !event.currentTarget.contains(event.relatedTarget)) show(document, event.currentTarget, event.target.matches(':focus-visible') ? 'keyboard' : 'pointer'); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && !card.current?.contains(event.relatedTarget)) leave(); }}>
      {renameId === document.id ? renderRename(document) : <Button id={`sidebar-document-${document.id}`} className="item-link" aria-current={document.id === activeId ? 'true' : undefined}
        aria-label={`${closed ? 'Reopen' : 'Open'} ${document.name || 'Untitled'}${document.pinned ? ', pinned' : ''}`} aria-description="Press F2 to rename. Press Arrow right for preview actions."
        aria-haspopup="dialog" aria-expanded={expanded} aria-controls={expanded ? 'sidebar-document-preview' : undefined}
        onClick={() => { dismiss(); onOpen(document); }} onDoubleClick={() => { dismiss(); onRename(document); }}
        onKeyDown={event => {
          if (event.key === 'F2') { event.preventDefault(); dismiss(); onRename(document); }
          if (event.key === 'ArrowRight') { event.preventDefault(); show(document, event.currentTarget.parentElement!, 'keyboard', true); if (expanded) { card.current?.querySelector<HTMLButtonElement>('button')?.focus(); focusCard.current = false; } }
        }}>
        <span className={`item-type-icon ${Icon === Code2 ? 'code' : ''}`}><Icon size={15}/></span><span className="item-link-title">{document.name || 'Untitled'}</span>
      </Button>}
      {!closed && <Button className="sidebar-document-close" aria-label={`Close ${document.name || 'Untitled'}`} title="Close document" onClick={() => { dismiss(); onClose(document.id); }}><X size={12}/></Button>}
    </div>;
  };
  const renderGroup = (documents: Item[], closed = false) => {
    const { pinned, regular } = groupDocuments(documents);
    return <>{pinned.length > 0 && <div role="group" aria-label="Pinned documents">{pinned.map(document => renderDocument(document, closed))}</div>}{pinned.length > 0 && regular.length > 0 && <div className="sidebar-document-divider" role="separator"/>}{regular.map(document => renderDocument(document, closed))}</>;
  };
  const Icon = item ? details[item.kind].icon : FileText;
  const language = item && 'language' in item ? languages.find(([value]) => value === item.language)?.[1] ?? item.language : '';
  const closed = item ? closedItems.some(document => document.id === item.id) : false;
  return <div ref={root} className="item-list" aria-label="Documents">
    {renderGroup(openItems)}
    {!openItems.length && <p className="sidebar-empty">{query ? 'No open matches' : 'No open documents'}</p>}
    {!!closedItems.length && <details className="closed-documents" open={query ? true : undefined}><summary><ChevronRight size={13}/><span>Closed</span><span className="closed-document-count">{closedItems.length}</span></summary><div>{renderGroup(closedItems, true)}</div></details>}
    {item && enabled && createPortal(<div ref={card} id="sidebar-document-preview" role="dialog" aria-label={`${item.name || 'Untitled'} preview`} className="document-preview" style={position}
      onMouseEnter={() => { interaction.current = 'pointer'; cancelTimer(); }} onMouseLeave={leave}
      onPointerDownCapture={() => { interaction.current = 'pointer'; }}
      onKeyDownCapture={() => { interaction.current = 'keyboard'; }}
      onFocus={event => { if (event.target.matches(':focus-visible')) interaction.current = 'keyboard'; cancelTimer(); }}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget) && !anchor.current?.contains(event.relatedTarget)) leave(); }}>
      <div className="document-preview-heading"><Icon size={16}/><div><strong>{item.name || 'Untitled'}</strong><span>{details[item.kind].label}{language ? ` · ${language}` : ''}</span></div></div>
      <div className="document-preview-content"><DocumentContent item={item}/></div>
      <p className="document-preview-summary">{documentSummary(item)}</p>
      <div className="document-preview-actions"><Button size="sm" aria-label={item.pinned ? 'Unpin document' : 'Pin document'} aria-pressed={item.pinned} onClick={() => onPin(item)}><Pin size={14}/>{item.pinned ? 'Unpin' : 'Pin'}</Button>{canSplit && <Button size="sm" aria-label="Open in other pane" onClick={() => { dismiss(); onSplit(item); }}><Columns2 size={14}/>Split</Button>}<Button size="sm" variant="outline" onClick={() => { dismiss(); onOpen(item); }}>{closed ? 'Reopen' : 'Open'}</Button></div>
    </div>, document.body)}
  </div>;
}
