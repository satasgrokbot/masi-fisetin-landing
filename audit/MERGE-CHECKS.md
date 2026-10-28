# Fisetin landing merge checks — 21 October 2026

The owner requested the landing page merge. No production publication was requested.

## Scope

Every added file is under `landing-pages/fisetin`. The quiz application, its dependency manifests, and its configuration are unchanged. The original quiz working directory was clean before these checks. The landing application remains a standalone package.

The eight runtime entry files match the existing preview byte for byte. See `preview-file-verification.json`. The merge preparation adds a single-row subscription checkout fixture and corrects the documentation to record the separately deployed gift-discount fix. It does not alter the page runtime.

## Commands run

From `landing-pages/fisetin`:

- `npm test`: 16 passed.
- `npm run build`: passed.
- `node --check public/app.js`: passed.
- `node --check public/checkout.js`: passed.
- `node --check public/reviews.js`: passed.
- `python3 -m py_compile scripts/prepare.py`: passed.
- `PREVIEW_URL=https://masi-fisetin-landing-855nuc4ys-masi.vercel.app node scripts/content-check.mjs`: passed. The deployed preview has the full quote, eight references, six study links, six process steps, USD purchase prices, the requested banner, and the correct phone header. No automatic privacy popup, tracking before consent, browser errors, or phone overflow was found.

From the repository root:

- `npm ci --ignore-scripts --no-audit --no-fund`: installed the pinned dependencies.
- `npm run gate`: passed type checking, 283 unit tests, 51 scoring assertions, 417 pricing checks, and the production build. The verification scripts retain their documented skips for checks owned elsewhere.
- `npm run lint`: unavailable because the existing command calls `next lint`, which the installed Next.js version does not support. No lint configuration was changed.
- `git diff --cached --check`: reports 40 whitespace-only lines copied from the live stylesheet. All other staged files pass the whitespace check. The copied stylesheet remains byte-identical to the preview.
- Staged-file secret scan: no credential patterns or private checkout URLs found.

## Checkout evidence

The separate shared discount rollout tested 26 product and bundle cases. The same preview's three purchase buttons then reached checkout with the correct prices, plans, quantity, and free gifts. The 90-day product now occupies one row with quantity 3. See `current-checkout-verification.json`. These checks did not submit payment or place an order.

## Deployment boundary

The dedicated `masi-fisetin-landing` project has automatic Git deployments disabled, no repository link, and only a preview target. This Git merge does not publish that project.

The existing `masi-master-quiz` project is connected to this repository's main branch. Its integration can rebuild the unchanged quiz after a push or merge. No Vercel project settings or domain settings were changed.

The approved live customer reviews retain the source claims and Energy filter. The copy audit records these exceptions. Prices are a dated snapshot; subscription checkout validates current prices before redirecting.

## Rollback

Revert the landing-only merge to remove these files from Git. The existing CLI-deployed preview is independent of Git. A Git rollback does not change Shopify, Recharge, the shared gift discount, or production domains.
