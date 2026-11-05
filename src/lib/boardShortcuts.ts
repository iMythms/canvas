// Excalidraw 0.18 renders these combinations in its own Help portal, but the
// workspace captures them before the editor. Match keys, not translated labels.
export function boardHelpAlternative(keys: readonly string[]): string | null {
  if (!['Ctrl', 'Cmd'].includes(keys[0] ?? '')) return null;
  if (keys.length === 4 && keys[1] === 'D' && ['Alt', 'Option'].includes(keys[2])) return 'Alt / Option + drag, or use Duplicate';
  if (keys.length === 2 && keys[1] === 'K') return 'Use the selected element’s link control';
  return null;
}

export function adaptBoardHelp(root: ParentNode): void {
  const help = root instanceof HTMLElement && root.matches('.HelpDialog') ? root : root.querySelector<HTMLElement>('.HelpDialog');
  if (help) {
    const docs = help.querySelector<HTMLAnchorElement>('.HelpDialog__header a[href="https://docs.excalidraw.com"]');
    docs?.setAttribute('aria-label', 'Excalidraw documentation');
    const island = help.querySelector<HTMLElement>('.Modal__content > .Island');
    if (island && !island.querySelector('.Dialog__close, .board-help-close')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'board-help-close';
      button.setAttribute('aria-label', 'Close help');
      button.title = 'Close help';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('aria-hidden', 'true');
      for (const [tag, attributes] of Cancel01Icon) {
        const shape = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [name, value] of Object.entries(attributes)) {
          if (name !== 'key') shape.setAttribute(name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`), String(value));
        }
        svg.appendChild(shape);
      }
      button.appendChild(svg);
      button.addEventListener('click', () => help.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
      island.appendChild(button);
    }
  }
  root.querySelectorAll<HTMLElement>('.HelpDialog__key-container').forEach((container) => {
    if (container.dataset.canvasAlternative) return;
    const keys = Array.from(container.querySelectorAll('kbd'), (key) => key.textContent?.trim() ?? '');
    const alternative = boardHelpAlternative(keys);
    if (!alternative) return;
    container.dataset.canvasAlternative = alternative;
    container.setAttribute('role', 'text');
    container.setAttribute('aria-label', alternative);
  });
}
import { Cancel01Icon } from '@hugeicons/core-free-icons';

