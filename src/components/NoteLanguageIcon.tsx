import type { Note } from '../lib/workspace';
import { resolveNoteLanguageIcon, type NoteLanguageIconName } from '../lib/noteLanguageIcon';
import document from '../assets/languages/document.svg?inline';
import markdown from '../assets/languages/markdown.svg?inline';
import typescript from '../assets/languages/typescript.svg?inline';
import javascript from '../assets/languages/javascript.svg?inline';
import json from '../assets/languages/json.svg?inline';
import html from '../assets/languages/html.svg?inline';
import css from '../assets/languages/css.svg?inline';
import python from '../assets/languages/python.svg?inline';
import database from '../assets/languages/database.svg?inline';
import yaml from '../assets/languages/yaml.svg?inline';
import console from '../assets/languages/console.svg?inline';
import java from '../assets/languages/java.svg?inline';
import cpp from '../assets/languages/cpp.svg?inline';
import go from '../assets/languages/go.svg?inline';
import rust from '../assets/languages/rust.svg?inline';
import licenseUrl from '../assets/languages/LICENSE?url&no-inline';
import './note-language-icon.css';

// Inline local SVG URLs travel with the JS shell, including its offline cache.
const icons = { document, markdown, typescript, javascript, json, html, css, python, database, yaml, console, java, cpp, go, rust } satisfies Record<NoteLanguageIconName, string>;

export default function NoteLanguageIcon({ note, size = 16 }: { note: Pick<Note, 'language' | 'content'>; size?: number }) {
  return <img className="note-language-icon" src={icons[resolveNoteLanguageIcon(note)]} width={size} height={size} alt="" aria-hidden="true" data-license={licenseUrl} draggable={false}/>;
}
