import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boardHelpAlternative } from '../src/lib/boardShortcuts.ts';

test('board help replaces only workspace-owned duplicate and link shortcuts', () => {
  assert.match(boardHelpAlternative(['Cmd', 'D', 'Option', 'drag']) ?? '', /drag/);
  assert.match(boardHelpAlternative(['Ctrl', 'D', 'Alt', 'drag']) ?? '', /Duplicate/);
  assert.match(boardHelpAlternative(['Cmd', 'K']) ?? '', /link control/);
  assert.match(boardHelpAlternative(['Ctrl', 'K']) ?? '', /link control/);
  assert.equal(boardHelpAlternative(['D']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'Shift', 'D']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'D']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'D', 'Alt', 'drag', 'extra']), null);
  assert.equal(boardHelpAlternative(['Ctrl', 'Z']), null);
});
