import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { boardBackgroundMode, initialBoardBackground, THEME_BOARD_BACKGROUND } from '../src/lib/boardTheme.ts';

test('new boards use the theme background', () => {
  assert.equal(initialBoardBackground(), 'transparent');
  assert.equal(initialBoardBackground(THEME_BOARD_BACKGROUND), 'transparent');
});

test('unmarked legacy defaults migrate to the theme', () => {
  for (const color of ['#fff', '#ffffff', '#FFFFFF']) assert.equal(initialBoardBackground(color), 'transparent');
});

test('explicit backgrounds survive reopening and theme changes', () => {
  for (const color of ['#ffffff', '#a5d8ff', '#1e1e1e']) {
    assert.equal(initialBoardBackground(color, 'custom'), color);
  }
  for (const color of ['#a5d8ff', '#1e1e1e']) {
    assert.equal(initialBoardBackground(color), color);
  }
  assert.equal(boardBackgroundMode('#ffffff'), 'custom');
  assert.equal(boardBackgroundMode('transparent'), 'theme');
  assert.equal(initialBoardBackground('#ffffff', 'theme'), 'transparent');
});
