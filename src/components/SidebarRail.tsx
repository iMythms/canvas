import type { ReactNode } from 'react';
import { Button } from './ui';
import NoteLanguageIcon from './NoteLanguageIcon';
import { CircleHelp, Code2, FileText, GitCompareArrows, Palette, Plus, Search, Shapes } from './icons';
import BrandMark from './BrandMark';
import type { Item } from '../lib/workspace';
import { groupDocuments } from '../lib/documentPreview';
import '../sidebar-rail.css';

export default function SidebarRail({ installAction, items, activeId, appearanceOpen, onExpand, onSelect, onSearch, onNew, onAppearance, onHelp }: {
  installAction?: ReactNode;
  items: Item[];
  activeId?: string;
  appearanceOpen: boolean;
  onExpand: () => void;
  onSelect: (item: Item) => void;
  onSearch: () => void;
  onNew: () => void;
  onAppearance: () => void;
  onHelp: () => void;
}) {
  const { pinned, regular } = groupDocuments(items);
  const renderDocument = (item: Item) => {
    const Icon = item.kind === 'board' ? Shapes : item.kind === 'compare' ? GitCompareArrows : item.kind === 'formatter' ? Code2 : FileText;
    const label = `Open ${item.name || 'Untitled'}${item.pinned ? ', pinned' : ''}`;
    return <Button key={item.id} size="icon" aria-label={label} title={label} aria-current={activeId === item.id ? 'true' : undefined} aria-pressed={activeId === item.id} onClick={() => onSelect(item)}>{item.kind === 'notes' ? <NoteLanguageIcon note={item} size={19}/> : <Icon size={19}/>}</Button>;
  };
  return <nav className="sidebar-rail" aria-label="Workspace shortcuts">
    <Button size="icon" className="rail-brand" aria-label="Expand sidebar" title="Expand sidebar" onClick={onExpand}><BrandMark/></Button>
    <Button size="icon" aria-label="Search documents" title="Search documents (⌘/Ctrl K)" onClick={onSearch}><Search size={18}/></Button>
    <div className="rail-divider"/>
    <div className="rail-documents" role="group" aria-label="Open documents">
      {!!pinned.length && <div className="rail-document-group" role="group" aria-label="Pinned documents">{pinned.map(renderDocument)}</div>}
      {!!pinned.length && !!regular.length && <div className="rail-divider" role="separator"/>}
      {regular.map(renderDocument)}
    </div>
    <Button size="icon" aria-label="New document" title="New document (⌘/Ctrl N)" onClick={onNew}><Plus size={18}/></Button>
    <div className="rail-bottom">
      {installAction}
      <Button size="icon" aria-label="Appearance" title="Appearance" aria-pressed={appearanceOpen} onClick={onAppearance}><Palette size={19}/></Button>
      <Button size="icon" aria-label="Help and shortcuts" title="Help and shortcuts" onClick={onHelp}><CircleHelp size={19}/></Button>
    </div>
  </nav>;
}
