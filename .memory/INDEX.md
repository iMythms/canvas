# Memory index

Use this file to locate durable context. Retrieve only entries relevant to the
current request, then verify consequential facts against the current system.

## Always read

- `ACTIVE.md` — current objectives, blockers, and exact resumption points

## On demand

- `decisions/001-browser-workspace.md` — accepted first-build architecture and reference compatibility.
- `episodes/2026-11-05.md` — initialization, delegated work, verification and audit results.

- `state/` — current verified facts about architecture, environment, commands,
  dependencies, conventions, and integrations
- `decisions/` — consequential choices and rationale in ADR-style records
- `episodes/` — dated, append-only records of meaningful work

## Entry conventions

State entries should include the fact, status, source when available, observation
date, and confidence when useful.

Decision entries should include context, decision, alternatives, rationale,
consequences, date, status, and any superseded record.

Episode filenames use `YYYY-MM-DD.md`. Do not create empty directories or
placeholder entries; add each memory category only when real information exists.
- `decisions/002-shared-ui-and-document-navigation.md` — shared UI tokens, sidebar-only documents, theme-backed board and shortcut boundaries.
