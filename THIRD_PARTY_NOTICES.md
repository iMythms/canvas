# Third-party notices

Canvas includes or uses the following third-party software and assets. Their licenses apply independently of the Canvas MIT license. This is a guide to prominent components, not an exhaustive list of dependencies; see `package-lock.json` and the installed packages for additional notices.

| Component | License and notices |
| --- | --- |
| [Excalidraw](https://github.com/excalidraw/excalidraw) | MIT; [license](licenses/excalidraw.txt). Board uses Excalidraw. |
| [Monaco Editor](https://github.com/microsoft/monaco-editor) | MIT; [license](licenses/monaco.txt) and [third-party notices](licenses/monaco-notices.txt). |
| [Monaco React](https://github.com/suren-atoyan/monaco-react) | MIT; [license](licenses/monaco-react.txt). |
| [React and React DOM](https://github.com/facebook/react) | MIT; [React](licenses/react.txt), [React DOM](licenses/react-dom.txt). |
| [Radix UI Select](https://github.com/radix-ui/primitives) | MIT; [license](licenses/radix-select.txt). |
| [Hugeicons free core icons and React](https://github.com/hugeicons/hugeicons) | MIT; [core](licenses/hugeicons-core.txt), [React](licenses/hugeicons-react.txt). |
| [DOMPurify](https://github.com/cure53/DOMPurify) | MPL-2.0 OR Apache-2.0; [MPL](licenses/dompurify-mpl.txt), [Apache](licenses/dompurify-apache.txt). |
| [Prettier](https://github.com/prettier/prettier) | MIT; [license](licenses/prettier.txt) and [third-party notices](licenses/prettier-notices.txt). |
| Geist Sans and Geist Mono via [Fontsource](https://github.com/fontsource/font-files) | SIL Open Font License 1.1; [Geist](licenses/geist.txt), [Geist Mono](licenses/geist-mono.txt). |
| [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) | Language SVGs in `src/assets/languages`; [MIT license](src/assets/languages/LICENSE). |
| [Rough.js](https://github.com/rough-stuff/rough) and [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | Excalidraw rendering dependencies; [Rough.js license](licenses/roughjs.txt), [perfect-freehand license](licenses/perfect-freehand.txt). |

## Excalidraw fonts

`scripts/copy-assets.mjs` copies the fonts from the locked `@excalidraw/excalidraw` 0.18.1 package into `public/fonts`. Each family receives a local `LICENSE.txt`, which Vite includes in the production output. Liberation also receives its editable font source and upstream build script as `source.tar.gz`. No network fetch is needed during copying or at runtime. These fonts retain their own licenses and copyright independently of Canvas's MIT license.

Verified on 2026-11-06 against [Excalidraw v0.18.1, commit a2ec2889](https://github.com/excalidraw/excalidraw/tree/a2ec2889babf7d2295469c6d90ebe77fae57df84/packages/excalidraw/fonts), original font repositories, and the installed binaries' name tables. One binary per family was byte-compared with the pinned upstream file. The notices record the sample filename, SHA-256, version, source URLs, full terms, and copyright. The copy script requires a license review when the Excalidraw package version changes.

| Distributed family | Version / origin | License and attribution |
| --- | --- | --- |
| Assistant | 3.000; [Assistant](https://github.com/hafontia/Assistant), derived from Source Sans Pro | OFL 1.1; Assistant Project Authors, Source Sans Pro Authors; [full notice](licenses/font-assistant.txt). |
| Cascadia Code | 2005.150; [Microsoft Cascadia Code](https://github.com/microsoft/cascadia-code/tree/v2005.15) | OFL 1.1; Microsoft Corporation; [full notice and embedded terms](licenses/font-cascadia.txt). |
| Comic Shanns | Modified Comic Shanns Mono 1.3.0; [Mono fork](https://github.com/jesusmgg/comic-shanns-mono) of [Comic Shanns](https://github.com/shannpersand/comic-shanns) | MIT; Shannon Miwa, Jesus Gonzalez, Rodrigo Batista de Moraes, Fini Jastrow, Kyle Beechly; [full notice](licenses/font-comicshanns.txt). |
| Excalifont | 1.000; [pinned source and license](https://github.com/excalidraw/excalidraw/blob/a2ec2889babf7d2295469c6d90ebe77fae57df84/packages/excalidraw/fonts/Excalifont/index.ts), based on Virgil | OFL 1.1; Excalidraw; Your Own Font Foundry and Ján Filípek / DizajnDesign credited upstream; [full notice](licenses/font-excalifont.txt). |
| Liberation Sans | 1.05; [original source revision](https://github.com/liberationfonts/liberation-1.7-fonts/tree/99a390676af7be27fcb477c6636dd5106290dda4/trunk) | GPLv2 with Liberation Font Software exceptions and terms (not the OFL license of 2.x); Ascender Corporation and Red Hat; [full notice and GPL](licenses/font-liberation.txt), [editable source and build script](licenses/font-liberation-source.tar.gz). |
| Lilita One | 1.002; [Lilita One original source](https://github.com/googlefonts/lilitaone/tree/d3687864827cfeca4a14baaeaee95d151c37a6b9) | OFL 1.1; Juan Montoreano; reserved names retained in [full notice](licenses/font-lilita.txt). |
| Nunito | 3.602; [Nunito](https://github.com/googlefonts/nunito) | OFL 1.1; Nunito Project Authors; [full notice](licenses/font-nunito.txt). |
| Virgil | 001.001; [Virgil](https://github.com/excalidraw/virgil) | OFL 1.1; Your Own Font Foundry; upstream also credits Ellinor Rapp and reserves Virgil; [full notice](licenses/font-virgil.txt). |
| Xiaolai SC | 3.11 in pinned metadata; Excalidraw modifies/subsets [LXGW's Xiaolai](https://github.com/lxgw/kose-font), derived from SetoFont | OFL 1.1; LXGW and Nozomi Seto; [full notice and modification provenance](licenses/font-xiaolai.txt). |
