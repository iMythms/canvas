import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardHelpAlternative } from '../src/lib/boardShortcuts.ts';

test('board help preserves duplicate and adapts the workspace-owned link shortcut', () => {
  assert.equal(boardHelpAlternative(['Cmd', 'D', 'Option', 'drag']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'D', 'Alt', 'drag']), null);
  assert.match(boardHelpAlternative(['Cmd', 'K']) ?? '', /link control/);
  assert.match(boardHelpAlternative(['Ctrl', 'K']) ?? '', /link control/);
  assert.equal(boardHelpAlternative(['D']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'Shift', 'D']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'D']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'D', 'Alt', 'drag', 'extra']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'Z']), null);
});
