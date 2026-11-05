# Testing Canvas

Run the data-integrity regression suite with:

```sh
npm test
```

The tests use Node's built-in test runner and TypeScript stripping. They import
only the workspace and theme modules, so they do not start Vite, render React,
or load Monaco or Excalidraw. No test dependencies are required.

Coverage includes Canvas backup round trips for notes, boards, image assets,
comparisons and appearance; malformed backup rejection before merging; duplicate
IDs and parser limits; legacy NotepadXX import/migration; preservation of
existing work and ID renewal during merges; selection recovery; and safe theme
normalization. The pure JSON formatter module has eight tests covering nested
formatting, indentation, scalar values, string escapes, large and unusual number
literals, duplicate keys, invalid JSON and available error locations, plus
idempotence on deeply nested input. In particular, `9007199254740993` is kept
exactly as written.

The latest recorded run passed all 45 tests. `npm run build` also passed after
the preview and icon changes; Vite reported the existing large Monaco chunk
warning.

### Browser observations so far

Observed in the in-app browser (IAB): a note survives reload; closing and
reopening it from the sidebar preserves the document and pin; sidebar inline
rename commits with Enter; the document-list disclosure can close and reopen
without losing documents. Pinned documents appear in a pinned section with a
divider. A source row stays highlighted while its preview is open, without
changing `aria-current`. ArrowRight enters preview and Escape dismisses it and
returns focus. The preview fits a 390 px viewport (x=94, width=288, right=382),
and the board toolbar fits (x=67.5, width=255). `Cmd+D` (split right),
`Cmd+Shift+D` (split down), and the `Alt+Shift+N/W` fallback shortcuts respond.
Per-mode sidebar collapse survives reload. In Formatter, format and minify
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
