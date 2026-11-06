/** Detect only recognizable syntax; ambiguous prose stays plain text. */
export function detectLanguage(content: string): string {
  const text = content.slice(0, 20000).trim();
  const jsonText = content.length <= 1_000_000 ? content.trim() : text;
  const code = text.replace(/^[ \t]*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, '');
  if (!text) return 'plaintext';
  if (/^(?:\{|\[)/.test(text)) {
    try { const value: unknown = JSON.parse(jsonText); if (value !== null && typeof value === 'object') return 'json'; } catch { /* incomplete input */ }
  }
  if (/^\s*<(?:!doctype html|html|head|body|div|p|section|article)\b/i.test(text)) return 'html';
  if (/^#!.*\b(?:ba|z|fi)?sh\b/.test(text)) return 'shell';
  if (/^#!.*\bpython[\d.]*\b/.test(code)) return 'python';
  if (/^\s*(?:pub\s+)?(?:async\s+)?fn\s+\w+\s*\([^\n]*\)\s*(?:->[^\n{]+)?\s*\{/m.test(code)) return 'rust';
  if (/\b(?:interface|type)\s+\w+\s*(?:=|\{)/.test(code)) return 'typescript';
  if (/\b(?:const|let)\s+\w+\s*=|\bfunction\s+\w+\s*\(/.test(code)) return 'javascript';
  if (/^\s*(?:def|class)\s+\w+\s*\([^\n]*\)\s*:/m.test(code)) return 'python';
  if (/^\s*SELECT\s+[\s\S]+\s+FROM\s+\w+/i.test(text)) return 'sql';
  if (/^\s*package\s+\w+\s*\n[\s\S]*?^\s*func\s+(?:\([^\n]+\)\s*)?\w+\s*\(/m.test(code)) return 'go';
  if (/^\s*(?:pub\s+)?(?:async\s+)?fn\s+\w+\s*\([^\n]*\)\s*(?:->[^\n{]+)?\s*\{/m.test(code)) return 'rust';
  if (/^\s*(?:public\s+)?class\s+\w+[^\n]*\{[\s\S]*\b(?:public|private|protected)\s+(?:static\s+)?(?:void|\w+)\s+\w+\s*\(/m.test(code)) return 'java';
  if (/^\s*#\s*include\s*[<"][^>"]+[>"]/m.test(code)) return 'cpp';
  if (/^[ \t]*[.#]?[\w-]+(?:[ \t]*,[ \t]*[.#]?[\w-]+)*[ \t]*\{[ \t\n]*[\w-]+[ \t]*:[^;{}]+;/m.test(code)) return 'css';
  if (/^(?:#{1,6}\s+\S|```|>\s+\S|[-*+]\s+\S)/m.test(text) || /\[[^\]]+\]\(https?:\/\/[^)]+\)/.test(text)) return 'markdown';
  if (/^(?:---\s*\n)?(?:[A-Za-z_][\w-]*:[ \t]+(?:[^\n]+|\n(?:[ \t]+[^\n]+\n?)+)\n?){2,}$/m.test(text)) return 'yaml';
  return 'plaintext';
}

export type PaneVisibility = { edit: boolean; read: boolean };
export function togglePane(state: PaneVisibility, pane: keyof PaneVisibility): PaneVisibility {
  if (state[pane] && !state[pane === 'edit' ? 'read' : 'edit']) return state;
  return { ...state, [pane]: !state[pane] };
}
