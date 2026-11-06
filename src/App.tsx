import { detectLanguage } from './lib/noteMode';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Check, Columns2, Rows2, CircleHelp, Code2, Copy, FileText, FolderOpen, GitCompareArrows, Maximize2, Menu, MoreHorizontal, Palette, PanelLeftClose, Pin, Plus, Search, Shapes, Trash2, X } from './components/icons';
import BrandMark from './components/BrandMark';
import { Button, Input, WorkspaceSurface } from './components/ui';
import AppearancePanel from './components/AppearancePanel';
import DocumentView from './components/DocumentView';
import SplitPanes, { type SplitDirection } from './components/SplitPanes';
import SidebarRail from './components/SidebarRail';
import InstallApp from './pwa/InstallApp';
import { usePwaInstall } from './pwa/usePwaInstall';
import SidebarDocuments from './components/SidebarDocuments';
import { resolveAppearance } from './lib/themes';
import { useWorkspace } from './lib/useWorkspace';
import { useWorkspaceShortcuts } from './lib/useWorkspaceShortcuts';
import { closeDocument, openDocument, createItem, exportWorkspace, languageFromFilename, modes, mergeImport, parseImport, type Item, type Mode, type Note } from './lib/workspace';
import { downloadFile } from './lib/storage';

const modeDetails = {
  notes: { label: 'Notes', singular: 'note', icon: FileText },
  board: { label: 'Board', singular: 'board', icon: Shapes },
  compare: { label: 'Compare', singular: 'comparison', icon: GitCompareArrows },
  formatter: { label: 'JSON', singular: 'JSON document', icon: Code2 },
};


export default function App() {
  const install = usePwaInstall();
  const { workspace, update, error } = useWorkspace();
  const workspaceRef = useRef(workspace);
  workspaceRef.current = workspace;
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const [split, setSplit] = useState<{ direction: SplitDirection; secondaryId: string } | null>(null);
  const [activePane, setActivePane] = useState<'primary' | 'secondary'>('primary');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const cancelledRename = useRef(false);
  const paneRoot = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const palette = useMemo(() => workspace ? resolveAppearance(workspace.appearance, systemDark) : null, [workspace?.appearance, systemDark]);
  const editorAppearance = useMemo(() => palette && workspace ? { ...palette, codeFontSize: workspace.appearance.codeFontSize } : null, [palette, workspace?.appearance.codeFontSize]);
  const mode = workspace?.mode ?? 'notes';
  const sidebarCollapsed = workspace?.sidebarCollapsed?.[mode] ?? false;
  const primary = workspace?.items.find(item => item.id === workspace.active[mode] && item.kind === mode);
  const secondary = split ? workspace?.items.find(item => item.id === split.secondaryId && item.kind === mode) : undefined;
  const active = activePane === 'secondary' && secondary ? secondary : primary;
  const activeId = active?.id;

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const change = () => setSystemDark(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    if (!palette || !workspace) return;
    const root = document.documentElement;
    const vars = { bg: palette.background, surface: palette.surface, sidebar: palette.sidebar, text: palette.foreground, muted: palette.muted, border: palette.border, accent: palette.accent, font: palette.fontFamily };
    for (const [key, value] of Object.entries(vars)) root.style.setProperty(`--canvas-${key}`, value);
    root.style.fontSize = `${workspace.appearance.uiFontSize}px`;
    root.style.colorScheme = palette.mode;
    root.classList.toggle('dark', palette.mode === 'dark');
    root.classList.toggle('reduce-motion', workspace.appearance.reduceMotion);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palette.background);
  }, [palette?.background, palette?.surface, palette?.sidebar, palette?.foreground, palette?.muted, palette?.border, palette?.accent, palette?.fontFamily, palette?.mode, workspace?.appearance.uiFontSize, workspace?.appearance.reduceMotion]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => { if (confirmDelete) deleteDialog.current?.showModal(); else deleteDialog.current?.close(); }, [confirmDelete]);
  useEffect(() => { if (helpOpen) helpDialog.current?.showModal(); else helpDialog.current?.close(); }, [helpOpen]);

  const selectMode = useCallback((next: Mode) => {
    update(current => {
      if (next === 'formatter' && !current.items.some(item => item.kind === next)) {
        const item = createItem(next);
        return openDocument({ ...current, items: [...current.items, item] }, item);
      }
      return { ...current, mode: next };
    });
    setAppearanceOpen(false); setQuery(''); setMenuOpen(false); setSplit(null); setActivePane('primary'); setSidebarOpen(false); setRenameId(null);
  }, [update]);
  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    update(current => current.sidebarCollapsed?.[current.mode] === collapsed ? current : {
      ...current, sidebarCollapsed: { ...current.sidebarCollapsed, [current.mode]: collapsed },
    });
  }, [update]);
  const addDocument = useCallback((item: Item) => {
    const inSecondary = split && activePane === 'secondary' && item.kind === mode;
    if (!update(current => {
      const next = openDocument({ ...current, items: [...current.items, item] }, item);
      return inSecondary ? { ...next, active: current.active } : next;
    })) return;
    if (inSecondary) setSplit({ ...split, secondaryId: item.id });
    else if (item.kind !== mode) { setSplit(null); setActivePane('primary'); }
    setAppearanceOpen(false); setQuery(''); setSidebarOpen(false); setMenuOpen(false);
  }, [update, split, activePane, mode]);
  const newItem = useCallback((kind: Mode) => addDocument(createItem(kind)), [addDocument]);
  const focusPane = useCallback((pane: 'primary' | 'secondary') => {
    requestAnimationFrame(() => {
      if (document.activeElement?.matches('.sidebar-rename-input')) return;
      const root = paneRoot.current?.querySelector<HTMLElement>(`[data-workspace-pane="${pane}"]`) ?? paneRoot.current;
      root?.querySelector<HTMLElement>('.monaco-editor textarea, .excalidraw, [contenteditable="true"]')?.focus();
    });
  }, []);
  const activateDocument = useCallback((item: Item) => {
    if (split && item.id === secondary?.id) { setActivePane('secondary'); focusPane('secondary'); return; }
    if (split && item.id === primary?.id) { setActivePane('primary'); focusPane('primary'); return; }
    update(current => {
      const next = openDocument(current, item);
      return split && activePane === 'secondary' ? { ...next, active: current.active } : next;
    });
    if (split && activePane === 'secondary') setSplit({ ...split, secondaryId: item.id });
    else if (item.id === primary?.id) focusPane('primary');
  }, [update, split, activePane, primary?.id, secondary?.id, focusPane]);
  const closeTab = useCallback((id: string) => {
    update(current => closeDocument(current, id));
    if (id === primary?.id || id === secondary?.id) { setSplit(null); setActivePane('primary'); }
    setMenuOpen(false);
  }, [update, primary?.id, secondary?.id]);
  const splitWorkspace = useCallback((direction: SplitDirection) => {
    if (split) { setSplit({ ...split, direction }); setAppearanceOpen(false); return; }
    if (!primary) { newItem(mode); return; }
    const item = createItem(mode);
    if (!update(current => ({ ...current, items: [...current.items, item], openTabs: [...(current.openTabs ?? current.items.map(document => document.id)), item.id] }))) return;
    setSplit({ direction, secondaryId: item.id }); setActivePane('secondary'); setAppearanceOpen(false);
  }, [split, primary?.id, mode, newItem, update]);
  const splitDocument = useCallback((item: Item) => {
    if (split && (item.id === primary?.id || item.id === secondary?.id)) {
      const pane = item.id === primary?.id ? 'primary' : 'secondary';
      setActivePane(pane); focusPane(pane);
      setAppearanceOpen(false); setSidebarOpen(false); setMenuOpen(false);
      return;
    }
    if (primary?.id === item.id) {
      splitWorkspace('vertical'); setSidebarOpen(false);
      return;
    }
    const intoPrimary = split && activePane === 'secondary';
    if (!update(current => {
      const next = openDocument(current, item);
      return intoPrimary ? next : { ...next, active: current.active };
    })) return;
    setSplit({ direction: 'vertical', secondaryId: intoPrimary ? split.secondaryId : item.id });
    setActivePane(intoPrimary ? 'primary' : 'secondary');
    setAppearanceOpen(false); setSidebarOpen(false); setMenuOpen(false);
  }, [primary?.id, secondary?.id, split, activePane, splitWorkspace, focusPane, update]);
  const patchItem = useCallback((id: string, patch: Partial<Item>) => {
    update(current => ({ ...current, items: current.items.map(item => item.id === id ? { ...item, ...patch, updatedAt: Date.now() } as Item : item) }));
  }, [update]);
  const beginRename = (item: Item) => {
    cancelledRename.current = false;
    setFocus(false); setSidebarCollapsed(false); setSidebarOpen(true); setQuery(''); setAppearanceOpen(false);
    setRenameId(item.id); setRenameValue(item.name);
  };
  const navigateTabs = (event: ReactKeyboardEvent<HTMLButtonElement>, ids: readonly string[], current: string, prefix: string) => {
    const index = ids.indexOf(current);
    const next = event.key === 'Home' ? ids[0] : event.key === 'End' ? ids.at(-1) : event.key === 'ArrowRight' ? ids[(index + 1) % ids.length] : event.key === 'ArrowLeft' ? ids[(index + ids.length - 1) % ids.length] : undefined;
    if (!next) return;
    // Arrow keys move focus; Enter and Space activate through the button's click.
    event.preventDefault(); document.getElementById(`${prefix}${next}`)?.focus();
  };
  const backup = useCallback(() => {
    const current = workspaceRef.current;
    if (!current) return;
    downloadFile(`canvas-workspace-${new Date().toISOString().slice(0, 10)}.json`, exportWorkspace(current), 'application/json');
    setNotice('Workspace backup downloaded. Keep it somewhere safe.');
  }, []);

  useWorkspaceShortcuts({
    onSearch: () => { setFocus(false); setSidebarCollapsed(false); setSidebarOpen(true); requestAnimationFrame(() => searchInput.current?.focus()); },
    onExport: backup,
    onNew: () => newItem(mode),
    onSplit: splitWorkspace,
    onClose: () => { if (activeId) closeTab(activeId); },
    onFocus: () => setFocus(current => !current),
    onMode: index => selectMode(modes[index]!),
  });

  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setMenuOpen(false); document.getElementById('document-actions-trigger')?.focus(); }
    };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, [menuOpen]);

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      const imported = parseImport(await file.text());
      if (!update(current => mergeImport(current, imported))) return;
      setNotice(`Imported ${imported.items.length} items from your backup. Your existing work is still here.`);
      setAppearanceOpen(false); setSplit(null); setActivePane('primary'); setRenameId(null); setMenuOpen(false);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not import this backup.'); }
  }

  async function importText(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []); event.target.value = '';
    try {
      if (files.some(file => file.size > 5_000_000)) throw new Error('Please choose text files smaller than 5 MB each.');
      const notes = await Promise.all(files.map(async file => ({ ...createItem('notes') as Note, name: file.name.slice(0, 300), content: await file.text(), language: languageFromFilename(file.name) })));
      if (notes.length === 0) return;
      if (!update(current => ({ ...openDocument({ ...current, items: [...current.items, ...notes] }, notes[0]!), openTabs: [...(current.openTabs ?? current.items.map(item => item.id)), ...notes.map(item => item.id)] }))) return;
      setAppearanceOpen(false); setQuery(''); setSplit(null); setActivePane('primary'); setRenameId(null); setMenuOpen(false);
      setNotice(`Opened ${notes.length} ${notes.length === 1 ? 'file' : 'files'} in your workspace.`);
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Could not open these files.'); }
  }

  function downloadActive() {
    if (!active) return;
    if (active.kind === 'notes') {
      const language = active.language === 'auto' ? detectLanguage(active.content) : active.language;
      const extension = ({ markdown: 'md', typescript: 'ts', javascript: 'js', plaintext: 'txt', python: 'py' } as Record<string, string>)[language] ?? language;
      downloadFile(/\.[a-z0-9]+$/i.test(active.name) ? active.name : `${active.name}.${extension}`, active.content);
    } else if (active.kind === 'compare') {
      downloadFile(`${active.name}.json`, JSON.stringify({ original: active.original, modified: active.modified, language: active.language }, null, 2), 'application/json');
    } else if (active.kind === 'formatter') {
      downloadFile(/\.json$/i.test(active.name) ? active.name : `${active.name}.json`, active.content, 'application/json');
    } else {
      downloadFile(`${active.name}.excalidraw`, JSON.stringify({ type: 'excalidraw', version: 2, source: location.origin, ...(active.data ?? { elements: [], appState: { viewBackgroundColor: '#ffffff' }, files: {} }) }), 'application/json');
    }
    setMenuOpen(false);
  }

  if (!workspace || !palette || !editorAppearance) return <div className="boot-screen"><BrandMark size={40}/><h1>Canvas</h1><p>{error ?? 'Opening workspace…'}</p>{error && <Button className="primary-button" onClick={() => location.reload()}>Try again</Button>}</div>;
  const visibleItems = workspace.items.filter(item => item.kind === mode && (item.name.toLowerCase().includes(query.toLowerCase()) || ((item.kind === 'notes' || item.kind === 'formatter') && item.content.toLowerCase().includes(query.toLowerCase()))));
  const ModeIcon = modeDetails[mode].icon;
  const openIds = new Set(workspace.openTabs ?? workspace.items.map(document => document.id));
  const openItems = visibleItems.filter(item => openIds.has(item.id));
  const closedItems = visibleItems.filter(item => !openIds.has(item.id));
  const renderRename = (item: Item) => <div className="sidebar-rename">
      <ModeIcon size={15}/><Input autoFocus className="sidebar-rename-input" aria-label={`Rename ${item.name || 'Untitled'}`} maxLength={300} value={renameValue}
        onFocus={event => event.currentTarget.select()} onChange={event => setRenameValue(event.target.value)}
        onBlur={() => { if (!cancelledRename.current && renameValue.trim() && renameValue.trim() !== item.name) patchItem(item.id, { name: renameValue.trim() }); setRenameId(null); }}
        onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancelledRename.current = true; setRenameId(null); requestAnimationFrame(() => document.getElementById(`sidebar-document-${item.id}`)?.focus()); } if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.blur(); requestAnimationFrame(() => document.getElementById(`sidebar-document-${item.id}`)?.focus()); } }}/>
    </div>;

  return <div className={`app-shell ${focus ? 'is-focused' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
    <a href="#workspace-content" className="skip-link">Skip to workspace</a>
    {sidebarOpen && <Button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}/>}
    <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Workspace navigation">
      <div className="brand-row"><a className="brand" href="#" onClick={event => { event.preventDefault(); selectMode('notes'); }}><BrandMark/><span>canvas<span className="brand-dot">.</span></span></a><Button className="icon-button mobile-only" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={17}/></Button></div>
      <label className="search-field"><Search size={15}/><Input ref={searchInput} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search documents" aria-label="Search workspace"/><kbd>⌘ K</kbd></label>
      <div className="sidebar-section-label"><span>{mode === 'notes' ? 'Notes' : mode === 'board' ? 'Boards' : mode === 'compare' ? 'Comparisons' : 'JSON documents'}</span><Button className="icon-button" aria-label={`New ${modeDetails[mode].singular}`} title={`New ${modeDetails[mode].singular}`} onClick={() => newItem(mode)}><Plus size={15}/></Button></div>
      <SidebarDocuments key={mode} openItems={openItems} closedItems={closedItems} activeId={appearanceOpen ? undefined : activeId} renameId={renameId} query={query}
        enabled={!focus && (!sidebarCollapsed || sidebarOpen)} canSplit={!!primary}
        renderRename={renderRename} onRename={beginRename} onClose={closeTab}
        onOpen={item => { activateDocument(item); setAppearanceOpen(false); setSidebarOpen(false); setMenuOpen(false); }}
        onPin={item => patchItem(item.id, { pinned: !item.pinned })} onSplit={splitDocument}/>
      <div className="sidebar-bottom"><InstallApp install={install}/><Button className={`sidebar-action ${appearanceOpen ? 'selected' : ''}`} onClick={() => { setAppearanceOpen(true); setSidebarOpen(false); }}><Palette size={16}/>Appearance<span className="theme-dots"><i style={{ background: palette.accent }}/></span></Button><div className="sidebar-utilities"><Button className="icon-button" title="Open file" aria-label="Open file" onClick={() => fileInput.current?.click()}><FolderOpen size={16}/></Button><Button className="icon-button" title="Export workspace" aria-label="Export workspace" onClick={backup}><ArrowDownToLine size={16}/></Button><Button className="icon-button" title="Import backup" aria-label="Import backup" onClick={() => backupInput.current?.click()}><ArrowUpFromLine size={16}/></Button><Button className="icon-button" title="Help and shortcuts" aria-label="Help and shortcuts" onClick={() => setHelpOpen(true)}><CircleHelp size={16}/></Button></div></div>
    </aside>
    {sidebarCollapsed && !focus && <SidebarRail installAction={<InstallApp install={install} compact/>} items={modes.map(id => ({ id, ...modeDetails[id] }))} active={mode} appearanceOpen={appearanceOpen}
      onExpand={() => setSidebarCollapsed(false)} onSelect={selectMode} onNew={() => newItem(mode)}
      onSearch={() => { setSidebarCollapsed(false); requestAnimationFrame(() => searchInput.current?.focus()); }}
      onAppearance={() => setAppearanceOpen(true)} onHelp={() => setHelpOpen(true)}/>}
    <main className="main-area" id="workspace-content">
      <header className="topbar"><div className="breadcrumb"><Button className="icon-button mobile-only" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}><Menu size={18}/></Button><Button className="icon-button desktop-only" aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}><PanelLeftClose size={17}/></Button></div><div className="mode-switcher" role="tablist" aria-label="Workspace mode">{(Object.keys(modeDetails) as Mode[]).map(key => { const Icon = modeDetails[key].icon; return <Button key={key} id={`mode-tab-${key}`} role="tab" aria-selected={mode === key} aria-controls="workspace-mode-panel" tabIndex={mode === key ? 0 : -1} onKeyDown={event => navigateTabs(event, modes, key, 'mode-tab-')} className={mode === key && !appearanceOpen ? 'selected' : ''} onClick={() => selectMode(key)}><Icon size={15}/><span>{modeDetails[key].label}</span></Button>; })}</div><div className="topbar-actions">{active && !appearanceOpen && <div className="document-actions"><Button className={`icon-button ${active.pinned ? 'is-pinned' : ''}`} aria-label={active.pinned ? 'Unpin document' : 'Pin document'} title={active.pinned ? 'Unpin document' : 'Pin document'} onClick={() => patchItem(active.id, { pinned: !active.pinned })}><Pin size={15}/></Button><div className="document-menu"><Button id="document-actions-trigger" className="icon-button" aria-label="Document actions" title="Document actions" aria-expanded={menuOpen} aria-controls={menuOpen ? 'document-actions-menu' : undefined} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={19}/></Button>{menuOpen && <><Button className="menu-backdrop" aria-label="Close document actions" onClick={() => setMenuOpen(false)}/><div className="document-dropdown" id="document-actions-menu" aria-label="Document actions"><Button onClick={() => { beginRename(active); setMenuOpen(false); }}><FileText size={15}/>Rename</Button><Button onClick={downloadActive}><ArrowDownToLine size={15}/>Download {modeDetails[mode].singular}</Button><Button onClick={() => { const clone = { ...active, id: crypto.randomUUID(), name: `${active.name} copy`.slice(0, 300), updatedAt: Date.now() }; addDocument(clone); }}><Copy size={15}/>Duplicate</Button>{active.kind === 'notes' && <Button onClick={() => { const item = { ...createItem('compare'), original: active.content, modified: active.content, language: active.language === 'auto' ? detectLanguage(active.content) : active.language, name: `Compare ${active.name}`.slice(0, 300) } as Item; addDocument(item); }}><GitCompareArrows size={15}/>Compare this note</Button>}<Button className="danger" onClick={() => { setConfirmDelete(active); setMenuOpen(false); }}><Trash2 size={15}/>Delete {modeDetails[mode].singular}</Button></div></>}</div></div>}<div className="pane-toolbar"><Button className="icon-button" title="Split right (⌘/Ctrl D)" aria-label="Split right" onClick={() => splitWorkspace('vertical')}><Columns2 size={16}/></Button><Button className="icon-button" title="Split down (⌘/Ctrl Shift D)" aria-label="Split down" onClick={() => splitWorkspace('horizontal')}><Rows2 size={16}/></Button></div><Button className="icon-button" aria-label={focus ? 'Exit focus mode' : 'Focus mode'} title={focus ? 'Exit focus mode' : 'Focus mode'} aria-pressed={focus} onClick={() => setFocus(!focus)}><Maximize2 size={16}/></Button></div></header>
      {error && <div className="error-banner" role="alert"><span>{error}</span><Button onClick={backup}>Export backup</Button><Button onClick={() => location.reload()}>Reload</Button></div>}
      <WorkspaceSurface id="workspace-mode-panel" role="tabpanel" aria-labelledby={`mode-tab-${mode}`}>{appearanceOpen ? <AppearancePanel value={workspace.appearance} onChange={value => update(current => ({ ...current, appearance: value }))} onClose={() => setAppearanceOpen(false)}/> : <>
      <section className={`workspace-panel ${mode === 'board' ? 'board-workspace' : ''}`} aria-label={`${modeDetails[mode].label} workspace`}>

        {primary ? <div ref={paneRoot} className="panel-content" id="workspace-document-panel" role="region" aria-label={active?.name || 'Document'}>{split && secondary ? <SplitPanes direction={split.direction} activePane={activePane} onActivate={setActivePane}
          first={<><div className="pane-header"><span>{primary.name}</span></div><div className="pane-body"><DocumentView key={primary.id} item={primary} appearance={editorAppearance} focus={focus} onFontSizeChange={size => update(current => ({ ...current, appearance: { ...current.appearance, codeFontSize: size } }))} onChange={patchItem}/></div></>}
          second={<><div className="pane-header"><span>{secondary.name}</span><Button className="icon-button" title="Close split pane" aria-label="Close split pane" onClick={() => { setSplit(null); setActivePane('primary'); }}><X size={13}/></Button></div><div className="pane-body"><DocumentView key={secondary.id} item={secondary} appearance={editorAppearance} focus={focus} onFontSizeChange={size => update(current => ({ ...current, appearance: { ...current.appearance, codeFontSize: size } }))} onChange={patchItem}/></div></>}/>
          : <DocumentView key={primary.id} item={primary} appearance={editorAppearance} focus={focus} onFontSizeChange={size => update(current => ({ ...current, appearance: { ...current.appearance, codeFontSize: size } }))} onChange={patchItem}/>}</div>
         : <div className="empty-state"><span className="empty-icon"><ModeIcon size={30}/></span><h2>No open {mode === 'formatter' ? 'JSON documents' : modeDetails[mode].label.toLowerCase()}</h2><Button className="primary-button" onClick={() => newItem(mode)}><Plus size={16}/>New {modeDetails[mode].singular}</Button></div>}
      </section></>}</WorkspaceSurface>
    </main>

    <Input ref={fileInput} type="file" multiple className="hidden" onChange={importText}/><Input ref={backupInput} type="file" accept=".json,application/json" className="hidden" onChange={importBackup}/>
    {notice && <div className="toast" role="status"><Check size={17}/><span>{notice}</span><Button className="icon-button" aria-label="Dismiss notification" onClick={() => setNotice('')}><X size={15}/></Button></div>}
    <dialog ref={deleteDialog} className="canvas-dialog" aria-labelledby="delete-dialog-title" onCancel={() => setConfirmDelete(null)} onClose={() => setConfirmDelete(null)}><div className="dialog-icon"><Trash2 size={21}/></div><h2 id="delete-dialog-title">Delete “{confirmDelete?.name}”?</h2><p>This removes it from this browser. Export a workspace backup first if you may need it again.</p><div className="dialog-actions"><Button className="outline-button" onClick={() => setConfirmDelete(null)}>Keep it</Button><Button className="danger-button" onClick={() => { if (!confirmDelete) return; update(current => ({ ...closeDocument(current, confirmDelete.id), items: current.items.filter(item => item.id !== confirmDelete.id) })); if (confirmDelete.id === primary?.id || confirmDelete.id === secondary?.id) { setSplit(null); setActivePane('primary'); } setConfirmDelete(null); }}>Delete {confirmDelete ? modeDetails[confirmDelete.kind].singular : 'document'}</Button></div></dialog>
    <dialog ref={helpDialog} className="canvas-dialog help-dialog" aria-labelledby="help-dialog-title" onCancel={() => setHelpOpen(false)} onClose={() => setHelpOpen(false)}><Button className="icon-button dialog-close" aria-label="Close help" onClick={() => setHelpOpen(false)}><X size={18}/></Button><h2 id="help-dialog-title">Keyboard shortcuts</h2><p>Canvas keeps your notes, boards, comparisons, JSON documents, and appearance in this browser. Export a backup to move devices or keep a second copy.</p><div className="shortcut-list"><div><span>Find a document</span><kbd>⌘ / Ctrl K</kbd></div><div><span>New document</span><kbd>⌘ / Ctrl N · Alt ⇧ N</kbd></div><div><span>Split right</span><kbd>⌘ / Ctrl D</kbd></div><div><span>Split down</span><kbd>⌘ / Ctrl ⇧ D</kbd></div><div><span>Close document</span><kbd>⌘ / Ctrl W · Alt ⇧ W</kbd></div><div><span>Focus mode</span><kbd>⌘ / Ctrl ⇧ Enter</kbd></div><div><span>Export workspace</span><kbd>⌘ / Ctrl S</kbd></div><div><span>Find in the editor</span><kbd>⌘ / Ctrl F</kbd></div><div><span>Editor command palette</span><kbd>F1</kbd></div></div><p className="help-note">Some browsers reserve new and close shortcuts. Use Alt + Shift + N or W when needed. Closed documents stay in the sidebar until you delete them.</p><p className="help-note">Importing a backup adds to your workspace; it never removes existing documents.</p><div className="dialog-actions"><Button className="primary-button" onClick={() => setHelpOpen(false)}>Got it</Button></div></dialog>
  </div>;
}
