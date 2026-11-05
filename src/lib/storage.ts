import { parseWorkspace, type Workspace } from './workspace.ts';

const DATABASE = 'canvas-workspace';
const STORE = 'workspace';
type RecordData = { id: 'main'; revision: number; workspace: Workspace };
let opening: Promise<IDBDatabase> | undefined;

function openDatabase(): Promise<IDBDatabase> {
  if (!opening) opening = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); opening = undefined; };
      resolve(db);
    };
    request.onerror = () => { opening = undefined; reject(request.error ?? new Error('Browser storage is unavailable.')); };
    request.onblocked = () => { opening = undefined; reject(new Error('Close other Canvas tabs to open storage.')); };
  });
  return opening;
}

export async function loadWorkspace(): Promise<{ workspace: Workspace | null; revision: number }> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get('main');
    request.onsuccess = () => {
      try {
        const record = request.result as RecordData | undefined;
        resolve({ workspace: record ? parseWorkspace(record.workspace) : null, revision: record?.revision ?? 0 });
      } catch (error) { reject(error); }
    };
    request.onerror = () => reject(request.error);
  });
}

/** Compare-and-swap avoids silently overwriting edits from another tab. */
export async function saveWorkspace(workspace: Workspace, expectedRevision: number): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    const store = transaction.objectStore(STORE);
    let conflict = false;
    const request = store.get('main');
    request.onsuccess = () => {
      const revision = (request.result as RecordData | undefined)?.revision ?? 0;
      if (revision !== expectedRevision) { conflict = true; transaction.abort(); return; }
      store.put({ id: 'main', revision: revision + 1, workspace } satisfies RecordData);
    };
    transaction.oncomplete = () => resolve(expectedRevision + 1);
    transaction.onabort = () => reject(new Error(conflict ? 'This workspace changed in another tab. Export your work here, then reload to use the saved version.' : 'Your changes could not be saved. Export a backup before closing this tab.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('Browser storage is full or unavailable. Export a backup.'));
  });
}

export function downloadFile(name: string, content: string, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
