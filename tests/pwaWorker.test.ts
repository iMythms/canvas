import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function worker() {
  const handlers: Record<string, (event: any) => void> = {};
  const stored = new Map<string, Response>();
  const deleted: string[] = [];
  const network: string[] = [];
  let failNetwork = false;
  const cache = {
    async addAll(paths: string[]) { for (const path of paths) stored.set(new URL(path, 'https://canvas.test').href, new Response('cached:' + path)); },
    async match(request: string | { url: string }) { return stored.get(typeof request === 'string' ? request : request.url); },
    async put(request: { url: string }, response: Response) { stored.set(request.url, response); },
  };
  const source = readFileSync(new URL('../scripts/service-worker.js', import.meta.url), 'utf8')
    .replace('__VERSION__', 'test').replace('__SHELL__', JSON.stringify(['/', '/assets/app.js']));
  vm.runInNewContext(source, {
    self: { location: new URL('https://canvas.test/sw.js'), addEventListener(name: string, fn: any) { handlers[name] = fn; } },
    URL,
    caches: { open: async () => cache, keys: async () => ['canvas-shell-old', 'canvas-shell-test', 'other-app'], delete: async (key: string) => { deleted.push(key); } },
    fetch: async (request: { url: string }) => { network.push(request.url); if (failNetwork) throw new Error('offline'); return { ok: true, type: 'basic', clone: () => new Response('network') }; },
  });
  return { handlers, stored, deleted, network, offline() { failNetwork = true; } };
}
test('worker installs shell and removes only its own old asset caches', async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.handlers.install({ waitUntil(value: Promise<unknown>) { pending = value; } });
  await pending;
  assert.ok(w.stored.has('https://canvas.test/'));
  w.handlers.activate({ waitUntil(value: Promise<unknown>) { pending = value; } });
  await pending;
  assert.deepEqual(w.deleted, ['canvas-shell-old']);
});
test('offline root uses matching cached shell; workspace and external requests are untouched', async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.handlers.install({ waitUntil(value: Promise<unknown>) { pending = value; } });
  await pending;
  w.offline();
  let response: Promise<Response> | undefined;
  const dispatch = (url: string, mode = 'cors', method = 'GET') => {
    response = undefined;
    w.handlers.fetch({ request: { url, mode, method }, respondWith(value: Promise<Response>) { response = value; }, waitUntil() {} });
    return response;
  };
  assert.equal(await (await dispatch('https://canvas.test/?note=1', 'navigate'))!.text(), 'cached:/');
  assert.equal(await (await dispatch('https://canvas.test/assets/app.js'))!.text(), 'cached:/assets/app.js');
  assert.equal(dispatch('https://canvas.test/api/workspace'), undefined);
  assert.equal(dispatch('https://canvas.test/assets/app.js', 'cors', 'POST'), undefined);
  assert.equal(dispatch('https://external.test/assets/app.js'), undefined);
  assert.equal(dispatch('https://canvas.test/other-page', 'navigate'), undefined);
  assert.deepEqual(w.network, []);
});
test('service worker never forces activation or touches browser workspace databases', () => {
  const source = readFileSync(new URL('../scripts/service-worker.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /self\.skipWaiting\s*\(|clients\.claim\s*\(|indexedDB|\.reload\s*\(/);
});
