# Browser workspace foundation

- Date: 2026-11-05
- Status: Accepted for the first build
- Context: User requested a blend of NotepadXX and whiteboard.ali.ac, TypeScript/React/Vite/latest Tailwind, entirely browser-resident state, code/text comparison, and a theme switcher inspired by supplied appearance screenshots.
- Decision: One Canvas shell with Notes, Board and Compare modes. Native IndexedDB stores a versioned workspace. Monaco provides code editing/diff; Excalidraw provides the drawing engine. Editor workers, board fonts and assets are local. Appearance uses semantic CSS variables, light/dark/system modes and editable theme presets. No account or backend.
- Alternatives: A custom drawing engine and diff engine would increase correctness and interaction risk. Copying NotepadXX wholesale would retain its UI and weak restore validation. A server is contrary to the user's browser-only requirement.
- Consequences: Large editor/canvas bundles need lazy loading. Local data remains origin-scoped and browser clearing can remove it; expose backup/import. Validate full backups before applying and import NotepadXX files without replacing existing notes.
- References: https://github.com/almahdi/notepadxx/blob/main/src/App.tsx, https://github.com/almahdi/notepadxx/blob/main/package.json, https://whiteboard.ali.ac/.

## Compatibility evidence

Luna source audit: NotepadXX database `notepadxx` version 2 has `files` (keyPath `id`) and `settings` (keyPath `key`). File rows are `{id:number,name:string,content:string,language:string}`. Export root is `{backup:{version:"1.0",timestamp,appVersion,database:{name:"notepadxx",version:2,stores:{files,settings}}}}`. Its restore clears stores before robust validation, so Canvas will validate imports first and merge imported records under fresh IDs.
