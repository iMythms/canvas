import { Fragment } from 'react';

function inline(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('`') ? <code key={index}>{part.slice(1, -1)}</code> : part.startsWith('**') ? <strong key={index}>{part.slice(2, -2)}</strong> : <Fragment key={index}>{part}</Fragment>);
}

/** A deliberately small, safe reading view; source HTML is always plain text. */
export default function MarkdownPreview({ content }: { content: string }) {
  const blocks = content.split(/\n\s*\n/);
  return <article className="reading-page">{blocks.map((block, index) => {
    if (block.startsWith('### ')) return <h3 key={index}>{inline(block.slice(4))}</h3>;
    if (block.startsWith('## ')) return <h2 key={index}>{inline(block.slice(3))}</h2>;
    if (block.startsWith('# ')) return <h1 key={index}>{inline(block.slice(2))}</h1>;
    if (block.startsWith('```')) return <pre key={index}><code>{block.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '')}</code></pre>;
    if (block.split('\n').every(line => /^[-*] /.test(line))) return <ul key={index}>{block.split('\n').map((line, i) => <li key={i}>{inline(line.slice(2))}</li>)}</ul>;
    return <p key={index}>{inline(block)}</p>;
  })}</article>;
}
