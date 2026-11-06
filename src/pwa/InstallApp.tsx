import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowDownToLine } from '../components/icons';
import { Button } from '../components/ui';
import type { usePwaInstall } from './usePwaInstall';

export default function InstallApp({ install, compact = false }: { install: ReturnType<typeof usePwaInstall>; compact?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && install.visible) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open, install.visible]);
  if (!install.visible) return null;
  return <>
    <Button ref={trigger} size={compact ? 'icon' : undefined} className={compact ? undefined : 'sidebar-action'} aria-label="Install app" title="Install app" disabled={install.pending} onClick={() => {
      if (install.canPrompt) void install.request(); else setOpen(true);
    }}><ArrowDownToLine size={compact ? 19 : 16}/>{!compact && 'Install app'}</Button>
    {createPortal(<dialog ref={dialog} className="canvas-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-instructions`} onCancel={() => setOpen(false)} onClose={() => { setOpen(false); trigger.current?.focus(); }}>
      <h2 id={`${id}-title`}>Install Canvas</h2>
      <p id={`${id}-instructions`}>{install.instructions}</p>
      <p>Canvas opens in its own window. Your workspace stays in this browser; export a backup before switching browsers or devices. Offline use depends on which tools have been cached.</p>
      <div className="dialog-actions"><Button className="primary-button" onClick={() => setOpen(false)}>Got it</Button></div>
    </dialog>, document.body)}
  </>;
}
