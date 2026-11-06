import { detectLanguage } from './noteMode.ts';
import type { Note } from './workspace';

/** Resolve Auto from the current content at download time. Preserve explicit extensions. */
export function noteDownloadFilename(note: Pick<Note, 'name' | 'content' | 'language'>): string {
  if (/\.[a-z0-9]+$/i.test(note.name)) return note.name;
  const language = note.language === 'auto' ? detectLanguage(note.content) : note.language;
  const extension = ({
    plaintext: 'txt', markdown: 'md', typescript: 'ts', javascript: 'js',
    json: 'json', html: 'html', css: 'css', python: 'py', sql: 'sql',
    yaml: 'yaml', shell: 'sh', java: 'java', cpp: 'cpp', go: 'go', rust: 'rs',
  } as Record<string, string>)[language] ?? language;
  return `${note.name}.${extension}`;
}
