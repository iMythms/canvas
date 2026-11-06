import type { Plugin } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

export function pwaBuild(): Plugin {
  let outDir = '';
  return {
    name: 'canvas-pwa',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    async writeBundle(_options, bundle) {
      const shell = new Set(['/', '/manifest.webmanifest', '/favicon.svg', '/icons/canvas-192.png', '/icons/canvas-512.png', '/icons/canvas-180.png']);
      const visit = (name: string) => {
        if (shell.has(`/${name}`)) return;
        const chunk = bundle[name];
        if (!chunk || chunk.type !== 'chunk') return;
        shell.add(`/${name}`);
        for (const dependency of chunk.imports) visit(dependency);
      };
      for (const [name, item] of Object.entries(bundle)) {
        if (item.type === 'chunk' && item.isEntry) visit(name);
        if (item.type === 'asset' && name.endsWith('.css')) shell.add(`/${name}`);
      }
      const hash = createHash('sha256');
      for (const path of [...shell].sort()) hash.update(await readFile(resolve(outDir, path === '/' ? 'index.html' : path.slice(1))));
      const template = await readFile(new URL('./service-worker.js', import.meta.url), 'utf8');
      hash.update(template);
      const source = template.replace('__VERSION__', hash.digest('hex').slice(0, 16)).replace('__SHELL__', JSON.stringify([...shell]));
      await writeFile(resolve(outDir, 'sw.js'), source);
    },
  };
}
