# Canvas

A browser-local developer workspace by **Mytham Jasim**. Keep notes, sketch ideas, compare text, and format JSON in one place, with no account or server sync.

Live app: [canvas.myth.am](https://canvas.myth.am/) · Source: [iMythms/canvas](https://github.com/iMythms/canvas)

## Four tools, one workspace

- **Notes** — a code editor with automatic or manual language selection, syntax colors, font sizing, find and replace, and word wrap. Markdown has independently toggleable edit/read panes. Format JavaScript, TypeScript, JSON, HTML, CSS, Markdown, or YAML locally with **Format** or **Shift + Alt + F**; unsupported languages stay unchanged. Icon actions copy or download the note.
- **Board** — an Excalidraw canvas for diagrams and sketches, with magnetic object alignment. Duplicate selections with `⌘/Ctrl D` and download `.excalidraw` files. Split view is disabled for Board.
- **Compare** — editable original and modified text, split or unified diffs, language selection, and one-click swap.
- **JSON** — validate, format, or minify strict JSON; choose two spaces, four spaces, or tabs, then copy or download the output. Formatting preserves the original numeric tokens, including large integers and exponent notation, as well as string escapes, duplicate keys, and property order.

Search the current mode's documents, pin frequent items, rename them inline, or work in two resizable panes. Appearance settings cover light and dark palettes, typography, and reduced motion. Focus mode hides the surrounding workspace. The sidebar’s collapsed state is shared across modes.

Closing a document keeps it saved under **Closed**; deleting it is a separate action. Double-click a document name or press **F2** to rename it.

## Local data and backups

Documents and appearance settings save automatically to this browser's IndexedDB. Editing and JSON formatting run locally; Canvas has no backend account or document synchronization. Data belongs to the current origin and browser profile, so localhost, another browser, and the hosted site have separate workspaces.

Use **Export workspace** to keep a JSON backup outside the browser, especially before clearing site data or changing devices. Browser storage can be cleared, evicted, or become unavailable; private browsing may discard it when the session ends.

Use **Install app** in the sidebar when offered. Supporting browsers show an installation prompt; others receive platform-specific instructions. The option hides when the browser reports installation or Canvas runs as an installed app. Detection varies by browser. The production service worker caches the app shell and previously loaded local assets for offline use; first visits and uncached tools still need connectivity. Installation does not create a separate backup or synchronize documents.

**Import backup** adds document copies without removing existing documents. Canvas backups also apply their saved appearance settings. Individual document downloads are available from document actions; JSON also offers a separate download of its generated output. If saving fails or another tab changes the workspace, export the current tab's work before reloading.

## Run locally

Use the Node.js version in [`.nvmrc`](.nvmrc) and npm version in [`package.json`](package.json).

```sh
git clone https://github.com/iMythms/canvas.git
cd canvas
npm ci
npm run dev
```

Open the local address printed by the development server (normally `http://127.0.0.1:5173`).

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run typecheck` | Check TypeScript |
| `npm test` | Run the focused Node.js test suite |
| `npm run build` | Type-check and create the production build in `dist/` |
| `npm run preview` | Serve the production build locally |

## Keyboard shortcuts

Use **⌘** on macOS or **Ctrl** elsewhere.

| Action | Shortcut |
| --- | --- |
| Search documents | `⌘/Ctrl K` |
| New document | `⌘/Ctrl N` |
| Close document | `⌘/Ctrl W` |
| Split right / down (except Board) | `⌘/Ctrl D` / `⌘/Ctrl Shift D` |
| Toggle focus mode | `⌘/Ctrl Shift Enter` |
| Export workspace | `⌘/Ctrl S` |
| Switch to Notes / Board / Compare / JSON | `⌘/Ctrl Shift 1–4` |
| Find in editor / editor command palette | `⌘/Ctrl F` / `F1` |
| Format note | `Shift Alt F` |

In Board, `⌘/Ctrl D` duplicates selected elements and workspace split controls are disabled.

Some browsers reserve new and close shortcuts. Use **Alt + Shift + N** or **Alt + Shift + W**, or the on-screen controls, when needed.

## Project guide

Canvas is a React and TypeScript application built with Vite. The shell and document routing live in `src/App.tsx`, tool views in `src/components/`, and workspace validation, persistence, themes, and JSON formatting in `src/lib/`. Editor assets and fonts are bundled locally. The production output is configured for Cloudflare Workers Static Assets.

- [UI and architecture](docs/UI-SYSTEM.md) — navigation, shared controls, persistence, and tool behavior.
- [Testing](docs/TESTING.md) — automated coverage, browser verification, and known limits.
- [Deployment](docs/DEPLOYMENT.md) — build and hosting configuration for `canvas.myth.am`.
- [Dependencies](docs/DEPENDENCIES.md) — dependency audit findings and caveats.

## License and credits

Canvas-authored code is licensed under the [MIT License](LICENSE). Board is powered by [Excalidraw](https://excalidraw.com/). The editor uses Monaco; Notes formatting uses Prettier; icons come from Hugeicons and Material Icon Theme. See [third-party notices](THIRD_PARTY_NOTICES.md) for these and the other libraries, fonts, and their separate license terms.

Inspired by [NotepadXX](https://github.com/almahdi/notepadxx) and [whiteboard.ali.ac](https://whiteboard.ali.ac/).
