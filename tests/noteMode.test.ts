import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectLanguage, togglePane } from '../src/lib/noteMode.ts';

test('auto language recognizes strong signals and leaves prose alone', () => {
  assert.equal(detectLanguage('A short note about a function'), 'plaintext');
  assert.equal(detectLanguage('# Heading\n\nSome text'), 'markdown');
  assert.equal(detectLanguage('{"name":"canvas"}'), 'json');
  assert.equal(detectLanguage('#!/usr/bin/env python3\nprint(1)'), 'python');
  assert.equal(detectLanguage('const answer = 42;'), 'javascript');
  assert.equal(detectLanguage('x'.repeat(20000) + '\n# heading'), 'plaintext');
});
test('pane toggles cannot hide the last pane and can reopen either', () => {
  const both = { edit: true, read: true };
  const read = togglePane(both, 'edit');
  assert.deepEqual(read, { edit: false, read: true });
  assert.deepEqual(togglePane(read, 'read'), read);
  assert.deepEqual(togglePane(read, 'edit'), both);
  const edit = togglePane(both, 'read');
  assert.deepEqual(togglePane(edit, 'edit'), edit);
  assert.deepEqual(togglePane(edit, 'read'), both);
});

test('structural code signals take precedence over leading comments', () => {
  for (const [source, expected] of [
    ['# helper\ndef run():\n  pass', 'python'],
    ['package main\nfunc main() {}', 'go'],
    ['// entry\nfn main() {}', 'rust'],
    ['#include <vector>\nint main() {}', 'cpp'],
    ['public class Demo {\n public void run() {}\n}', 'java'],
    ['.card { color: red; }', 'css'],
    ['# Heading\nA description of a class', 'markdown'],
  ]) assert.equal(detectLanguage(source), expected);
});
