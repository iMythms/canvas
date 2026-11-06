import { cp, mkdir, readFile, readdir } from 'node:fs/promises';

const excalidraw = JSON.parse(await readFile('node_modules/@excalidraw/excalidraw/package.json', 'utf8'));
if (excalidraw.version !== '0.18.1') {
  throw new Error('Review the bundled font licenses before updating Excalidraw beyond 0.18.1.');
}

await mkdir('public/fonts', { recursive: true });
await cp('node_modules/@excalidraw/excalidraw/dist/prod/fonts', 'public/fonts', { recursive: true });

// Keep each font's notice with its assets in Vite's public/build output.
for (const family of await readdir('node_modules/@excalidraw/excalidraw/dist/prod/fonts')) {
  await cp(`licenses/font-${family.toLowerCase()}.txt`, `public/fonts/${family}/LICENSE.txt`);
}
await cp('licenses/font-liberation-source.tar.gz', 'public/fonts/Liberation/source.tar.gz');
