export type Block =
  | { type: 'paragraph' | 'quote'; text: string }
  | { type: 'rule' }
  | { type: 'metadata'; entries: [string, string][] }
  | { type: 'heading'; level: number; text: string }
  | { type: 'code'; text: string; language: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] };

const fence = /^\s{0,3}(`{3,}|~{3,})([^`]*)$/;
const list = /^\s{0,3}([-+*]|\d+[.)])\s+(.*)$/;
const heading = /^ {0,3}(#{1,6})(?:[ \t]+(.*?)|[ \t]*)$/;
const cells = (line: string) => line.trim().replace(/^\||\|$/g, '').split('|').map(cell => cell.trim());
const tableRule = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
const rule = (line: string) => /^ {0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/.test(line);
const starts = (line: string) => rule(line) || fence.test(line) || list.test(line) || heading.test(line) || /^\s{0,3}>/.test(line);

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  if (lines[0] === '---') {
    const end = lines.findIndex((line, index) => index > 0 && /^(?:---|\.\.\.)\s*$/.test(line));
    if (end > 1) {
      const entries: [string, string][] = [];
      const valid = lines.slice(1, end).every(line => {
        const match = line.match(/^([\w-]+):[ \t]+([^\[\]{}|>]+)$/);
        if (!match || /^(?:[&*!]|[\"'])/.test(match[2].trim())) return false;
        entries.push([match[1], match[2].trim()]); return true;
      });
      if (valid) { blocks.push({ type: 'metadata', entries }); i = end + 1; }
      else { blocks.push({ type: 'code', language: '', text: lines.slice(0, end + 1).join('\n') }); i = end + 1; }
    }
  }
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (rule(line)) { blocks.push({ type: 'rule' }); i++; continue; }
    const f = line.match(fence);
    if (f) {
      i++; const body: string[] = [];
      const close = new RegExp(`^\\s{0,3}${f[1][0]}{${f[1].length},}\\s*$`);
      while (i < lines.length && !close.test(lines[i])) body.push(lines[i++]);
      if (i < lines.length) i++;
      blocks.push({ type: 'code', text: body.join('\n'), language: f[2].trim().split(/\s/)[0] }); continue;
    }
    const h = line.match(heading);
    if (h) { blocks.push({ type: 'heading', level: h[1].length, text: (h[2] ?? '').replace(/[ \t]+#+[ \t]*$/, '').trimEnd() }); i++; continue; }
    if (i + 1 < lines.length && line.includes('|') && tableRule(lines[i + 1])) {
      const header = cells(line); i += 2; const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) rows.push(cells(lines[i++]));
      blocks.push({ type: 'table', header, rows }); continue;
    }
    if (/^\s{0,3}>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) body.push(lines[i++].replace(/^\s{0,3}> ?/, ''));
      blocks.push({ type: 'quote', text: body.join('\n') }); continue;
    }
    const first = line.match(list);
    if (first) {
      const ordered = /^\d/.test(first[1]); const items: string[] = [];
      while (i < lines.length) {
        const item = lines[i].match(list);
        if (!item || /^\d/.test(item[1]) !== ordered) break;
        let text = item[2]; i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !list.test(lines[i])) text += '\n' + lines[i++].trim();
        items.push(text);
      }
      blocks.push({ type: 'list', ordered, items }); continue;
    }
    const body = [line]; i++;
    while (i < lines.length && lines[i].trim() && !starts(lines[i]) && !(i + 1 < lines.length && lines[i].includes('|') && tableRule(lines[i + 1]))) body.push(lines[i++]);
    blocks.push({ type: 'paragraph', text: body.join('\n') });
  }
  return blocks;
}

export function safeLink(url: string): string | undefined {
  const value = url.trim();
  return /^(?:https?:\/\/|mailto:|\/|#)/i.test(value) && !/^\/\//.test(value) && !/[\u0000-\u0020\\]/.test(value) ? value : undefined;
}

/** Classify only complete inline delimiters; unmatched fragments stay literal. */
export function inlineKind(part: string): 'code' | 'strong' | 'em' | 'text' {
  if (/^`[^`\n]+`$/.test(part)) return 'code';
  if (/^(?:\*\*[^*\n]+\*\*|__[^_\n]+__)$/.test(part)) return 'strong';
  if (/^(\*|_).+\1$/.test(part)) return 'em';
  return 'text';
}
