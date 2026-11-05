import assert from 'node:assert/strict';
import { test } from 'node:test';
import { defaultAppearance, normalizeAppearance, resolveAppearance, themePresets } from '../src/lib/themes.ts';

test('missing, malformed, and old appearance settings normalize to usable defaults', () => {
  for (const value of [undefined, null, false, 42, 'dark', [], {}]) {
    assert.deepEqual(normalizeAppearance(value), defaultAppearance);
  }
  const old = normalizeAppearance({ mode: 'dark', preset: 'dracula', font: 'serif' });
  assert.deepEqual(old, { ...defaultAppearance, mode: 'dark', preset: 'dracula', font: 'serif' });
  assert.deepEqual(normalizeAppearance({ mode: 'automatic', preset: 'deleted', font: 'external-font', codeFont: 'external-font', reduceMotion: 'true' }), defaultAppearance);
});

test('custom colors accept full hex only, normalize case, and exclude CSS injection', () => {
  const valid = normalizeAppearance({ accent: '#ABCDEF', background: '#123456', foreground: '#000000' });
  assert.equal(valid.accent, '#abcdef');
  assert.equal(valid.background, '#123456');
  assert.equal(valid.foreground, '#000000');
  for (const color of ['red', '#fff', '#12345678', 'url(https://example.com)', '#000000; color:red', 'var(--accent)', '#gggggg', '', 123456]) {
    const result = normalizeAppearance({ accent: color, background: color, foreground: color });
    assert.equal(result.accent, null);
    assert.equal(result.background, null);
    assert.equal(result.foreground, null);
  }
});

test('font sizes are bounded and nonfinite or nonnumeric saved values use defaults', () => {
  assert.deepEqual(
    [normalizeAppearance({ uiFontSize: -100, codeFontSize: 1000 }).uiFontSize, normalizeAppearance({ uiFontSize: -100, codeFontSize: 1000 }).codeFontSize],
    [12, 22],
  );
  const opposite = normalizeAppearance({ uiFontSize: 1000, codeFontSize: -100 });
  assert.equal(opposite.uiFontSize, 20);
  assert.equal(opposite.codeFontSize, 11);
  for (const size of [NaN, Infinity, -Infinity, '16', null]) {
    const appearance = normalizeAppearance({ uiFontSize: size, codeFontSize: size });
    assert.equal(appearance.uiFontSize, defaultAppearance.uiFontSize);
    assert.equal(appearance.codeFontSize, defaultAppearance.codeFontSize);
  }
  assert.equal(normalizeAppearance({ uiFontSize: 15.7 }).uiFontSize, 16);
});

test('system appearance follows system preference while explicit modes remain stable', () => {
  assert.equal(resolveAppearance(defaultAppearance, false).mode, 'light');
  assert.equal(resolveAppearance(defaultAppearance, true).mode, 'dark');
  assert.equal(resolveAppearance({ ...defaultAppearance, mode: 'light' }, true).mode, 'light');
  assert.equal(resolveAppearance({ ...defaultAppearance, mode: 'dark' }, false).mode, 'dark');
});

test('every named preset resolves both palettes to safe colors', () => {
  assert.equal(new Set(themePresets.map(preset => preset.id)).size, themePresets.length);
  for (const preset of themePresets) {
    assert.ok(preset.name.trim());
    for (const mode of ['light', 'dark'] as const) {
      const resolved = resolveAppearance({ ...defaultAppearance, preset: preset.id, mode }, false);
      for (const [key, color] of Object.entries(preset.colors[mode])) {
        assert.equal(resolved[key as keyof typeof preset.colors.light], color);
        assert.match(color, /^#[0-9a-f]{6}$/i);
      }
      assert.ok(resolved.fontFamily.length);
      assert.ok(resolved.codeFontFamily.length);
    }
  }
});

test('custom colors override a preset and produce valid related surfaces without mutating settings', () => {
  const settings = normalizeAppearance({
    ...defaultAppearance, preset: 'github', mode: 'dark', background: '#123456',
    foreground: '#abcdef', accent: '#ff0088', font: 'serif', codeFont: 'menlo',
  });
  const before = structuredClone(settings);
  const resolved = resolveAppearance(settings, false);
  assert.equal(resolved.mode, 'dark');
  assert.equal(resolved.background, '#123456');
  assert.equal(resolved.foreground, '#abcdef');
  assert.equal(resolved.accent, '#ff0088');
  assert.match(resolved.fontFamily, /Georgia/);
  assert.match(resolved.codeFontFamily, /Menlo/);
  for (const key of ['surface', 'sidebar', 'muted', 'border'] as const) assert.match(resolved[key], /^#[0-9a-f]{6}$/);
  assert.notEqual(resolved.surface, resolveAppearance({ ...settings, background: null }, false).surface);
  assert.deepEqual(settings, before);
});
