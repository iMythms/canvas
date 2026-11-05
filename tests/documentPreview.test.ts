import assert from 'node:assert/strict';
import { test } from 'node:test';
import { documentSummary, groupDocuments } from '../src/lib/documentPreview.ts';
import type { Item } from '../src/lib/workspace.ts';

const note = (id: string, pinned = false): Item => ({ id, pinned, name: id, updatedAt: 0, kind: 'notes', language: 'plaintext', content: 'First line\nSecond line' });

test('pinned and regular documents retain their relative order without mutating the source', () => {
  const documents = [note('first'), note('second', true), note('third'), note('fourth', true)];
  const groups = groupDocuments(documents);
  assert.deepEqual(groups.pinned.map(item => item.id), ['second', 'fourth']);
  assert.deepEqual(groups.regular.map(item => item.id), ['first', 'third']);
  assert.deepEqual(documents.map(item => item.id), ['first', 'second', 'third', 'fourth']);
  assert.deepEqual(groupDocuments([]), { pinned: [], regular: [] });
});

test('preview summaries describe document contents and empty states', () => {
  const item = note('note');
  assert.equal(documentSummary(item), '2 lines · 22 characters');
  assert.equal(documentSummary({ ...item, kind: 'formatter', content: '  ' }), 'Empty JSON document');
  assert.equal(documentSummary({ ...item, content: '' }), 'Empty note');
  assert.equal(documentSummary({ ...item, kind: 'compare', original: 'a', modified: 'a' }), 'No changes');
  assert.equal(documentSummary({ ...item, kind: 'compare', original: 'a', modified: 'a\nb' }), '1 original · 2 modified lines');
  assert.equal(documentSummary({ ...item, kind: 'board', data: null }), 'Empty board');
});

test('board summaries omit deleted scene elements', () => {
  const board = { ...note('board'), kind: 'board', data: { elements: [{ isDeleted: false }, { isDeleted: true }, { isDeleted: false }] } } as unknown as Item;
  assert.equal(documentSummary(board), '2 elements');
});
