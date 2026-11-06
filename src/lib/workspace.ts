import { defaultAppearance, normalizeAppearance, type Appearance } from './themes.ts';
import type { BoardData } from '../components/BoardPanel';

export const modes = ['notes', 'board', 'compare', 'formatter'] as const;
export type Mode = typeof modes[number];
type ItemBase = { id: string; name: string; updatedAt: number; pinned: boolean };
export type Note = ItemBase & { kind: 'notes'; content: string; language: string };
export type Board = ItemBase & { kind: 'board'; data: BoardData | null };
export type Comparison = ItemBase & { kind: 'compare'; original: string; modified: string; language: string };
export type Formatter = ItemBase & { kind: 'formatter'; content: string };
export type Item = Note | Board | Comparison | Formatter;
export type Workspace = {
  version: 1;
  items: Item[];
  active: Record<Mode, string | null>;
  mode: Mode;
  appearance: Appearance;
  openTabs?: string[];
  sidebarCollapsed?: Partial<Record<Mode, boolean>>;
};

export const languages = [
  ['plaintext', 'Plain text'], ['markdown', 'Markdown'], ['typescript', 'TypeScript'],
  ['javascript', 'JavaScript'], ['json', 'JSON'], ['html', 'HTML'], ['css', 'CSS'],
  ['python', 'Python'], ['sql', 'SQL'], ['yaml', 'YAML'], ['shell', 'Shell'],
  ['java', 'Java'], ['cpp', 'C++'], ['go', 'Go'], ['rust', 'Rust'],
] as const;

export function createItem(kind: Mode): Item {
  const base = { id: crypto.randomUUID(), name: ({ notes: 'Untitled note', board: 'Untitled board', compare: 'Untitled comparison', formatter: 'Untitled JSON' })[kind], updatedAt: Date.now(), pinned: false };
  if (kind === 'notes') return { ...base, kind, content: '', language: 'auto' };
  if (kind === 'board') return { ...base, kind, data: null };
  if (kind === 'formatter') return { ...base, kind, content: '' };
  return { ...base, kind, original: '', modified: '', language: 'plaintext' };
}

export function initialWorkspace(): Workspace {
  const note = createItem('notes') as Note;
  const board = createItem('board') as Board;
  const comparison = createItem('compare') as Comparison;
  return { version: 1, items: [note, board, comparison], openTabs: [note.id, board.id, comparison.id], active: { notes: note.id, board: board.id, compare: comparison.id, formatter: null }, mode: 'notes', appearance: { ...defaultAppearance } };
}

const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const text = (v: unknown, max = Infinity): v is string => typeof v === 'string' && v.length <= max;
const validMode = (v: unknown): v is Mode => modes.includes(v as Mode);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function validBoard(value: unknown): boolean {
  if (value === null) return true;
  if (!object(value) || !Array.isArray(value.elements) || !object(value.appState) || !object(value.files)) return false;
  const state = value.appState;
  if (!text(state.viewBackgroundColor, 100) || !finite(state.scrollX) || !finite(state.scrollY) || !object(state.zoom) || !finite(state.zoom.value) || state.zoom.value <= 0) return false;
  const ids = new Set<string>();
  const types = new Set(['rectangle', 'diamond', 'ellipse', 'text', 'line', 'arrow', 'freedraw', 'image', 'frame', 'magicframe', 'embeddable', 'iframe', 'selection']);
  for (const el of value.elements) {
    if (!object(el) || !text(el.id, 200) || ids.has(el.id) || !types.has(el.type as string) || !finite(el.x) || !finite(el.y) || !finite(el.width) || !finite(el.height) || !finite(el.version)) return false;
    ids.add(el.id);
  }
  for (const [id, file] of Object.entries(value.files)) {
    if (!object(file) || file.id !== id || !text(file.mimeType, 100) || !text(file.dataURL) || !file.dataURL.startsWith('data:image/') || !finite(file.created)) return false;
  }
  return true;
}

export function parseItem(value: unknown): Item {
  if (!object(value) || !text(value.id, 200) || !value.id || !text(value.name, 300) || !finite(value.updatedAt) || typeof value.pinned !== 'boolean' || !validMode(value.kind)) throw new Error('The backup contains an invalid item. Nothing was imported.');
  const base: ItemBase = { id: value.id, name: value.name, updatedAt: value.updatedAt, pinned: value.pinned };
  if (value.kind === 'board') {
    if (!validBoard(value.data)) throw new Error('The backup contains an invalid board. Nothing was imported.');
    return { ...base, kind: 'board', data: value.data as BoardData | null };
  }
  if (value.kind === 'formatter') {
    if (!text(value.content)) throw new Error('The backup contains invalid JSON document text. Nothing was imported.');
    return { ...base, kind: 'formatter', content: value.content };
  }
  if (!text(value.language, 100)) throw new Error('The backup contains an invalid language.');
  if (value.kind === 'notes' && text(value.content)) return { ...base, kind: 'notes', content: value.content, language: value.language };
  if (value.kind === 'compare' && text(value.original) && text(value.modified)) return { ...base, kind: 'compare', original: value.original, modified: value.modified, language: value.language };
  throw new Error('The backup contains invalid text. Nothing was imported.');
}

export function parseWorkspace(value: unknown): Workspace {
  if (!object(value) || value.version !== 1 || !Array.isArray(value.items) || value.items.length > 2000 || !validMode(value.mode) || !object(value.active)) throw new Error('This is not a supported Canvas workspace.');
  const items = value.items.map(parseItem);
  if (new Set(items.map(item => item.id)).size !== items.length) throw new Error('The workspace contains duplicate item IDs.');
  const openTabs = Array.isArray(value.openTabs) ? [...new Set(value.openTabs.filter((id): id is string => typeof id === 'string' && items.some(item => item.id === id)))] : undefined;
  // A malformed optional preference must never prevent documents from loading.
  const sidebarPreferences = value.sidebarCollapsed;
  const sidebarCollapsed: Workspace['sidebarCollapsed'] = object(sidebarPreferences)
    ? Object.fromEntries(modes.filter(kind => typeof sidebarPreferences[kind] === 'boolean').map(kind => [kind, sidebarPreferences[kind]]))
    : undefined;
  const active = {} as Workspace['active'];
  for (const kind of modes) {
    const candidates = items.filter(item => item.kind === kind && (!openTabs || openTabs.includes(item.id)));
    active[kind] = candidates.find(item => item.id === (value.active as Record<string, unknown>)[kind])?.id ?? candidates[0]?.id ?? null;
  }
  return { version: 1, items, active, mode: value.mode, appearance: normalizeAppearance(value.appearance), ...(openTabs ? { openTabs } : {}), ...(sidebarCollapsed ? { sidebarCollapsed } : {}) };
}

export function parseImport(source: string): { items: Item[]; source: string; appearance?: Appearance } {
  let value: unknown;
  try { value = JSON.parse(source); } catch { throw new Error('This file is not valid JSON. Nothing was imported.'); }
  if (object(value) && value.format === 'canvas-workspace') {
    const workspace = parseWorkspace(value.workspace);
    return { items: workspace.items, appearance: workspace.appearance, source: 'Canvas' };
  }
  if (object(value) && object(value.backup) && object(value.backup.database) && object(value.backup.database.stores)) {
    const files = value.backup.database.stores.files;
    if (!Array.isArray(files) || files.length > 2000) throw new Error('The backup has an invalid file list.');
    const items = files.map((file): Note => {
      if (!object(file) || !text(file.name, 300) || !text(file.content) || !text(file.language, 100)) throw new Error('The backup contains an invalid file. Nothing was imported.');
      return { ...createItem('notes') as Note, name: file.name, content: file.content, language: file.language };
    });
    return { items, source: 'NotepadXX' };
  }
  throw new Error('Choose a supported workspace backup.');
}

export function mergeImport(current: Workspace, imported: ReturnType<typeof parseImport>): Workspace {
  if (current.items.length + imported.items.length > 2000) throw new Error('This import would exceed the 2,000-document workspace limit. Nothing was imported.');
  const additions = imported.items.map(item => ({ ...item, id: crypto.randomUUID(), updatedAt: Date.now() }));
  const first = additions[0];
  return { ...current, items: [...current.items, ...additions], appearance: imported.appearance ?? current.appearance, mode: first?.kind ?? current.mode, active: first ? { ...current.active, [first.kind]: first.id } : current.active, ...(additions.length ? { openTabs: [...(current.openTabs ?? current.items.map(item => item.id)), ...additions.map(item => item.id)] } : {}) };
}

export function openDocument(current: Workspace, item: Item): Workspace {
  return { ...current, mode: item.kind, active: { ...current.active, [item.kind]: item.id }, openTabs: [...new Set([...(current.openTabs ?? current.items.map(document => document.id)), item.id])] };
}

export function closeDocument(current: Workspace, id: string): Workspace {
  const document = current.items.find(item => item.id === id);
  if (!document) return current;
  const openTabs = (current.openTabs ?? current.items.map(item => item.id)).filter(tab => tab !== id);
  const remaining = current.items.filter(item => item.kind === document.kind && openTabs.includes(item.id));
  return { ...current, openTabs, active: { ...current.active, [document.kind]: current.active[document.kind] === id ? remaining.at(-1)?.id ?? null : current.active[document.kind] } };
}

export function exportWorkspace(workspace: Workspace): string {
  return JSON.stringify({ format: 'canvas-workspace', exportedAt: new Date().toISOString(), workspace }, null, 2);
}

export function languageFromFilename(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  return ({ ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', md: 'markdown', json: 'json', html: 'html', css: 'css', py: 'python', sql: 'sql', yml: 'yaml', yaml: 'yaml', sh: 'shell', java: 'java', cpp: 'cpp', go: 'go', rs: 'rust' } as Record<string, string>)[ext ?? ''] ?? 'plaintext';
}
