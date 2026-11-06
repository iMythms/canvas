import assert from 'node:assert/strict';
import { test } from 'node:test';
import { noteDownloadFilename } from '../src/lib/noteDownload.ts';

test('manual language chooses a usable extension even when the content looks like another language', () => {
  for (const [language, extension] of [
    ['plaintext', 'txt'], ['markdown', 'md'], ['typescript', 'ts'], ['javascript', 'js'],
    ['json', 'json'], ['html', 'html'], ['css', 'css'], ['python', 'py'], ['sql', 'sql'],
    ['yaml', 'yaml'], ['shell', 'sh'], ['java', 'java'], ['cpp', 'cpp'], ['go', 'go'], ['rust', 'rs'],
  ]) {
    assert.equal(noteDownloadFilename({ name: 'My note', content: '# Markdown heading', language }), `My note.${extension}`);
  }
});

test('Auto follows current content as a note changes languages', () => {
  const note = { name: 'Draft', content: '', language: 'auto' };
  for (const [content, filename] of [
    ['# Heading', 'Draft.md'], ['{"answer":42}', 'Draft.json'],
    ['const answer = 42;', 'Draft.js'], ['#!/bin/sh\necho hello', 'Draft.sh'],
    ['fn main() {}', 'Draft.rs'], ['A plain note', 'Draft.txt'], ['', 'Draft.txt'],
  ]) {
    note.content = content;
    assert.equal(noteDownloadFilename(note), filename);
  }
});

test('explicit extensions are preserved regardless of manual or Auto language', () => {
  for (const language of ['auto', 'markdown', 'rust']) {
    for (const name of ['Report.TXT', 'component.test.tsx', '.env', 'archive.custom123']) {
      assert.equal(noteDownloadFilename({ name, content: '# Heading', language }), name);
    }
  }
  assert.equal(noteDownloadFilename({ name: 'Draft.', content: '', language: 'plaintext' }), 'Draft..txt');
});
