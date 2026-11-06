import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInstallController, installInstructions, isRelatedCanvas, type InstallPrompt, type InstallState } from '../src/pwa/install.ts';

function setup() {
  let state: InstallState | undefined;
  const control = createInstallController(next => { state = next; });
  return { control, state: () => state! };
}
function prompt(outcome: 'accepted' | 'dismissed', calls: string[]): InstallPrompt {
  return Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: async () => { calls.push('prompt'); return { outcome }; } });
}
for (const outcome of ['accepted', 'dismissed'] as const) {
  test(`${outcome} consumes the event once without claiming installation`, async () => {
    const { control, state } = setup();
    const calls: string[] = [];
    const event = prompt(outcome, calls);
    control.capture(event);
    assert.equal(event.defaultPrevented, true);
    assert.deepEqual(calls, []);
    await Promise.all([control.request(), control.request()]);
    assert.deepEqual(calls, ['prompt']);
    assert.equal(state().installed, false);
    assert.equal(state().pending, false);
    assert.equal(state().prompt, null);
    control.capture(prompt(outcome, calls));
    assert.ok(state().prompt);
  });
}
test('appinstalled and standalone hide and discard prompts', async () => {
  for (const standalone of [true, false]) {
    const { control, state } = setup();
    const calls: string[] = [];
    control.capture(prompt('accepted', calls));
    if (standalone) control.standalone(true); else control.installed();
    control.capture(prompt('accepted', calls));
    await control.request();
    assert.equal(state().installed, true);
    assert.equal(state().prompt, null);
    assert.deepEqual(calls, []);
  }
});
test('failed prompt permits a later browser event and teardown suppresses callbacks', async () => {
  const { control, state } = setup();
  control.capture(Object.assign(new Event('beforeinstallprompt'), { prompt: async () => { throw new Error('unavailable'); } }));
  await control.request();
  assert.equal(state().pending, false);
  assert.equal(state().installed, false);
  const before = state();
  control.dispose();
  control.installed();
  assert.equal(state(), before);
});
test('only the configured same-origin web app counts as related installation', () => {
  const origin = 'https://canvas.myth.am';
  assert.ok(isRelatedCanvas([{ platform: 'webapp', id: origin + '/' }], origin));
  assert.ok(isRelatedCanvas([{ platform: 'webapp', url: '/manifest.webmanifest' }], origin));
  assert.equal(isRelatedCanvas([{ platform: 'webapp', url: 'https://elsewhere.test/manifest.webmanifest' }], origin), false);
  assert.equal(isRelatedCanvas([{ platform: 'play', id: origin + '/' }], origin), false);
  assert.equal(isRelatedCanvas([], origin), false);
});
test('manual installation instructions target supporting platforms only', () => {
  assert.match(installInstructions('iPhone Version/18.0 Mobile Safari/604.1')!, /Home Screen/);
  assert.match(installInstructions('Macintosh Version/18.0 Safari/605.1', 5)!, /Home Screen/);
  assert.match(installInstructions('Macintosh Version/17.0 Safari/605.1')!, /Add to Dock/);
  assert.equal(installInstructions('Macintosh Version/16.0 Safari/605.1'), null);
  assert.equal(installInstructions('iPhone CriOS/130 Mobile Safari/604.1'), null);
  assert.equal(installInstructions('Windows Firefox/130'), null);
  assert.match(installInstructions('Android Firefox/130')!, /Firefox/);
  assert.match(installInstructions('Windows Chrome/140 Safari/537.36')!, /address bar/);
});
