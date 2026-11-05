import { Button } from './ui';
import { CircleHelp, Palette, Plus, Search, type IconComponent } from './icons';
import BrandMark from './BrandMark';
import type { Mode } from '../lib/workspace';

export default function SidebarRail({ items, active, appearanceOpen, onExpand, onSelect, onSearch, onNew, onAppearance, onHelp }: {
  items: { id: Mode; label: string; icon: IconComponent }[];
  active: Mode;
  appearanceOpen: boolean;
  onExpand: () => void;
  onSelect: (mode: Mode) => void;
  onSearch: () => void;
  onNew: () => void;
  onAppearance: () => void;
  onHelp: () => void;
}) {
  return <nav className="sidebar-rail" aria-label="Workspace shortcuts">
    <Button size="icon" className="rail-brand" aria-label="Expand sidebar" title="Expand sidebar" onClick={onExpand}><BrandMark/></Button>
    <Button size="icon" aria-label="Search documents" title="Search documents (⌘/Ctrl K)" onClick={onSearch}><Search size={18}/></Button>
    <div className="rail-divider"/>
    {items.map(({ id, label, icon: Icon }) => <Button key={id} size="icon" aria-label={label} title={label} aria-pressed={active === id && !appearanceOpen} onClick={() => onSelect(id)}><Icon size={19}/></Button>)}
    <Button size="icon" aria-label="New document" title="New document (⌘/Ctrl N)" onClick={onNew}><Plus size={18}/></Button>
    <div className="rail-bottom">
      <Button size="icon" aria-label="Appearance" title="Appearance" aria-pressed={appearanceOpen} onClick={onAppearance}><Palette size={19}/></Button>
      <Button size="icon" aria-label="Help and shortcuts" title="Help and shortcuts" onClick={onHelp}><CircleHelp size={19}/></Button>
    </div>
  </nav>;
}
