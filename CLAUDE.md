# CLAUDE.md — IYVS RSSHub Fork

## Project overview

This is a fork of [RSSHub](https://github.com/DIYgod/RSSHub) maintained by
[IYVS (Independent Youth Volunteer Support)](https://iyvs.org.uk).

The purpose is to provide RSS feed infrastructure for UK youth volunteering
organisations that do not natively publish RSS feeds. It is hosted on Azure
Container Apps and deployed automatically via GitHub Actions on every push to `main`.

---

## Infrastructure

| Resource | Name | Notes |
|---|---|---|
| Resource Group | `rg-iyvs` | UK South |
| Container Registry | `acriyvs.azurecr.io` | Basic SKU |
| Container Apps Environment | `cae-iyvs` | UK South |
| RSSHub Container App | `ca-rsshub-iyvs` | Public ingress, port 1200 |
| Browserless Container App | `ca-browserless-iyvs` | Internal ingress only, port 3000 |
| Custom domain | `feeds.iyvs.org.uk` | Points to ca-rsshub-iyvs |

**Key environment variables on `ca-rsshub-iyvs`:**
- `NODE_ENV=production`
- `CACHE_EXPIRE=3600`
- `CACHE_TYPE=memory`
- `PUPPETEER_WS_ENDPOINT=ws://ca-browserless-iyvs/`

---

## CI/CD

- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Trigger: push to `main`
- Process: build Docker image → push to ACR → update Container App
- Secret required: `AZURE_CREDENTIALS` (service principal JSON)

---

## Codebase notes

- RSSHub uses **TypeScript** throughout — all route files must be `.ts`
- Routes use **pnpm** — do not use npm or yarn
- Each route lives in its own folder under `lib/routes/[namespace]/`
- Every route folder requires **two files**:
  - `namespace.ts` — declares the namespace metadata
  - `index.ts` — contains the route definition and handler
- Routes are **auto-discovered** via the namespace system — no manual registration needed
- RSSHub provides `@/utils/puppeteer` for browser-based fetching (used for sites that block server-side requests)

---

## Custom routes

### `lib/routes/scouts-uk/`

Fetches news from `https://www.scouts.org.uk/news/`

**Status:** In development — selectors being refined

**Why Puppeteer:** The Scouts website returns 403 to server-side fetch requests
regardless of User-Agent headers. Puppeteer via the browserless sidecar is required.

**Known issues:**
- CSS selectors for news card elements not yet confirmed against live markup
- Debug mode currently active — see index.ts

**Planned routes (same pattern):**
- `lib/routes/girlguiding/` — `https://www.girlguiding.org.uk/news/`
- `lib/routes/dofe/` — `https://www.dofe.org/news/`
- `lib/routes/archery-gb/` — `https://www.archerygb.org/news/`

---

## Adding a new route

1. Create folder `lib/routes/[organisation-name]/`
2. Create `namespace.ts`:

```typescript
import type { Namespace } from '@/types';

export const namespace: Namespace = {
    name: 'Organisation Name',
    url: 'organisation.org.uk',
    description: 'Brief description',
    maintainers: ['iyvs'],
};
```

3. Create `index.ts` with route definition and handler
4. If the site blocks server-side fetches, use `@/utils/puppeteer` — see `scouts-uk/index.ts` as reference
5. Commit and push to `main` — GitHub Actions deploys automatically
6. Test at `https://feeds.iyvs.org.uk/[organisation-name]/news`

---

## Debugging selectors

If a route returns empty items, the CSS selectors are not matching the live markup.

Temporary debug pattern — replace handler return with:

```typescript
return {
    title: 'DEBUG',
    link: newsUrl,
    description: 'debug',
    item: [{
        title: 'HTML dump',
        link: newsUrl,
        description: $.html().substring(0, 5000),
    }],
};
```

Deploy, hit the route, inspect the raw HTML in the description field, identify
the correct selectors, update and redeploy.

---

## Local development

No Docker required. pnpm only:

```bash
pnpm install
pnpm dev
# Routes available at http://localhost:1200
```

Requires `PUPPETEER_WS_ENDPOINT` to be set if testing Puppeteer-based routes locally,
or swap to `ofetch` temporarily for local testing against sites that don't block it.

---

## Project context

This infrastructure is part of a broader IYVS initiative to serve the UK youth
volunteering sector. The long-term goal is a public feed directory at
`feeds.iyvs.org.uk` covering all major UK youth organisations, with routes
maintained as open source contributions welcome from across the sector.

Maintainer: Lee Greenwood — CTO, IYVS
