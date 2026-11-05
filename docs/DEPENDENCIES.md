# Dependency notes

Checked against npm on 2026-11-05. Direct dependencies were the latest stable
versions at that time. Excalidraw 0.18.1 declares React 19 support. Its pinned
Radix tabs 1.0.2 is overridden to 1.2.1, which declares React 19 support and
retains the Tabs API used by Excalidraw. `npm ci --strict-peer-deps` and
`npm ls react react-dom --all` succeed. A clean install's `npm ls --all` still
reports `points-on-path@0.2.1` as invalid for roughjs's `^0.2.1` range; this is
not a React peer dependency, and the reported version satisfies that range.

The other overrides replace Excalidraw's Nano ID 3.3.3 with 3.3.20, its Mermaid
converter's Nano ID 4.0.2 with 5.1.16, and lodash-es 4.17.21 with 4.18.1.
The converter's installed source calls the named `nanoid()` function with no
arguments, which is supported by the replacement. The Nano ID 5 and lodash-es
overrides exceed upstream pins and need functional regression testing, especially
Mermaid conversion and drawing operations, when changing these dependencies.

Monaco 0.57.0 vendors DOMPurify 3.4.15 in its ESM sources. A Vite alias redirects
its `./dompurify/dompurify.js` import to the direct DOMPurify 3.4.17 dependency;
a scoped npm override also updates Monaco's declared dependency. The production
bundle contains 3.4.17 and the Vite development response resolves the Monaco
import to the same version. Recheck the import path and both build modes when
upgrading Monaco or Vite: an npm override alone does not replace Monaco's
vendored file. Monaco's current sanitization config does not enable the modes
required by the known DOMPurify 3.4.15 advisories, based on source inspection;
this is not a complete exploitability assessment.

`npm audit` reports four low-severity affected packages, including dependants.
Mermaid 11.17.2 depends on KaTeX 0.16.47, affected by
[GHSA-238p-pmpm-9mq7](https://github.com/advisories/GHSA-238p-pmpm-9mq7).
The advisory requires existing prototype pollution to bypass trust restrictions.
Excalidraw includes Mermaid conversion; exposure through the app has not been
fully assessed. The fixed KaTeX 0.18.2 is outside Mermaid's declared 0.16 range,
so it has not been forced into the dependency tree.

Recheck these findings and remove overrides once upstream releases include fixes.
