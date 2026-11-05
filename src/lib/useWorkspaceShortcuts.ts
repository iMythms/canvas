import { useEffect, useRef } from 'react';

type SplitDirection = 'vertical' | 'horizontal';
export type WorkspaceShortcutActions = {
  onNew: () => void;
  onSplit: (direction: SplitDirection) => void;
  onClose: () => void;
  onSearch: () => void;
  onExport: () => void;
  onFocus: () => void;
  onMode: (index: number) => void;
};

type Shortcut = 'new' | 'splitRight' | 'splitDown' | 'close' | 'search' | 'export' | 'focus' | 0 | 1 | 2 | 3;

/** Identify only combinations owned by the workspace, leaving editor shortcuts alone. */
export function workspaceShortcut(event: Pick<KeyboardEvent, 'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'isComposing'>): Shortcut | null {
  if (event.isComposing) return null;
  const key = event.key.toLowerCase();
  // Alternative combinations for browsers that reserve new-window and close-tab.
  if (event.altKey && event.shiftKey && !event.metaKey && !event.ctrlKey) {
    if (event.code === 'KeyN' || key === 'n') return 'new';
    if (event.code === 'KeyW' || key === 'w') return 'close';
    return null;
  }
  if (!(event.metaKey || event.ctrlKey) || event.altKey) return null;
  if (event.shiftKey) {
    if (key === 'd') return 'splitDown';
    if (key === 'enter') return 'focus';
    if (/^Digit[1-4]$/.test(event.code)) return (Number(event.code.slice(-1)) - 1) as 0 | 1 | 2 | 3;
    return null;
  }
  switch (key) {
    case 'n': return 'new';
    case 'd': return 'splitRight';
    case 'w': return 'close';
    case 'k': return 'search';
    case 's': return 'export';
    default: return null;
  }
}

/** Called in the window capture phase, before embedded editors handle the event. */
export function handleWorkspaceShortcut(event: KeyboardEvent, actions: WorkspaceShortcutActions, blocked: boolean): void {
  const shortcut = workspaceShortcut(event);
  if (shortcut === null || event.defaultPrevented) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  // Prevent a held key from opening or closing many documents.
  if (blocked || event.repeat) return;
  switch (shortcut) {
    case 'new': actions.onNew(); break;
    case 'splitRight': actions.onSplit('vertical'); break;
    case 'splitDown': actions.onSplit('horizontal'); break;
    case 'close': actions.onClose(); break;
    case 'search': actions.onSearch(); break;
    case 'export': actions.onExport(); break;
    case 'focus': actions.onFocus(); break;
    default: actions.onMode(shortcut);
  }
}

export function shortcutBlockedForContext(modalOpen: boolean, inDialog: boolean, inEditor: boolean, editable: boolean): boolean {
  return modalOpen || inDialog || (!inEditor && editable);
}

function isShortcutBlocked(event: KeyboardEvent): boolean {
  const modalOpen = !!document.querySelector('dialog[open], .excalidraw-modal-container .Modal');
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return modalOpen;
  // Embedded editor surfaces use textareas for editing content.
  return shortcutBlockedForContext(modalOpen,
    !!target.closest('[role="dialog"], [role="listbox"]'),
    !!target.closest('.monaco-editor, .excalidraw'),
    !!target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));
}

export function useWorkspaceShortcuts(actions: WorkspaceShortcutActions): void {
  const latest = useRef(actions);
  latest.current = actions;
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => handleWorkspaceShortcut(event, latest.current, isShortcutBlocked(event));
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, []);
}
