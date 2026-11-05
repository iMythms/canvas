import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleWorkspaceShortcut, shortcutBlockedForContext, workspaceShortcut, type WorkspaceShortcutActions } from '../src/lib/useWorkspaceShortcuts.ts';

function key(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return { key: '', code: '', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false, isComposing: false, repeat: false, defaultPrevented: false, preventDefault() {}, stopImmediatePropagation() {}, ...overrides } as KeyboardEvent;
}

test('matches workspace commands and preserves unrelated combinations', () => {
  assert.equal(workspaceShortcut(key({ key: 'n', metaKey: true })), 'new');
  assert.equal(workspaceShortcut(key({ key: 'D', ctrlKey: true, shiftKey: true })), 'splitDown');
  assert.equal(workspaceShortcut(key({ key: 'd', ctrlKey: true })), 'splitRight');
  assert.equal(workspaceShortcut(key({ key: '˜', code: 'KeyN', altKey: true, shiftKey: true })), 'new');
  assert.equal(workspaceShortcut(key({ key: 'W', altKey: true, shiftKey: true })), 'close');
  assert.equal(workspaceShortcut(key({ key: '!', code: 'Digit1', metaKey: true, shiftKey: true })), 0);
  assert.equal(workspaceShortcut(key({ key: 'Enter', metaKey: true, shiftKey: true })), 'focus');
  assert.equal(workspaceShortcut(key({ key: 'f', metaKey: true })), null);
  assert.equal(workspaceShortcut(key({ key: 'n', metaKey: true, altKey: true })), null);
  assert.equal(workspaceShortcut(key({ key: 'n', metaKey: true, isComposing: true })), null);
});

test('claims handled events before editors and ignores blocked or repeated actions', () => {
  const calls: string[] = [];
  const actions: WorkspaceShortcutActions = {
    onNew: () => calls.push('new'), onSplit: direction => calls.push(direction), onClose: () => calls.push('close'),
    onSearch: () => calls.push('search'), onExport: () => calls.push('export'), onFocus: () => calls.push('focus'), onMode: index => calls.push(String(index)),
  };
  const event = key({ key: 'n', metaKey: true, preventDefault: () => calls.push('prevent'), stopImmediatePropagation: () => calls.push('stop') });
  handleWorkspaceShortcut(event, actions, false);
  assert.deepEqual(calls, ['prevent', 'stop', 'new']);
  calls.length = 0;
  handleWorkspaceShortcut(event, actions, true);
  assert.deepEqual(calls, ['prevent', 'stop']);
  calls.length = 0;
  handleWorkspaceShortcut({ ...event, repeat: true }, actions, false);
  assert.deepEqual(calls, ['prevent', 'stop']);
  calls.length = 0;
  handleWorkspaceShortcut({ ...event, defaultPrevented: true }, actions, false);
  assert.deepEqual(calls, []);
});

test('workspace commands claim conflicting board shortcuts before the engine', () => {
  for (const [keyName, shiftKey, expected] of [
    ['d', false, 'vertical'], ['D', true, 'horizontal'], ['k', false, 'search'],
    ['s', false, 'export'], ['n', false, 'new'], ['w', false, 'close'],
  ] as const) {
    const calls: string[] = [];
    const actions: WorkspaceShortcutActions = {
      onNew: () => calls.push('new'), onSplit: direction => calls.push(direction), onClose: () => calls.push('close'),
      onSearch: () => calls.push('search'), onExport: () => calls.push('export'), onFocus: () => calls.push('focus'), onMode: () => {},
    };
    handleWorkspaceShortcut(key({ key: keyName, ctrlKey: true, shiftKey,
      preventDefault: () => calls.push('prevent'), stopImmediatePropagation: () => calls.push('stop') }), actions, false);
    assert.deepEqual(calls, ['prevent', 'stop', expected]);
  }
});

test('modal and editable contexts block workspace actions even inside an editor', () => {
  assert.equal(shortcutBlockedForContext(true, false, true, false), true);
  assert.equal(shortcutBlockedForContext(false, true, true, true), true);
  assert.equal(shortcutBlockedForContext(false, false, false, true), true);
  assert.equal(shortcutBlockedForContext(false, false, true, true), false);
});
