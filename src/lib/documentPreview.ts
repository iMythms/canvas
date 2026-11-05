import type { Item } from './workspace.ts';

/** Partition without reordering documents within either group. */
export function groupDocuments(items: readonly Item[]) {
  return { pinned: items.filter(item => item.pinned), regular: items.filter(item => !item.pinned) };
}

export function documentSummary(item: Item): string {
  if (item.kind === 'board') {
    const count = item.data?.elements.filter(element => !element.isDeleted).length ?? 0;
    return count ? `${count} ${count === 1 ? 'element' : 'elements'}` : 'Empty board';
  }
  if (item.kind === 'compare') {
    if (!item.original && !item.modified) return 'Empty comparison';
    if (item.original === item.modified) return 'No changes';
    const lines = (text: string) => text ? text.split(/\r?\n/).length : 0;
    return `${lines(item.original)} original · ${lines(item.modified)} modified lines`;
  }
  if (!item.content.trim()) return item.kind === 'formatter' ? 'Empty JSON document' : 'Empty note';
  const lines = item.content.split(/\r?\n/).length;
  return `${lines} ${lines === 1 ? 'line' : 'lines'} · ${item.content.length.toLocaleString()} characters`;
}
