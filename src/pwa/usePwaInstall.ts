import { useEffect, useState } from 'react';
import { createInstallController, installInstructions, isRelatedCanvas, type InstallPrompt, type InstallState, type RelatedApp } from './install';

export function usePwaInstall() {
  const [state, setState] = useState<InstallState>({ installed: false, pending: false, prompt: null });
  const [controller, setController] = useState<ReturnType<typeof createInstallController> | null>(null);
  useEffect(() => {
    const control = createInstallController(setState);
    setController(control);
    const standalone = matchMedia('(display-mode: standalone)');
    const minimal = matchMedia('(display-mode: minimal-ui)');
    const check = () => control.standalone(standalone.matches || minimal.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const capture = (event: Event) => control.capture(event as InstallPrompt);
    const installed = () => control.installed();
    const related = async () => {
      check();
      try {
        const apps = await (navigator as Navigator & { getInstalledRelatedApps?: () => Promise<RelatedApp[]> }).getInstalledRelatedApps?.();
        if (apps && isRelatedCanvas(apps, location.origin)) control.installed();
      } catch { /* Optional API: no installation inference on failure. */ }
    };
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', installed);
    window.addEventListener('focus', related);
    for (const media of [standalone, minimal]) media.addEventListener('change', check);
    void related();
    if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(error => console.warn('Canvas offline cache unavailable:', error));
    }
    return () => {
      control.dispose();
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('focus', related);
      for (const media of [standalone, minimal]) media.removeEventListener('change', check);
    };
  }, []);
  const instructions = window.isSecureContext ? installInstructions(navigator.userAgent, navigator.maxTouchPoints) : null;
  return { visible: window.isSecureContext && !state.installed && Boolean(state.prompt || instructions), pending: state.pending,
    instructions, canPrompt: Boolean(state.prompt), request: () => controller?.request() };
}
