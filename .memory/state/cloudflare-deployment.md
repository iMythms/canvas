# Cloudflare production deployment

- Status observed 2026-11-05: First GitHub-connected Workers Builds deployment succeeded (build `a299c3fe-2e17-479b-bfa1-d58e6f998023`).
- Account: `Mytham` (`46ba6643eac7fcfe9b375551bbd606a7`); Worker `canvas` (`ce75152daa004ecaa7af68bbb7978c09`).
- Domain: `canvas.myth.am` custom domain attached and enabled.
- Source integration: `iMythms/canvas`, branch `main`; auto builds enabled, preview builds disabled. Worker `workers.dev` and preview URLs are disabled.
- Evidence: Cloudflare connector/dashboard inspection, 2026-11-05. Production HTTPS, assets, and browser behavior checks were still in progress at the time of observation; do not infer those checks from a successful build or domain attachment.
