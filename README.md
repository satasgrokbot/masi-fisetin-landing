# MASI Premium Fisetin preview

This isolated static landing uses the current live Fisetin layout and verified USD pricing. It has no dependency on the quiz application.

The source repository is `vytautassatas/masi-master-quiz`. The local branch is `vytautassatas/fisetin-landing-preview-20261021`. The separate Vercel project is `masi/masi-fisetin-landing` (`prj_wVoeSdUGMdWToZ5VkfAJb4UVrNOB`). Existing quiz and funnel projects remain unchanged.

## Build and test

Run these commands from this directory:

```sh
npm ci
npm test
npm run build
python3 -m http.server 4173 --bind 127.0.0.1 --directory public
```

The build copies `public` into `dist`. It does not build or change the parent Next.js quiz. Vercel deploys only this directory. Node 22 is the deployment runtime. The local verification used Node 25.

Browser checks use Playwright. The three USD checkout checks create test carts and reach checkout. They do not submit payment or place orders.

```sh
PREVIEW_URL=https://YOUR-PREVIEW.vercel.app node scripts/browser-check.mjs
PREVIEW_URL=https://YOUR-PREVIEW.vercel.app node scripts/interaction-check.mjs
PREVIEW_URL=https://YOUR-PREVIEW.vercel.app node scripts/secondary-check.mjs
PREVIEW_URL=https://YOUR-PREVIEW.vercel.app node scripts/performance-check.mjs
```

## Source refresh

`source/USD-catalog.json` records the live product and plan prices captured on 21 October 2026. `source/asset-manifest.json` maps each copied asset to its live source. The saved Shopify cookie configuration is in `source/cookie-banner.json`.

The optional refresh scripts need Python with `scripts/requirements.txt`. Run `scripts/capture.mjs`, `scripts/capture-reviews.mjs`, then `scripts/prepare.py`. Capture is read-only. Raw Shopify responses remain ignored and are excluded from deployment. Recheck every text change after a refresh. Recheck checkout if a plan or price changes.

## Checkout

One-time checkout uses a market-specific Shopify cart permalink. Shopify cart permalinks do not support subscription selling plans. Subscriptions therefore use tokenless Storefront API `cartCreate` with an explicit selling plan and market. Each click creates a new cart. It does not append to or clear an existing storefront cart.

The API response must match the selected product, total quantity, plan, currency, price, and zero-price gifts. A mismatch blocks navigation and shows an error. The live unified gift discount now keeps the quarterly product on one row with quantity 3. Validation also accepts the former split layout for discount-rule rollback compatibility. It checks the sum and the selling plan on every Fisetin line.

Every `utm_*` parameter is copied to the checkout URL and cart attributes. Checkout can update taxes, currency, or shipping after the buyer enters a destination.

Sources:

- https://shopify.dev/docs/apps/build/checkout/create-cart-permalinks
- https://shopify.dev/docs/api/storefront/latest/mutations/cartCreate
- https://shopify.dev/docs/api/storefront/latest

## Tracking and privacy

Meta Pixel: `1459202204862031`. Events: `PageView`, `ViewContent`, `InitiateCheckout`.

GA4 destinations observed on MASI: `G-H98Q4W0J4S` and `G-22PSYBQM5W`. Automatic catalog metadata is disabled in the Meta initialization. The landing has no Product JSON-LD, product Open Graph tags, Shopify analytics scripts, catalog IDs in tracking events, or `/products/` page route.

The saved MASI cookie banner is disabled on the live store. This preview has no automatic privacy popup. Optional consent controls appear inline in the footer when the visitor selects Cookie preferences. Analytics and marketing start only after consent. New visitors send no tracking events unless they opt in through the footer. The visitor can reopen preferences and withdraw consent.

The existing Meta Pixel configuration filters the default headless browser user agent. The tracking test uses a standard Chrome user agent to test the browser event transport. It does not change Meta configuration.

## Deployment boundary

Deploy only a preview from this directory. Do not deploy the repository root. Do not connect a production domain until the owner approves it.

Vercel incorrectly classified the first deployment as production despite `--target preview`. That deployment and its aliases were removed. Later deployments were verified as previews. No production deployment remains.

The latest read-only Vercel check found `fisetin.masi.eu` already registered on the project. This turn did not add or modify domains. Vercel still reports no production deployment or production target. Only the preview URL was deployed.

The owner approved merging this landing page on 21 October 2026. All landing files remain under `landing-pages/fisetin`; the quiz application files are unchanged. The dedicated landing project has no Git repository link and automatic deployments are disabled. Merging this repository does not publish the landing page. The existing quiz integration can rebuild its unchanged application after a repository push.

## Risk and rollback

The prices are a static, dated snapshot. Subscription checkout verifies the actual current offer before redirecting. Refresh the snapshot before launch. The requested live reviews now retain outcome claims, including energy. The restricted-word scan records these exceptions. It does not establish Meta ad approval.

To remove this preview, delete only the dedicated `masi-fisetin-landing` preview deployment. No Shopify rollback is required. No Shopify theme, product, subscription plan, Recharge setting, existing Vercel project, or other repository was changed.

See `audit/REPORT.md` for the final preview URL, screenshots, copy changes, and test results.

## Current navigation and content

The root and `/usd/` routes show identical USD content. The header has a US flag and USD label. Shop and the cart icon scroll to the purchase box. Science scrolls to “What is Fisetin?”. Lab results scrolls to the lab reports. There is no account icon or currency selector.

The comparison, healthy-aging routine, and quiz sections are removed. Reviews, five filters, expanded quotes, and the left video match the current live Fisetin section. The video retains its NMN label.

## Content restoration

`source/detail-copy.json` contains the expanded descriptions, benefit explanations, eight references, six study links, and six manufacturing steps. The generator keeps the full original Dr. Wolfgang Bucke quote and role. Study labels are neutral and distinguish published human research, trial records, preclinical research and reviews.

The banner matches the live USD PDP: `SAVE UP TO 10% + GET $160 IN GIFTS`. `public/masi-header.js` is the theme `masi-header-r31.js` with null guards for the absent market disclosures. It re-renders the banner from the `data-ms-*` attributes and measures the promo height for the sticky header. The Shop button uses the Fisetin header accent `#F6FF48` with dark text.

The 90-day row split was fixed separately through the existing MASI Satas app. The new unified discount targets only gifts. The landing checkout now shows one Fisetin row with quantity 3 and three free gifts. Prices and plans are unchanged. See `audit/current-checkout-verification.json`. The old `audit/gift-rule.json` and `audit/gift-split-variants.json` files retain the pre-fix diagnosis.
