import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inlineKind, parseMarkdown, safeLink } from '../src/lib/markdown.ts';

test('fences preserve blank lines and lists retain indented continuations', () => {
  assert.deepEqual(parseMarkdown('- first\n  continuation\n- second\n\n```js\nlet x = 1;\n\nlet y = 2;\n```'), [
    { type: 'list', ordered: false, items: ['first\ncontinuation', 'second'] },
    { type: 'code', language: 'js', text: 'let x = 1;\n\nlet y = 2;' },
  ]);
});
test('parses headings, quotes, ordered lists and tables', () => {
  assert.deepEqual(parseMarkdown('## Title\n> quoted\n\n1. one\n2. two\n\n| A | B |\n| --- | --- |\n| x | y |'), [
    { type: 'heading', level: 2, text: 'Title' }, { type: 'quote', text: 'quoted' },
    { type: 'list', ordered: true, items: ['one', 'two'] }, { type: 'table', header: ['A', 'B'], rows: [['x', 'y']] },
  ]);
});
test('link destinations reject script, protocol-relative and control-character URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,x', '//evil.test', 'https://good.test\n.evil']) assert.equal(safeLink(url), undefined);
  assert.equal(safeLink('https://example.com'), 'https://example.com');
  assert.equal(safeLink('#section'), '#section');
});

test('unmatched inline delimiters remain literal', () => {
  for (const fragment of ['**unfinished', '`unfinished', '`', '__unfinished']) assert.equal(inlineKind(fragment), 'text');
  assert.equal(inlineKind('**bold**'), 'strong');
  assert.equal(inlineKind('`code`'), 'code');
});
test('headings preserve literal trailing hashes and allow empty headings', () => {
  assert.deepEqual(parseMarkdown('# title#\n## title ##\n###'), [
    { type: 'heading', level: 1, text: 'title#' },
    { type: 'heading', level: 2, text: 'title' },
    { type: 'heading', level: 3, text: '' },
  ]);
});

test('frontmatter handles CRLF and retains unsupported YAML visibly', () => {
  assert.deepEqual(parseMarkdown('---\r\nname: council\r\ndescription: Trigger this\r\n---\r\n# Title'), [
    { type: 'metadata', entries: [['name', 'council'], ['description', 'Trigger this']] },
    { type: 'heading', level: 1, text: 'Title' },
  ]);
  assert.deepEqual(parseMarkdown('---\ntags: [one, two]\n---\ntext')[0], { type: 'code', language: '', text: '---\ntags: [one, two]\n---' });
  assert.deepEqual(parseMarkdown('---\n\ntext'), [{ type: 'rule' }, { type: 'paragraph', text: 'text' }]);
  assert.deepEqual(parseMarkdown('text\n---\nmore'), [{ type: 'paragraph', text: 'text' }, { type: 'rule' }, { type: 'paragraph', text: 'more' }]);
});

test('preserves soft and explicit hard break markers and raw HTML as text', () => {
  assert.deepEqual(parseMarkdown('first\nsecond  \nthird\\\nfourth\n<script>alert(1)</script>'), [
    { type: 'paragraph', text: 'first\nsecond  \nthird\\\nfourth\n<script>alert(1)</script>' },
  ]);
  assert.equal(safeLink('javascript:alert(1)'), undefined);
});
