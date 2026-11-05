import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultAppearance } from '../src/lib/themes.ts';
import { closeDocument, openDocument, exportWorkspace, mergeImport, parseImport, parseWorkspace, type Workspace } from '../src/lib/workspace.ts';

function fixture(): Workspace {
  // Use a plain JSON scene so these tests do not load React or Excalidraw.
  return {
    version: 1,
    mode: 'compare',
    active: { notes: 'note-1', board: 'board-1', compare: 'compare-1', formatter: null },
    appearance: {
      ...defaultAppearance, mode: 'dark', preset: 'catppuccin', accent: '#a1b2c3',
      background: '#112233', foreground: '#ddeeff', font: 'serif', codeFont: 'menlo',
      uiFontSize: 17, codeFontSize: 19, reduceMotion: true,
    },
    items: [
      { id: 'note-1', kind: 'notes', name: 'Ideas.md', updatedAt: 123, pinned: true, content: 'مرحبا 🌱\nSecond line\n', language: 'markdown' },
      {
        id: 'board-1', kind: 'board', name: 'Plan', updatedAt: 456, pinned: false,
        data: {
          elements: [{
            id: 'rectangle-1', type: 'rectangle', x: -10, y: 30, width: 120, height: 80,
            version: 1, angle: 0, strokeColor: '#000000', backgroundColor: 'transparent',
            fillStyle: 'solid', strokeWidth: 1, strokeStyle: 'solid', roughness: 1,
            opacity: 100, groupIds: [], frameId: null, index: 'a0', roundness: null,
            seed: 17, versionNonce: 23, isDeleted: false, boundElements: null,
            updated: 456, link: null, locked: false,
          }],
          appState: { viewBackgroundColor: '#ffffff', scrollX: -100, scrollY: 200, zoom: { value: 1.25 } },
          files: { image1: { id: 'image1', mimeType: 'image/png', dataURL: 'data:image/png;base64,aGVsbG8=', created: 123, lastRetrieved: 456 } },
        },
      },
      { id: 'compare-1', kind: 'compare', name: 'Changes.ts', updatedAt: 789, pinned: false, original: 'const x = 1;\r\n', modified: 'const x = 2;\n', language: 'typescript' },
    ],
  } as Workspace;
}

const envelope = (workspace: unknown) => JSON.stringify({ format: 'canvas-workspace', workspace });
const legacyBackup = (files: unknown[]) => JSON.stringify({ backup: { database: { stores: { files } } } });

test('Canvas export round trips every item, selection, scene asset, and appearance setting', () => {
  const workspace = fixture();
  const exported = exportWorkspace(workspace);
  const decoded = JSON.parse(exported);
  assert.equal(decoded.format, 'canvas-workspace');
  assert.ok(Number.isFinite(Date.parse(decoded.exportedAt)));
  assert.deepEqual(parseWorkspace(decoded.workspace), workspace);
  const imported = parseImport(exported);
  assert.equal(imported.source, 'Canvas');
  assert.deepEqual(imported.items, workspace.items);
  assert.deepEqual(imported.appearance, workspace.appearance);
});

test('per-mode sidebar preferences survive browser reload and backup round trips independently', () => {
  const workspace = { ...fixture(), sidebarCollapsed: { notes: true, board: false, compare: true, formatter: false } };
  const reloaded = parseWorkspace(JSON.parse(JSON.stringify(workspace)));
  assert.deepEqual(reloaded, workspace);
  const restored = parseWorkspace(JSON.parse(exportWorkspace(reloaded)).workspace);
  assert.deepEqual(restored.sidebarCollapsed, workspace.sidebarCollapsed);
  assert.deepEqual(restored.items, workspace.items);
  const switched = openDocument(restored, restored.items[1]!);
  assert.equal(switched.mode, 'board');
  assert.equal(switched.sidebarCollapsed?.board, false);
  assert.equal(switched.sidebarCollapsed?.notes, true);
});

test('older workspaces and backups without sidebar preferences retain all content', () => {
  const workspace = fixture();
  const reloaded = parseWorkspace(JSON.parse(JSON.stringify(workspace)));
  assert.deepEqual(reloaded, workspace);
  for (const mode of ['notes', 'board', 'compare', 'formatter'] as const) {
    assert.equal(reloaded.sidebarCollapsed?.[mode] ?? false, false);
  }
  assert.deepEqual(parseImport(exportWorkspace(workspace)).items, workspace.items);
});

test('sidebar preferences accept only known modes and booleans without rejecting documents', () => {
  const workspace = fixture();
  const parsed = parseWorkspace({ ...workspace, sidebarCollapsed: { notes: true, board: 'false', compare: 0, formatter: false, unknown: true } });
  assert.deepEqual(parsed.sidebarCollapsed, { notes: true, formatter: false });
  assert.deepEqual(parsed.items, workspace.items);
  assert.deepEqual(parseImport(envelope({ ...workspace, sidebarCollapsed: { notes: 'true' } })).items, workspace.items);
  for (const sidebarCollapsed of [undefined, null, false, 'true', [], [true]]) {
    const restored = parseWorkspace({ ...workspace, sidebarCollapsed });
    assert.equal(restored.sidebarCollapsed, undefined);
    assert.deepEqual(restored.items, workspace.items);
  }
});

test('empty workspaces and untouched boards survive export/import', () => {
  const empty = { ...fixture(), items: [], active: { notes: null, board: null, compare: null, formatter: null } };
  assert.deepEqual(parseWorkspace(JSON.parse(exportWorkspace(empty)).workspace), empty);
  const workspace = fixture();
  workspace.items[1] = { ...workspace.items[1]!, kind: 'board', data: null };
  assert.deepEqual(parseImport(exportWorkspace(workspace)).items, workspace.items);
});

test('stale or cross-mode active IDs recover to an item of the correct kind', () => {
  const workspace = fixture();
  const parsed = parseWorkspace({ ...workspace, active: { notes: 'board-1', board: 'missing', compare: null, formatter: null } });
  assert.deepEqual(parsed.active, workspace.active);
  assert.deepEqual(parseWorkspace({ ...workspace, items: workspace.items.filter(item => item.kind !== 'board') }).active,
    { ...workspace.active, board: null });
});

test('duplicate item IDs are rejected even across different kinds', () => {
  const workspace = fixture();
  workspace.items[1]!.id = workspace.items[0]!.id;
  assert.throws(() => parseWorkspace(workspace), /duplicate/i);
  assert.throws(() => parseImport(envelope(workspace)), /duplicate/i);
});

test('an invalid later item cannot partially merge a Canvas backup into existing work', () => {
  const workspace = fixture();
  const before = structuredClone(workspace);
  const corrupt = fixture();
  (corrupt.items[2] as unknown as Record<string, unknown>).modified = 42;
  let current = workspace;
  assert.throws(() => { current = mergeImport(current, parseImport(envelope(corrupt))); }, /invalid text/i);
  assert.strictEqual(current, workspace);
  assert.deepEqual(current, before);
});

test('rejects malformed JSON, unsupported formats, and unsupported workspace versions', () => {
  for (const source of ['{', 'null', '[]', '{}', JSON.stringify({ format: 'other', workspace: fixture() })]) {
    assert.throws(() => parseImport(source));
  }
  for (const version of [undefined, 0, 2, '1']) {
    assert.throws(() => parseWorkspace({ ...fixture(), version }), /supported/i);
  }
});

test('rejects oversized and malformed item metadata before accepting a workspace', () => {
  const workspace = fixture();
  const note = workspace.items[0]!;
  for (const patch of [
    { id: '' }, { id: 'i'.repeat(201) }, { name: 'n'.repeat(301) },
    { updatedAt: NaN }, { updatedAt: Infinity }, { pinned: 'true' },
    { kind: 'unknown' }, { language: 'x'.repeat(101) },
  ]) {
    assert.throws(() => parseWorkspace({ ...workspace, items: [{ ...note, ...patch }] }));
  }
  assert.throws(() => parseWorkspace({ ...workspace, mode: 'unknown' }));
  assert.throws(() => parseWorkspace({ ...workspace, active: [] }));
  const items = Array.from({ length: 2001 }, (_, index) => ({ ...note, id: `note-${index}` }));
  assert.throws(() => parseWorkspace({ ...workspace, items }));
  assert.equal(parseWorkspace({ ...workspace, items: items.slice(0, 2000) }).items.length, 2000);
});

test('large live text stays readable after saving and reloading', () => {
  const workspace = fixture();
  const note = workspace.items[0]!;
  assert.equal(note.kind, 'notes');
  if (note.kind !== 'notes') throw new Error('Expected note');
  note.content = 'x'.repeat(5_000_001);
  assert.equal((parseWorkspace(workspace).items[0] as typeof note).content.length, 5_000_001);
});

test('closing tabs preserves documents, survives reload and supports reopening', () => {
  const workspace = fixture();
  const closed = closeDocument(workspace, 'note-1');
  assert.deepEqual(closed.items, workspace.items);
  assert.equal(closed.active.notes, null);
  const restored = parseWorkspace(JSON.parse(exportWorkspace(closed)).workspace);
  assert.equal(restored.active.notes, null);
  assert.ok(!restored.openTabs?.includes('note-1'));
  const reopened = openDocument(restored, restored.items[0]!);
  assert.equal(reopened.active.notes, 'note-1');
  assert.ok(reopened.openTabs?.includes('note-1'));
});

test('rejects corrupt board geometry, duplicate elements, zoom, and image records', () => {
  const workspace = fixture();
  const board = workspace.items[1]!;
  assert.equal(board.kind, 'board');
  if (board.kind !== 'board' || !board.data) throw new Error('Missing test board');
  const scene = board.data;
  const corruptScenes = [
    { ...scene, elements: [{ ...scene.elements[0], x: Infinity }] },
    { ...scene, elements: [{ ...scene.elements[0], type: 'unsupported' }] },
    { ...scene, elements: [scene.elements[0], scene.elements[0]] },
    { ...scene, appState: { ...scene.appState, zoom: { value: 0 } } },
    { ...scene, appState: { ...scene.appState, scrollY: NaN } },
    { ...scene, files: { image1: { ...scene.files.image1, id: 'different-id' } } },
    { ...scene, files: { image1: { ...scene.files.image1, dataURL: 'https://example.com/image.png' } } },
    { ...scene, elements: Array(50_001).fill(scene.elements[0]) },
  ];
  for (const data of corruptScenes) {
    assert.throws(() => parseWorkspace({ ...workspace, items: [{ ...board, data }] }), /invalid board/i);
  }
});

test('NotepadXX backups preserve note contents and language, ignoring legacy storage IDs', () => {
  const files = [
    { id: 1, name: 'draft.md', content: 'One\n\nTwo 🌱', language: 'markdown' },
    { id: 1, name: 'main.py', content: 'print("hello")\n', language: 'python' },
  ];
  const imported = parseImport(legacyBackup(files));
  assert.equal(imported.source, 'NotepadXX');
  assert.equal(imported.appearance, undefined);
  assert.equal(new Set(imported.items.map(item => item.id)).size, files.length);
  imported.items.forEach((item, index) => {
    assert.equal(item.kind, 'notes');
    if (item.kind !== 'notes') throw new Error('Expected imported note');
    assert.equal(item.name, files[index]!.name);
    assert.equal(item.content, files[index]!.content);
    assert.equal(item.language, files[index]!.language);
    assert.equal(item.pinned, false);
  });
});

test('a malformed later NotepadXX file rejects the entire backup without replacing notes', () => {
  const workspace = fixture();
  const before = structuredClone(workspace);
  let current = workspace;
  const source = legacyBackup([
    { name: 'valid', content: 'keep this', language: 'plaintext' },
    { name: 'invalid', content: null, language: 'plaintext' },
  ]);
  assert.throws(() => { current = mergeImport(current, parseImport(source)); }, /invalid file/i);
  assert.deepEqual(current, before);
  assert.throws(() => parseImport(legacyBackup(Array(2001).fill({ name: 'a', content: '', language: 'plaintext' }))));
});

test('merging retains existing work, renews every imported ID, and selects the first import', () => {
  const current = fixture();
  const imported = parseImport(exportWorkspace(current));
  const beforeCurrent = structuredClone(current);
  const beforeImported = structuredClone(imported);
  const merged = mergeImport(current, imported);
  assert.equal(merged.items.length, current.items.length * 2);
  assert.deepEqual(merged.items.slice(0, current.items.length), current.items);
  assert.equal(new Set(merged.items.map(item => item.id)).size, merged.items.length);
  merged.items.slice(current.items.length).forEach((item, index) => {
    const previous = imported.items[index]!;
    assert.notEqual(item.id, previous.id);
    assert.ok(Number.isFinite(item.updatedAt));
    assert.deepEqual({ ...item, id: previous.id, updatedAt: previous.updatedAt }, previous);
  });
  assert.equal(merged.mode, 'notes');
  assert.equal(merged.active.notes, merged.items[current.items.length]!.id);
  assert.equal(merged.active.board, current.active.board);
  assert.equal(merged.active.compare, current.active.compare);
  assert.deepEqual(merged.appearance, imported.appearance);
  assert.deepEqual(current, beforeCurrent);
  assert.deepEqual(imported, beforeImported);
  assert.deepEqual(parseWorkspace(JSON.parse(exportWorkspace(merged)).workspace), merged);
});

test('legacy and empty imports retain current appearance and valid selections', () => {
  const current = fixture();
  const empty = mergeImport(current, parseImport(legacyBackup([])));
  assert.deepEqual(empty, current);
  const imported = parseImport(legacyBackup([{ name: 'a', content: '', language: 'plaintext' }]));
  assert.deepEqual(mergeImport(current, imported).appearance, current.appearance);
});

test('imports cannot create a workspace that exceeds the reload limit', () => {
  const current = fixture();
  const note = current.items[0]!;
  current.items = Array.from({ length: 2000 }, (_, index) => ({ ...note, id: `n-${index}` }));
  const before = structuredClone(current);
  const imported = parseImport(legacyBackup([{ name: 'one more', content: '', language: 'plaintext' }]));
  assert.throws(() => mergeImport(current, imported), /2,000-document/);
  assert.deepEqual(current, before);
});


test('older workspaces gain a formatter selection without changing documents', () => {
  const old = fixture();
  const { formatter: _unused, ...active } = old.active;
  const parsed = parseWorkspace({ ...old, active });
  assert.equal(parsed.active.formatter, null);
  assert.deepEqual(parsed.items, old.items);
});

test('formatter drafts round trip even when JSON is incomplete', () => {
  const current = fixture();
  const draft = { id: 'json-1', name: 'Payload', kind: 'formatter' as const, content: '{"incomplete":', updatedAt: 1234, pinned: false };
  const next = openDocument({ ...current, items: [...current.items, draft] }, draft);
  assert.deepEqual(parseWorkspace(JSON.parse(exportWorkspace(next)).workspace), next);
  assert.equal(parseImport(exportWorkspace(next)).items.at(-1)?.kind, 'formatter');
  assert.throws(() => parseWorkspace({ ...next, items: [{ ...draft, content: 42 }] }), /formatter text/);
});
