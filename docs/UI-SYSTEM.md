# Canvas UI system

## Workspace and navigation

Canvas has four modes: **Notes**, **Board**, **Compare**, and **JSON**. The mode switcher selects the document type shown in the sidebar and workspace. Notes use Monaco for plain text and supported languages, with a Markdown read view; choose the code language from the note toolbar. Board embeds Excalidraw. Compare uses Monaco's side-by-side diff editor. JSON has source and output panes for strict JSON.

The sidebar contains search, the current mode's document list, create actions, appearance, file open, backup import/export, and help. Search matches names and note/JSON content. Select a document in the sidebar to open it. Double-click its name or press F2 to rename inline. Pinned documents are grouped above the remaining documents, separated by a divider. Hovering or focusing a row reveals its preview and actions; opening a preview keeps the source row highlighted without marking it as the current document. ArrowRight enters a preview and Escape dismisses it and returns focus. Closing a document removes it from the open workspace but preserves its saved content and pin; closing the document-list disclosure only hides the list, and reopening it retains the documents. Delete is a separate document action. The sidebar can be fully hidden in **Focus mode**, which maximizes the workspace, or collapsed to a shortcut rail. The collapsed rail retains mode selection, search, new document, appearance, and help. Collapse state is remembered per mode; focus hides the surrounding shell.

Pinning and document actions are available in the top bar next to the split controls. The workspace can show two panes arranged side-by-side or stacked; the divider can be dragged, adjusted with arrow keys, and reset by double-clicking. The split and divider ratio live in component state for the current session; they are not persisted.

## Shared controls and visual language

`src/components/ui.tsx` provides shared buttons, inputs, selects, switches, color pickers, and the workspace surface. Select menus use Radix UI. Application glyphs are exposed through a stable adapter in `src/components/icons.tsx`, backed by Hugeicons. The app mark uses angle brackets between two rounded lines with orange and green dots; the favicon provides light and dark variants for system appearance. Monaco and Excalidraw retain their own editor/canvas controls.

The theme layer in `src/lib/themes.ts` resolves the saved appearance settings and system color preference into CSS variables applied at the document root. Appearance settings include theme/palette, typography, and reduced motion. Board backgrounds are transparent over the app background; legacy boards without an explicit background migrate to white, while explicitly selected custom colors are retained. Clearing a custom background restores the app background without removing the board, and the change is undoable through the public history capture. Geist Variable and Geist Mono are bundled from Fontsource and used for interface and code typography. Shared tokens and component rules are in `src/ui.css`; the app shell and layout are in `src/styles.css`, with focused styles for the board, split panes, and formatter in their respective CSS files.

## Keyboard shortcuts

Canvas handles these shortcuts when the corresponding key event reaches the page. Its shortcut handler captures application commands; guarded controls consume their own actions, while Monaco and Excalidraw text editing remains available. Browsers may reserve `⌘N` and `⌘W`; `⌥⇧N` and `⌥⇧W` provide alternate new and close commands where needed.

| Action | Shortcut |
| --- | --- |
| Find a document | `⌘/Ctrl K` |
| New document in current mode | `⌘/Ctrl N` |
| Split right | `⌘/Ctrl D` |
| Split down | `⌘/Ctrl Shift D` |
| Close active document | `⌘/Ctrl W` |
| Toggle focus mode | `⌘/Ctrl Shift Enter` |
| Export workspace backup | `⌘/Ctrl S` |
| Select mode 1–4 (Notes, Board, Compare, JSON) | `⌘/Ctrl Shift 1–4` |
| New document fallback | `⌥/Alt Shift N` |
| Close active document fallback | `⌥/Alt Shift W` |

Monaco also provides editor find (`⌘/Ctrl F`) and its command palette (`F1`). Browsers and operating systems may reserve or intercept shortcuts, so availability can vary by browser and platform.

## Local data and backups

The workspace is stored in the browser's IndexedDB database `canvas-workspace`. It includes documents, appearance preferences, active mode/document, and open tabs. There is no backend account or server synchronization. A browser profile/device change does not bring the data with it. A production-only service worker caches the versioned app shell and previously loaded assets; uncached tools still need connectivity. It neither accesses workspace data nor forces activation or reload. Sidebar installation controls use browser installation events, standalone mode, and supported related-app detection; browser support varies.

Saving is local and asynchronous. The interface reports local save status and warns before leaving while changes are pending or storage has failed. Concurrent Canvas tabs use a revision check to detect conflicting writes; on conflict, export the work in the current tab before reloading.

Export downloads a JSON Canvas workspace backup. Import supports Canvas and NotepadXX backup files; it adds imported documents with new IDs and preserves existing items. Export backups regularly and keep a copy somewhere outside this browser. Notes and comparisons can also be downloaded individually; boards export as Excalidraw JSON and JSON documents as JSON.

## JSON behavior

JSON accepts strict JSON, offers two-space, four-space, or tab indentation, and can copy or download output. Formatting and minification validate with `JSON.parse`, then transform the original source tokens rather than serializing the parsed value. This preserves numeric lexemes, string escape spellings, duplicate object keys, and property order. Invalid JSON is reported with a line and column when the browser's parse error provides enough location information. JavaScript object literals, comments, and trailing commas are not accepted. The interaction draws inspiration from [JSON Editor Online](https://jsoneditoronline.org) and [JSONKit](https://jsonkit.co/json-formatter).

## Notes and control refinements (2026-11-06)

Notes, Compare, and JSON use one horizontally scrolling toolbar row with 8px insets and 36px desktop controls. Rounded containers and their children use concentric radii; icon-only actions are square. The sidebar has one create action, full language labels stay visible, and search text ellipsizes beside its shortcut. Find/Replace keeps Monaco's behavior with Canvas styling. Pointer actions suppress keyboard focus rings; keyboard navigation retains them.

New notes use Auto language selection, with manual overrides available. The toolbar font selector updates the saved code-size preference and scales Markdown reading text. Edit and Read independently toggle a Markdown pane while keeping one visible. The renderer supports common Markdown constructs and simple frontmatter; it is not a complete CommonMark parser. Source HTML stays inert and unsafe link destinations are rejected. Syntax coloring is lexical, including Markdown code fences, rather than semantic symbol analysis.

Format runs in a worker using lazy Prettier parsers for JavaScript, TypeScript, HTML, CSS, Markdown and YAML; JSON reuses the lossless token formatter. Current text determines Auto mode. Formatting is one undoable edit with mapped selections, and stale results are discarded after content or language changes. Unsupported languages and errors leave text unchanged. Format is available while the Edit pane is open.

Canvas dark uses the supplied palette under the Canvas name. Existing explicit appearance preferences remain intact. Board tools are directly accessible in the toolbar, and built-in board fonts remain unchanged. Native double-click/double-tap text creation uses Select. The viewport restricts browser zoom where supported, touch inputs use at least 16px text, and board canvas zoom remains available.

## Dependency notes

The dependency audit and its caveats are maintained in [DEPENDENCIES.md](DEPENDENCIES.md); this page does not repeat that audit.
