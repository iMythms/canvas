# Shared controls and sidebar document navigation

- Date: 2026-11-05
- Status: Accepted by explicit user direction; supersedes the intermediate document-tabbar layout.
- Context: Duplicate document navigation and excessive chrome reduced working area. User requested a unified compact desktop-tool experience, rounded controls, Geist fonts, Hugeicons, and theme continuity.
- Decision: Sidebar owns document selection, inline rename, close and recovery. Pin/actions sit next to topbar split controls. Pinned documents form a first group separated by a thin line, with compact hover/focus previews. Closing never deletes content. Expanded/collapsed sidebar state is persisted per workspace mode; focus mode hides navigation. Shared custom controls and spacing/radius tokens govern host UI, with scoped Excalidraw styling.
- Alternatives: Retaining both tabs and sidebar repeats navigation; hiding all navigation on collapse loses fast mode access. Native selects/disclosure markers conflict with explicit custom UI direction.
- Consequences: Closed documents remain recoverable. Keyboard shortcuts are captured before embedded editors when delivered by the browser, with AltShiftN/W alternatives for reserved native browser shortcuts. Theme-backed board scenes are transparent over app background to avoid Excalidraw's dark color inversion; old unmarked white means theme by migration assumption, explicit custom colors are marked and preserved.
- Branding: Source is user's supplied rounded note icon, with code brackets. User's latest approved direction removes the pen in favor of a bottom rounded line matching the top; live mark follows theme surfaces and favicon light/dark system preference.
