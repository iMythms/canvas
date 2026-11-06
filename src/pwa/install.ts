export interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export interface RelatedApp { platform?: string; url?: string; id?: string }
export type InstallState = { installed: boolean; pending: boolean; prompt: InstallPrompt | null };

// Do not infer installation from an accepted prompt: installation can still fail.
export function createInstallController(changed: (state: InstallState) => void) {
  let state: InstallState = { installed: false, pending: false, prompt: null };
  let alive = true;
  const publish = (patch: Partial<InstallState>) => {
    state = { ...state, ...patch };
    if (alive) changed(state);
  };
  return {
    capture(event: InstallPrompt) {
      event.preventDefault();
      if (!state.installed) publish({ prompt: event });
    },
    installed() { publish({ installed: true, prompt: null, pending: false }); },
    standalone(value: boolean) {
      if (value) this.installed();
    },
    async request() {
      if (!state.prompt || state.pending || state.installed) return;
      const prompt = state.prompt;
      publish({ prompt: null, pending: true });
      try { await prompt.prompt(); } catch { /* Consumed or unavailable: allow browser menu fallback. */ }
      finally { if (alive) publish({ pending: false }); }
    },
    dispose() { alive = false; },
  };
}

export function isRelatedCanvas(apps: RelatedApp[], origin: string) {
  return apps.some(app => app.platform === 'webapp' && (
    app.id !== undefined && new URL(app.id, origin).href === new URL('/', origin).href
    || app.url !== undefined && new URL(app.url, origin).href === new URL('/manifest.webmanifest', origin).href
  ));
}

export function installInstructions(userAgent: string, touchPoints = 0): string | null {
  const ios = /iPad|iPhone|iPod/.test(userAgent) || /Macintosh/.test(userAgent) && touchPoints > 1;
  if (ios && /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent)) {
    return 'In Safari, tap Share, then Add to Home Screen. Leave Open as Web App enabled if shown, then tap Add.';
  }
  // Safari 17 shipped with Add to Dock on macOS Sonoma. Older versions cannot install.
  if (!ios && /Macintosh/.test(userAgent) && /Version\/(?:1[7-9]|[2-9]\d)[.\d]*.*Safari\//.test(userAgent)) {
    return 'In Safari on macOS Sonoma or later, choose File → Add to Dock, then Add.';
  }
  if (!ios && /(?:Chrome|Chromium|Edg)\//.test(userAgent)) {
    return /Android/.test(userAgent)
      ? 'Open your browser menu and choose Install app or Add to Home screen, then confirm.'
      : 'Use the install icon in the address bar, or open your browser menu and choose Install Canvas. The option appears when this browser allows installation.';
  }
  if (/Android/.test(userAgent) && /Firefox\//.test(userAgent)) return 'Open the Firefox menu, choose Install, then confirm Add to Home screen.';
  return null;
}
