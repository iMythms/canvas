export type Appearance = {
  mode: 'system' | 'light' | 'dark';
  preset: string;
  accent: string | null;
  background: string | null;
  foreground: string | null;
  font: string;
  codeFont?: string;
  uiFontSize: number;
  codeFontSize: number;
  reduceMotion: boolean;
};

type Palette = {
  accent: string;
  background: string;
  foreground: string;
  surface: string;
  sidebar: string;
  muted: string;
  border: string;
};

export type ResolvedAppearance = Palette & {
  mode: 'light' | 'dark';
  fontFamily: string;
  codeFontFamily: string;
};

export type ThemePreset = {
  id: string;
  name: string;
  colors: { light: Palette; dark: Palette };
};

const palette = (background: string, foreground: string, accent: string, surface: string, sidebar: string, muted: string, border: string): Palette => ({ background, foreground, accent, surface, sidebar, muted, border });

export const themePresets: ThemePreset[] = [
  { id: 'canvas', name: 'Canvas', colors: {
    light: palette('#faf9f6', '#292824', '#b57248', '#ffffff', '#f1f0ec', '#77756e', '#e4e2dc'),
    dark: palette('#20201e', '#ecebe7', '#d8a17b', '#282825', '#1b1b19', '#a4a39a', '#3d3c37'),
  } },
  { id: 'catppuccin', name: 'Catppuccin', colors: {
    light: palette('#eff1f5', '#4c4f69', '#8839ef', '#ffffff', '#e6e9ef', '#6c6f85', '#ccd0da'),
    dark: palette('#1e1e2e', '#cdd6f4', '#cba6f7', '#262637', '#181825', '#a6adc8', '#45475a'),
  } },
  { id: 'dracula', name: 'Dracula', colors: {
    light: palette('#f8f7fc', '#282a36', '#7953c5', '#ffffff', '#eeebf5', '#686477', '#ded9e8'),
    dark: palette('#282a36', '#f8f8f2', '#bd93f9', '#30323f', '#21222c', '#a6a3bb', '#44475a'),
  } },
  { id: 'everforest', name: 'Everforest', colors: {
    light: palette('#fdf6e3', '#5c6a72', '#708a52', '#fffbef', '#f3ead3', '#7a8478', '#e6dec8'),
    dark: palette('#2d353b', '#d3c6aa', '#a7c080', '#343f44', '#272e33', '#9da994', '#475258'),
  } },
  { id: 'github', name: 'GitHub', colors: {
    light: palette('#ffffff', '#1f2328', '#0969da', '#ffffff', '#f6f8fa', '#656d76', '#d0d7de'),
    dark: palette('#0d1117', '#e6edf3', '#58a6ff', '#161b22', '#010409', '#9198a1', '#30363d'),
  } },
  { id: 'gruvbox', name: 'Gruvbox', colors: {
    light: palette('#fbf1c7', '#3c3836', '#af3a03', '#fff5d5', '#f2e5bc', '#7c6f64', '#d5c4a1'),
    dark: palette('#282828', '#ebdbb2', '#fe8019', '#32302f', '#1d2021', '#a89984', '#504945'),
  } },
  { id: 'linear', name: 'Linear', colors: {
    light: palette('#fbfbfc', '#20212a', '#6860d9', '#ffffff', '#f3f3f6', '#777783', '#e6e6eb'),
    dark: palette('#17181c', '#eeeef0', '#9690ff', '#202127', '#121316', '#92939e', '#32333b'),
  } },
  { id: 'raycast', name: 'Raycast', colors: {
    light: palette('#fafafa', '#252525', '#d7443c', '#ffffff', '#f1f1f1', '#737373', '#e3e3e3'),
    dark: palette('#191919', '#f3f3f3', '#ff6b60', '#232323', '#141414', '#a0a0a0', '#373737'),
  } },
  { id: 'ayu', name: 'Ayu', colors: {
    light: palette('#fafafa', '#575f66', '#c17b08', '#ffffff', '#f0f0f0', '#737d87', '#dedfe1'),
    dark: palette('#0b0e14', '#bfbdb6', '#e6b450', '#121720', '#080b10', '#8a919a', '#29303b'),
  } },
];

export const uiFonts = [
  { id: 'system', name: 'Geist', family: '"Geist Variable", sans-serif' },
  { id: 'sans', name: 'Humanist sans', family: 'Avenir, "Avenir Next", "Segoe UI", sans-serif' },
  { id: 'serif', name: 'Classic serif', family: '"Iowan Old Style", "Palatino Linotype", Georgia, serif' },
  { id: 'mono', name: 'Geist Mono', family: '"Geist Mono Variable", monospace' },
];

export const codeFonts = [
  { id: 'mono', name: 'Geist Mono', family: '"Geist Mono Variable", monospace' },
  { id: 'menlo', name: 'Menlo', family: 'Menlo, Monaco, Consolas, monospace' },
  { id: 'courier', name: 'Courier', family: '"Courier New", Courier, monospace' },
];

export const defaultAppearance: Appearance = {
  mode: 'system', preset: 'canvas', accent: null, background: null, foreground: null,
  font: 'system', codeFont: 'mono', uiFontSize: 14, codeFontSize: 13, reduceMotion: false,
};

/** Keep persisted settings safe to use as CSS, including older or partial saves. */
export function normalizeAppearance(value: unknown): Appearance {
  const settings = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const color = (key: string) => typeof settings[key] === 'string' && /^#[\da-f]{6}$/i.test(settings[key] as string) ? (settings[key] as string).toLowerCase() : null;
  const size = (key: string, fallback: number, min: number, max: number) => typeof settings[key] === 'number' && Number.isFinite(settings[key]) ? Math.min(max, Math.max(min, Math.round(settings[key] as number))) : fallback;
  return {
    mode: settings.mode === 'light' || settings.mode === 'dark' ? settings.mode : 'system',
    preset: themePresets.some(item => item.id === settings.preset) ? settings.preset as string : 'canvas',
    accent: color('accent'), background: color('background'), foreground: color('foreground'),
    font: uiFonts.some(item => item.id === settings.font) ? settings.font as string : 'system',
    codeFont: codeFonts.some(item => item.id === settings.codeFont) ? settings.codeFont as string : 'mono',
    uiFontSize: size('uiFontSize', 14, 12, 20), codeFontSize: size('codeFontSize', 13, 11, 22),
    reduceMotion: settings.reduceMotion === true,
  };
}

function blend(hex: string, target: string, amount: number): string {
  const channel = (start: number) => Math.round(parseInt(hex.slice(start, start + 2), 16) * (1 - amount) + parseInt(target.slice(start, start + 2), 16) * amount).toString(16).padStart(2, '0');
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

export function resolveAppearance(value: Appearance, systemDark: boolean): ResolvedAppearance {
  const settings = normalizeAppearance(value);
  const mode = settings.mode === 'system' ? (systemDark ? 'dark' : 'light') : settings.mode;
  const colors = (themePresets.find(item => item.id === settings.preset) ?? themePresets[0]!).colors[mode];
  const background = settings.background ?? colors.background;
  const foreground = settings.foreground ?? colors.foreground;
  // Custom backgrounds also tint adjacent surfaces so the workspace remains cohesive.
  const customSurface = settings.background ? {
    surface: blend(background, foreground, 0.035),
    sidebar: blend(background, foreground, 0.06),
    border: blend(background, foreground, 0.15),
  } : {};
  return {
    ...colors, ...customSurface, mode, background, foreground,
    accent: settings.accent ?? colors.accent,
    muted: settings.foreground || settings.background ? blend(foreground, background, 0.42) : colors.muted,
    fontFamily: (uiFonts.find(item => item.id === settings.font) ?? uiFonts[0]!).family,
    codeFontFamily: (codeFonts.find(item => item.id === settings.codeFont) ?? codeFonts[0]!).family,
  };
}
