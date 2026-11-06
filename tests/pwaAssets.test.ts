import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
test('manifest has stable application identity, standalone launch and self relationship', () => {
  assert.equal(manifest.id, '/');
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const canonical = /rel="canonical" href="([^"]+)"/.exec(html)![1];
  assert.equal(manifest.related_applications[0].id, canonical);
  assert.equal(manifest.related_applications[0].url, '/manifest.webmanifest');
  assert.match(html, /rel="manifest" href="\/manifest.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon" sizes="180x180"/);
});
test('manifest and Apple icons are PNG files with exact declared dimensions', () => {
  for (const size of [180, 192, 512]) {
    const png = readFileSync(new URL(`../public/icons/canvas-${size}.png`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    if (size !== 180) assert.ok(manifest.icons.some((icon: {src: string; sizes: string; type: string}) => icon.src === `/icons/canvas-${size}.png` && icon.sizes === `${size}x${size}` && icon.type === 'image/png'));
  }
});
