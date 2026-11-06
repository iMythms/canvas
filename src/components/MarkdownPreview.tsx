import { Fragment, createElement, useEffect, useState, type ReactNode } from 'react';
import { inlineKind, parseMarkdown, safeLink } from '../lib/markdown';
import { createSyntaxRules } from '../lib/syntaxPalette';
import type { EditorAppearance } from '../lib/monaco';
import '../markdown.css';
import '../markdown-content.css';

function inline(text: string): ReactNode[] {
  return text.split(/( {2,}\n|\\\n|\n)/).flatMap<ReactNode>((part, index) => {
    if (/^(?: {2,}|\\)\n$/.test(part)) return [<br key={`break-${index}`} />];
    if (part === '\n') return [' '];
    return inlineSpan(part).map((node, i) => <Fragment key={`${index}-${i}`}>{node}</Fragment>);
  });
}

function inlineSpan(text: string): ReactNode[] {
  const pattern = /(`[^`\n]+`|\[[^\]\n]+\]\([^\s)]+\)|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
  return text.split(pattern).map((part, index) => {
    if (inlineKind(part) === 'code') return <code key={index}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) { const href = safeLink(link[2]); return href ? <a key={index} href={href} target="_blank" rel="noopener noreferrer">{link[1]}</a> : <Fragment key={index}>{part}</Fragment>; }
    if (inlineKind(part) === 'strong') return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (inlineKind(part) === 'em') return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

const aliases: Record<string, string> = { js: 'javascript', ts: 'typescript', py: 'python', sh: 'shell', bash: 'shell', yml: 'yaml', 'c++': 'cpp', 'cxx': 'cpp', htm: 'html' };
type Appearance = EditorAppearance & { mode: 'light' | 'dark' };
type ColoredToken = { text: string; color?: string; fontStyle?: string };

function CodeFence({ text, language, appearance }: { text: string; language: string; appearance: Appearance }) {
  const [lines, setLines] = useState<ColoredToken[][] | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLines(null);
    const id = aliases[language.toLowerCase()] ?? language.toLowerCase();
    if (!id || id === 'plaintext') return () => { cancelled = true; };
    void import('../lib/monaco').then(async () => {
      const monaco = await import('monaco-editor/editor/editor.api.js');
      if (!monaco.languages.getLanguages().some(item => item.id === id)) return;
      // colorize waits for lazy Monarch grammars; its HTML is never rendered.
      await monaco.editor.colorize(text, id, {});
      const rules = createSyntaxRules(appearance.mode, appearance.background, appearance.foreground);
      const sourceLines = text.split('\n');
      const result = monaco.editor.tokenize(text, id).map((tokens, i) => tokens.map((token, j) => {
        const rule = rules.filter(item => item.token && (token.type === item.token || token.type.startsWith(item.token + '.'))).sort((a, b) => b.token.length - a.token.length)[0];
        return { text: sourceLines[i].slice(token.offset, tokens[j + 1]?.offset), color: rule?.foreground ? `#${rule.foreground}` : undefined, fontStyle: rule?.fontStyle };
      }));
      if (!cancelled) setLines(result);
    }).catch(() => { /* Keep the escaped plain-text fallback. */ });
    return () => { cancelled = true; };
  }, [text, language, appearance.mode, appearance.background, appearance.foreground]);
  return <pre><code>{lines ? lines.map((line, i) => <Fragment key={i}>{i > 0 && '\n'}{line.map((token, j) => <span key={j} style={{ color: token.color, fontStyle: token.fontStyle === 'italic' ? 'italic' : undefined, fontWeight: token.fontStyle === 'bold' ? 'bold' : undefined }}>{token.text}</span>)}</Fragment>) : text}</code></pre>;
}

export default function MarkdownPreview({ content, appearance }: { content: string; appearance: Appearance }) {
  return <article className="markdown-page">{parseMarkdown(content).map((block, index) => {
    if (block.type === 'rule') return <hr key={index}/>;
    if (block.type === 'metadata') return <div className="markdown-table markdown-metadata" key={index}><table><tbody>{block.entries.map(([name, value], i) => <tr key={i}><th scope="row">{name}</th><td>{value}</td></tr>)}</tbody></table></div>;
    if (block.type === 'heading') return createElement(`h${block.level}`, { key: index }, inline(block.text));
    if (block.type === 'code') return <CodeFence key={index} text={block.text} language={block.language} appearance={appearance}/>;
    if (block.type === 'quote') return <blockquote key={index}>{inline(block.text)}</blockquote>;
    if (block.type === 'list') { const children = block.items.map((item, i) => <li key={i}>{inline(item)}</li>); return block.ordered ? <ol key={index}>{children}</ol> : <ul key={index}>{children}</ul>; }
    if (block.type === 'table') return <div className="markdown-table" key={index}><table><thead><tr>{block.header.map((cell, i) => <th key={i}>{inline(cell)}</th>)}</tr></thead><tbody>{block.rows.map((row, i) => <tr key={i}>{block.header.map((_, j) => <td key={j}>{inline(row[j] ?? '')}</td>)}</tr>)}</tbody></table></div>;
    return <p key={index}>{inline(block.text)}</p>;
  })}</article>;
}
