// A transparent scene lets the surrounding app palette show through, including
// in dark mode where Excalidraw filters the rendered canvas.
export const THEME_BOARD_BACKGROUND = 'transparent';

export type BoardBackgroundMode = 'theme' | 'custom';

export function initialBoardBackground(savedColor?: string, mode?: BoardBackgroundMode): string {
  if (mode === 'theme' || savedColor == null) return THEME_BOARD_BACKGROUND;
  // Older scenes did not record intent. Treat Excalidraw's default white as
  // the theme; explicitly chosen white is distinguishable once marked custom.
  if (!mode && ['#fff', '#ffffff'].includes(savedColor.trim().toLowerCase())) return THEME_BOARD_BACKGROUND;
  return savedColor;
}

export function boardBackgroundMode(color: string): BoardBackgroundMode {
  return color === THEME_BOARD_BACKGROUND ? 'theme' : 'custom';
}
