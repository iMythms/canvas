import { useCallback, useEffect, useRef, useState } from 'react';
import { initialWorkspace, type Workspace } from './workspace';
import { loadWorkspace, saveWorkspace } from './storage';

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [status, setStatus] = useState<'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const current = useRef<Workspace | null>(null);
  const revision = useRef(0);
  const pending = useRef<Workspace | null>(null);
  const running = useRef(false);
  const failed = useRef(false);
  const mounted = useRef(false);

  const drain = useCallback(async () => {
    if (running.current || failed.current) return;
    running.current = true;
    try {
      while (pending.current) {
        const next = pending.current;
        pending.current = null;
        revision.current = await saveWorkspace(next, revision.current);
      }
      if (mounted.current) setStatus('saved');
    } catch (cause) {
      failed.current = true;
      if (mounted.current) { setStatus('error'); setError(cause instanceof Error ? cause.message : 'Could not save your workspace. Export a backup.'); }
    } finally { running.current = false; }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    loadWorkspace().then(result => {
      if (cancelled) return;
      const next = result.workspace ?? initialWorkspace();
      revision.current = result.revision;
      current.current = next;
      setWorkspace(next);
      setStatus(result.workspace ? 'saved' : 'saving');
      if (!result.workspace) { pending.current = next; void drain(); }
    }).catch(cause => {
      if (cancelled) return;
      failed.current = true; setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Could not open browser storage.');
    });
    return () => { cancelled = true; mounted.current = false; };
  }, [drain]);

  const update = useCallback((change: (workspace: Workspace) => Workspace) => {
    if (!current.current) return false;
    const next = change(current.current);
    if (next === current.current) return true;
    if (next.items.length > 2000) { setError('Workspace limit: 2,000 documents. Export a backup before removing documents.'); return false; }
    current.current = next; pending.current = next;
    setWorkspace(next);
    // Keep the visible edits exportable even when storage is full or another tab won.
    if (!failed.current) { setStatus('saving'); void drain(); }
    return true;
  }, [drain]);

  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (running.current || pending.current || failed.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);

  return { workspace, update, status, error };
}
