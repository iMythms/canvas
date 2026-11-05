# Cloudflare deployment

Canvas is deployed as Workers Static Assets, without a Worker script. The Wrangler configuration serves `dist` with SPA fallback at `canvas.myth.am` and disables both the production `workers.dev` URL and version preview URLs. The hostname must belong to a zone in the target Cloudflare account, and any conflicting DNS record must be resolved before deployment.

Connect the GitHub repository to Workers Builds and configure:

- Production branch: `main`.
- Root directory: repository root.
- Build command: `npm ci && npm run build`.
- Deploy command: `npm run deploy`.
- Build variable: `SKIP_DEPENDENCY_INSTALL=1`, so the explicit `npm ci` is the only dependency installation.
- Disable preview builds in Workers Builds. This is separate from the `preview_urls` setting in Wrangler.

The `.nvmrc` and `packageManager` field pin Node.js and npm for Workers Builds. Build dependencies must be installed, so do not set `NODE_ENV=production` during installation. Workers Builds can create its deployment token; if supplying one, grant the account and zone permissions needed to deploy the Worker and its custom domain. No application secrets or runtime bindings are required.

For a local packaging check, run `npm ci`, `npm run build`, and `npx wrangler deploy --dry-run`. A dry run does not verify the Cloudflare account, DNS, certificate, or deployed application. After deployment, check the hostname, security headers, and app features in a browser.

References: [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/), [SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), and [static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/).
