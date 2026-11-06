import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { languages } from '../src/lib/workspace.ts';
import { noteLanguageIcons, resolveNoteLanguageIcon } from '../src/lib/noteLanguageIcon.ts';

const examples = [
  ['plaintext', 'Some ordinary prose', 'document'],
  ['markdown', '# Heading\n\nText', 'markdown'],
  ['typescript', 'interface User { name: string }', 'typescript'],
  ['javascript', 'const answer = 42;', 'javascript'],
  ['json', '{"answer":42}', 'json'],
  ['html', '<!doctype html><html></html>', 'html'],
  ['css', '.card { color: red; }', 'css'],
  ['python', 'def run():\n  pass', 'python'],
  ['sql', 'SELECT name FROM users', 'database'],
  ['yaml', 'name: Canvas\nversion: 1', 'yaml'],
  ['shell', '#!/bin/bash\necho hello', 'console'],
  ['java', 'public class Demo {\n public void run() {}\n}', 'java'],
  ['cpp', '#include <vector>\nint main() {}', 'cpp'],
  ['go', 'package main\nfunc main() {}', 'go'],
  ['rust', 'fn main() {}', 'rust'],
] as const;

test('every supported language has the expected official icon in manual and auto modes', () => {
  assert.deepEqual(examples.map(([language]) => language).sort(), languages.map(([language]) => language).sort());
  assert.deepEqual(Object.keys(noteLanguageIcons).sort(), languages.map(([language]) => language).sort());
  for (const [language, content, icon] of examples) {
    assert.equal(resolveNoteLanguageIcon({ language, content: '' }), icon, `manual ${language}`);
    assert.equal(resolveNoteLanguageIcon({ language: 'auto', content }), icon, `auto ${language}`);
  }
});

test('manual language wins over syntax and filename, and changes with selection', () => {
  const note = { name: 'misleading.py', language: 'typescript', content: '{"answer":42}' };
  assert.equal(resolveNoteLanguageIcon(note), 'typescript');
  note.language = 'plaintext';
  assert.equal(resolveNoteLanguageIcon(note), 'document');
  note.language = 'auto';
  assert.equal(resolveNoteLanguageIcon(note), 'json');
  note.language = 'python';
  assert.equal(resolveNoteLanguageIcon(note), 'python');
});

test('auto follows current content and handles empty or unrecognized content', () => {
  const note = { language: 'auto', content: '' };
  for (const [content, icon] of [['', 'document'], ['const x = 1;', 'javascript'], ['# Title', 'markdown'], ['Just a note', 'document']]) {
    note.content = content;
    assert.equal(resolveNoteLanguageIcon(note), icon);
  }
});

test('unknown manual languages safely fall back without detecting or using prototype properties', () => {
  for (const language of ['unknown', '', 'toString', '__proto__', 'constructor']) {
    assert.equal(resolveNoteLanguageIcon({ language, content: '{"answer":42}' }), 'document');
  }
});

test('only the mapped local SVGs are vendored and all are explicitly bundled inline', () => {
  const folder = new URL('../src/assets/languages/', import.meta.url);
  const component = readFileSync(new URL('../src/components/NoteLanguageIcon.tsx', import.meta.url), 'utf8');
  const assets = Object.values(noteLanguageIcons).map(name => `${name}.svg`).sort();
  assert.deepEqual(readdirSync(folder).filter(name => name.endsWith('.svg')).sort(), assets);
  for (const filename of assets) {
    const svg = readFileSync(new URL(filename, folder), 'utf8');
    assert.match(svg, /<svg\b[^>]*viewBox="-?\d+ -?\d+ ([1-9][0-9]*) \1"/);
    assert.doesNotMatch(svg, /<(?:script|image)\b|(?:href|src)=|url\(/i);
    assert.ok(component.includes(`../assets/languages/${filename}?inline`), `${filename} bundled inline`);
  }
  const license = readFileSync(new URL('LICENSE', folder), 'utf8');
  assert.match(license, /Copyright \(c\) 2025 Material Extensions/);
  // The image's license reference makes Vite emit the full notice for distribution.
  assert.ok(component.includes('../assets/languages/LICENSE?url&no-inline'));
  assert.ok(component.includes('data-license={licenseUrl}'));
});
