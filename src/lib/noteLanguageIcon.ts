import { detectLanguage } from './noteMode.ts';
import type { Note, languages } from './workspace.ts';

type NoteLanguage = typeof languages[number][0];

/** Official Material Icon Theme asset names; plaintext also serves as fallback. */
export const noteLanguageIcons = {
  plaintext: 'document', markdown: 'markdown', typescript: 'typescript',
  javascript: 'javascript', json: 'json', html: 'html', css: 'css',
  python: 'python', sql: 'database', yaml: 'yaml', shell: 'console',
  java: 'java', cpp: 'cpp', go: 'go', rust: 'rust',
} as const satisfies Record<NoteLanguage, string>;

export type NoteLanguageIconName = typeof noteLanguageIcons[NoteLanguage];

export function resolveNoteLanguageIcon(note: Pick<Note, 'language' | 'content'>): NoteLanguageIconName {
  const language = note.language === 'auto' ? detectLanguage(note.content) : note.language;
  return Object.hasOwn(noteLanguageIcons, language)
    ? noteLanguageIcons[language as NoteLanguage]
    : noteLanguageIcons.plaintext;
}
