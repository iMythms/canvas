# Cloudflare production deployment

- Status observed 2026-11-05: First GitHub-connected Workers Builds deployment succeeded (build `a299c3fe-2e17-479b-bfa1-d58e6f998023`).
- Account: `Mytham` (`46ba6643eac7fcfe9b375551bbd606a7`); Worker `canvas` (`ce75152daa004ecaa7af68bbb7978c09`).
- Domain: `canvas.myth.am` custom domain attached and enabled.
- Source integration: `iMythms/canvas`, branch `main`; auto builds enabled, preview builds disabled. Worker `workers.dev` and preview URLs are disabled.
- Evidence: Cloudflare connector/dashboard inspection, 2026-11-05. Independent production HTTP checks verified valid TLS, 200 HTML, metadata, 1200x630 PNG, security headers, sitemap, and SHA-256 matches for all 177 JS files, four CSS files and 250 fonts. Root reported passing production browser checks for note persistence, Board Help, formatter numeric preservation and Compare with no console errors. Details: `docs/TESTING.md`.
- Pending 2026-11-05: Deploy and verify the response-level `no-transform` header that prevents Cloudflare's automatic analytics injection without weakening CSP or changing zone-wide settings. Official support: https://developers.cloudflare.com/web-analytics/faq/. Cloudflare-managed robots content initially added named crawler exclusions but retained wildcard allow and the sitemap; Googlebot is not excluded.
