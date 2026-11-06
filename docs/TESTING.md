# Testing Canvas

Run the data-integrity regression suite with:

```sh
npm test
```

The tests use Node's built-in test runner and TypeScript stripping. They cover
workspace/theme logic, Markdown, language detection, formatting, syntax token
colors, and PWA helpers. Token tests load Monaco's actual language grammars;
the suite does not start Vite or render React/Excalidraw. No test framework
dependency is required.

Coverage includes Canvas backup round trips for notes, boards, image assets,
comparisons and appearance; malformed backup rejection before merging; duplicate
IDs and parser limits; legacy NotepadXX import/migration; preservation of
existing work and ID renewal during merges; selection recovery; and safe theme
normalization. The pure JSON formatter module has eight tests covering nested
formatting, indentation, scalar values, string escapes, large and unusual number
literals, duplicate keys, invalid JSON and available error locations, plus
idempotence on deeply nested input. In particular, `9007199254740993` is kept
exactly as written.

The 2026-11-05 run passed all 45 tests. `npm run build` also passed after
the preview and icon changes; Vite reported the existing large Monaco chunk
warning.

### Refinement checks (2026-11-06)

`npm test` passed 79/79; `npm run typecheck`, `npm run build`, and
`git diff --check` passed. The existing large Monaco chunk warning remains.
Coverage now includes actual token colors across all 14 syntax languages,
seven formatting languages, punctuation-aware cursor mapping, JSON string
whitespace, stale snapshots, Markdown escaping/frontmatter, and PWA lifecycle
and shell-cache behavior.

Isolated local previews verified the following:

- Notes Format button and Shift+Alt+F both format code. Keyboard undo/redo restore
  content and backward selections. An intervening edit prevents a pending
  formatting result from overwriting it; parser errors leave the note intact.
- Markdown renders metadata, flowing paragraphs, headings, lists, tables,
  links and colored fences. Both panes close and reopen while one stays visible.
  The font selector updates editor/preview text, and its value survives reload.
- Delegate browser checks covered 1280px, 390px, 320px and a 160px Compare pane;
  compact board menus, direct tools, built-in font layout, pointer/keyboard
  focus, search navigation, native double-click editing and synthetic touch
  double-tap. Canvas zoom moved 100% to 110% while browser scale stayed 1.
- An isolated production preview verified service worker registration/cache,
  install dialog focus, simulated dismissal/installation, and offline reload
  of the previously loaded editor. All 13 shell asset references resolved and
  `node --check dist/sw.js` passed.

No actual OS installation or physical iOS zoom behavior was verified. Install
detection is browser-dependent, and uncached tools may require connectivity.
The custom Markdown renderer covers common constructs, not full CommonMark;
syntax colors are lexical rather than semantic. External Xiaolai fallback-font
requests were blocked by CSP during board checks. Production deployment of
these refinements has not been verified.

### Board and sidebar follow-up (2026-11-06)

Integrated checks passed: `npm test` (80/80), `npm run typecheck`,
`npm run build`, and `git diff --check`. The subsequent toolbar icon/order edit
also passed `npm run build` (including typecheck) and `git diff --check`.

- Root's isolated preview verified Cmd+D duplicates Board elements without a
  workspace split, disabled Board split controls, visible edge/center snapping,
  snap-off persistence after reload, and Fit drawing bringing content into view.
  Notes Cmd+D still splits.
- Delegate previews verified aligned properties controls and internal scrolling
  at 320px, 390px, 768px, desktop and short landscape in light/dark themes.
  Mobile bars are 54px tall with 44px targets; all 15 toolbar controls remain
  reachable by scrolling and keyboard navigation.
- The collapsed rail filters open documents to the current mode, preserves
  pinned-first ordering, switches between distinct Boards, and excludes closed
  documents. Topbar mode switching and reopening closed documents were checked.
- The final shape grouping and PenTool01Icon/eraser glyphs were checked at
  1280×800 and 390×844; the toolbar remains one row with horizontal scrolling.

Owned preview tabs and isolated servers were closed. Physical-device touch and
Safari scrolling remain unverified. No sync/authentication services were added;
sync was deferred by the user. Installed-icon theme switching was researched but
not implemented because authored light/dark variants lack a supported PWA path.

### Shared sidebar, Notes actions and icons (2026-11-06)

`npm test` passed 88/88; `npm run build` (including typecheck) and
`git diff --check` passed. New cases cover shared sidebar state and legacy
migration, Notes download extensions, and Auto/manual icon coverage for all
15 languages, including fallback and local asset validation.

Root's isolated 5192 preview verified collapsed and expanded state across all
four modes and collapsed persistence after reload. Auto Markdown and manually
selected Python produced distinct local icons; the collapsed rail used the same
Python icon. Copy and Download have no visible labels, retain accessible names,
and fit in one scrolling row at 390px. Read-only Markdown retained both actions;
a downloaded `.md` file matched the note bytes exactly, and manual Python used
`.py`. Simulated clipboard success copied the exact content and simulated denial
produced failure feedback. Actual OS clipboard permissions were not tested.
Owned tab/server closed; user workspace data was not changed.

### Earlier browser observations (2026-11-05)

Observed in the in-app browser (IAB): a note survives reload; closing and
reopening it from the sidebar preserves the document and pin; sidebar inline
rename commits with Enter; the document-list disclosure can close and reopen
without losing documents. Pinned documents appear in a pinned section with a
divider. A source row stays highlighted while its preview is open, without
changing `aria-current`. ArrowRight enters preview and Escape dismisses it and
returns focus. The preview fits a 390 px viewport (x=94, width=288, right=382),
and the board toolbar fits (x=67.5, width=255). `Cmd+D` (split right),
`Cmd+Shift+D` (split down), and the `Alt+Shift+N/W` fallback shortcuts respond.
Per-mode sidebar collapse survives reload. In JSON, format and minify
preserve the exact numeric token `9007199254740993`; a valid draft survives
reload and Download exports `formatted.json` with that token intact. Invalid
JSON clears the output and disables copy and download, with the observed error
positioned at line 1, column 11. Compare panes remain editable, can be swapped,
and the selected layout survives reload. Board theme backgrounds were observed
to match the app tokens. Clearing a custom board background through the app's
custom dialog retains the theme, and Undo restores the QA rectangle.

The final observed browser console contained only older entries timestamped at
or before 10:28:49 UTC; no newer errors were observed after the fix.

These are focused observations, not a complete browser test matrix. IndexedDB
quota/failure and multi-tab conflict handling have not been exercised here. The
pure-module tests do not exercise browser rendering or those flows.

Latest release checks (2026-11-05): `npm test` passed 45/45 and `npm run build` passed. Board Help now uses Canvas theme tokens, a visible Hugeicons close control, and accurate alternatives for workspace-owned shortcuts. Browser checks confirmed that Cmd+D does not split behind Help, Close help dismisses it, and pointer previews dismiss after leaving even after Pin is clicked.

### Production checks (2026-11-05)

Read-only HTTPS checks at `https://canvas.myth.am/` passed: valid TLS, 200 HTML,
canonical/OG/Twitter URLs, all four security headers from `public/_headers`, and
a 200 PNG sharing image with actual dimensions 1200 by 630. All 177 JavaScript
files, four stylesheets and 250 fonts returned 200 with expected MIME types and
SHA-256 hashes matching `dist`. The sitemap matched the build; `/index.html`
redirected to `/`. Public DNS resolved, although the local resolver initially
cached NXDOMAIN, so these checks used the public DNS address with hostname and
TLS verification preserved.

Production browser checks confirmed note persistence after reload, Board Help
close, JSON format/minify preserving `9007199254740993`, and Compare split
and unified views reporting one change. No console errors were observed. The
temporary note content was cleared after checking persistence.

Cloudflare initially prepended 130 lines of managed content to `robots.txt`;
the original wildcard `Allow: /` and sitemap remained. The added rules block
named crawlers including Google-Extended, GoogleOther and GPTBot, but do not
block Googlebot. Ordinary search crawling remains allowed by these rules;
actual search indexing was not verified.

Browser-style HTML requests also revealed automatic Cloudflare analytics
injection, blocked by the existing CSP. Added `no-transform` to Workers' default
`Cache-Control: public, max-age=0, must-revalidate` policy in `public/_headers`.
Cloudflare documents this response-level injection opt-out in its
[Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/);
the cache defaults and header override are documented under
[Workers static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/).
`npm run build`, `cmp public/_headers dist/_headers`, and `git diff --check`
passed. Production verification passed after GitHub-triggered deployment: browser-style Accept and User-Agent requests returned HTTPS 200, the no-transform header, and no injected analytics beacon. The deployed browser reloaded successfully with no console errors.
