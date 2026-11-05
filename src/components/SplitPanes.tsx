import { useState, type ReactNode, type CSSProperties, type PointerEvent } from 'react';
import '../split.css';

export type SplitDirection = 'vertical' | 'horizontal';
export default function SplitPanes({ direction, first, second, activePane, onActivate }: {
  direction: SplitDirection;
  first: ReactNode;
  second: ReactNode;
  activePane: 'primary' | 'secondary';
  onActivate: (pane: 'primary' | 'secondary') => void;
}) {
  const [ratio, setRatio] = useState(50);
  const resize = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.parentElement!.getBoundingClientRect();
    const position = direction === 'vertical' ? (event.clientX - bounds.left) / bounds.width : (event.clientY - bounds.top) / bounds.height;
    setRatio(Math.min(80, Math.max(20, position * 100)));
  };
  return <div className={`split-panes split-${direction}`} style={{ '--split-ratio': `${ratio}%` } as CSSProperties}>
    <section data-workspace-pane="primary" className={`work-pane ${activePane === 'primary' ? 'pane-active' : ''}`} aria-label="First pane" onPointerDownCapture={() => onActivate('primary')} onFocusCapture={() => onActivate('primary')}>{first}</section>
    <div className="pane-divider" role="separator" aria-label="Resize panes" aria-orientation={direction} aria-valuemin={20} aria-valuemax={80} aria-valuenow={Math.round(ratio)} tabIndex={0}
      onDoubleClick={() => setRatio(50)} onPointerDown={event => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={resize} onPointerUp={event => event.currentTarget.releasePointerCapture(event.pointerId)}
      onKeyDown={event => {
        const backward = direction === 'vertical' ? 'ArrowLeft' : 'ArrowUp';
        const forward = direction === 'vertical' ? 'ArrowRight' : 'ArrowDown';
        if (event.key === backward || event.key === forward) { event.preventDefault(); setRatio(value => Math.min(80, Math.max(20, value + (event.key === forward ? 5 : -5)))); }
        if (event.key === 'Home') { event.preventDefault(); setRatio(50); }
      }}/>
    <section data-workspace-pane="secondary" className={`work-pane ${activePane === 'secondary' ? 'pane-active' : ''}`} aria-label="Second pane" onPointerDownCapture={() => onActivate('secondary')} onFocusCapture={() => onActivate('secondary')}>{second}</section>
  </div>;
}
