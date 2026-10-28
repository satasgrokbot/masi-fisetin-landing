# MASI Fisetin preview — content restoration

I updated only the dedicated Fisetin landing preview.

https://masi-fisetin-landing-855nuc4ys-masi.vercel.app

Vercel deployment: `dpl_EHT341AUPWTK1y7JTpAqUS4YRFXJ`. Target: `preview`. Status: `Ready`.

## Completed changes

| Request | Result |
|---|---|
| Banner | Exact text: SAVE UP TO 10% + GET €160 IN GIFTS |
| Shop button | Background #F6FF48. Dark text #2b320d. Desktop and phone checked. |
| What is FISETIN? | Expanded description with ingredient background, cellular senescence, antioxidant research, formula facts and source links. |
| Benefits | Restored explanations for cellular renewal, antioxidants, healthy brain aging and serving information. |
| References | All eight original references restored as links with neutral topic labels. |
| Clinical studies | Six distinct links restored. Labels distinguish published human research, trial registrations and reviews. |
| Expert quote | Full original Dr. Wolfgang Bucke quote and attribution restored without shortening. |
| Source to capsule | Expanded overview and all six process descriptions restored. |
| Privacy popup | No automatic popup. Optional consent settings appear inline in the footer. |

Purchase prices and checkout requests remain USD. The €160 banner is the exact currency exception requested in this revision.

The product information now contains 191 words in the description, 261 in Benefits, 180 in References and 115 in Serving & supply. The original two lab-report links remain available. Each process dropdown contains substantive details.

## Research and copy

I verified the reference identifiers and clinical-trial records against publisher pages, Crossref and ClinicalTrials.gov. The references retain the original authors, years and publications. Neutral link labels describe the research topics.

The human study on absorption uses a different fisetin formulation. That distinction appears beside its link. The three trial records are labelled as registrations. The page does not present a registration as a published result or call the research a MASI product trial.

I removed disease and guaranteed-outcome claims from the new descriptions. I retained the source facts about capsule count, Fisetin quantity, German production, Swiss testing and dosage. I removed unsupported superiority language from the process descriptions. The full expert quote remains attributed and unchanged, as requested.

The previous request for exact live customer reviews remains in force. Those reviews and the Energy filter retain their original claims. The restricted-word scan found no listed terms outside that review section. This does not establish Meta approval.

[Complete copy-change record](COPY-CHANGES.md)

[Research verification](research-sources.json)

[Copy scan](copy-scan.json)

## 90-day checkout display — resolved

The original Buy X Get Y discount reserved one paid subscription jar. This created two paid rows, quantity two and quantity one, with the same plan. The total quantity was always three.

The separate Shopify app change replaced that rule with a gift-only Discount Function in the existing MASI Satas app. The replacement rule is `1639566803219`. The old rules remain available for rollback. No landing checkout code change was needed.

The live store and this preview now show one paid Fisetin row with quantity 3. The three gifts remain free. The app rollout passed 26 product and bundle cases. Browser tests then verified the landing's 90-day, monthly, and one-time buttons.

[Current checkout verification](current-checkout-verification.json)

[Original rule inspection](gift-rule.json)

[Original split diagnosis](gift-split-variants.json)

## Checkout tests

Each primary button reached Shopify checkout from the deployed preview. No order was placed.

| Option | Jars | Selling plan | Product subtotal | Gifts | Result |
|---|---:|---|---:|---:|---|
| 90 days | 3 | 692433813779, every 12 weeks | $512.91 | 3 free | Pass |
| 30 days | 1 | 692168196371, every 4 weeks | $180.47 | 3 free | Pass |
| One-time | 1 | None | $189.97 | None | Pass |

The current 90-day product row has quantity 3 and costs $512.91. Shipping is separate. Earlier checkout records and screenshots in this report predate the shared discount fix; the current verification file records the final layout.

The checkout guard validates every Fisetin line, total quantity, product price, currency and free gifts. UTM parameters remain on the checkout URL and cart attributes.

[Checkout test results](checkout-tests.json)

## Privacy and tracking

A fresh visit has no automatic privacy popup and sends no Meta or GA requests. The footer offers optional inline cookie preferences. Existing saved consent remains effective.

After explicit consent, the browser sent Meta PageView, ViewContent and InitiateCheckout through pixel `1459202204862031`. Both existing GA4 destinations sent events. Consent withdrawal passed.

[Tracking and interaction tests](interaction-tests.json)

## Screenshots and checks

[Phone](screenshots/USD-phone.png)

[Desktop](screenshots/USD-desktop.png)

[Expanded product tabs](screenshots/USD-details-open.png)

[Full expert quote](screenshots/USD-full-quote.png)

[Content restoration checks](content-restoration-tests.json)

[Header and review checks](revision-tests.json)

[Visual checks](visual-checks.json)

I ran these checks from the landing directory:

```text
npm test                                              15 passed
npm run build                                         Passed
node --check public/app.js                            Passed
node --check public/reviews.js                        Passed
python3 -m py_compile scripts/prepare.py               Passed
node scripts/gift-split-check.mjs                     Three variants inspected
node scripts/revision-check.mjs                       Passed
node scripts/interaction-check.mjs                    Passed
PREVIEW_URL=https://masi-fisetin-landing-855nuc4ys-masi.vercel.app node scripts/content-check.mjs  Passed
PREVIEW_URL=https://masi-fisetin-landing-855nuc4ys-masi.vercel.app node scripts/browser-check.mjs  Three options passed
PREVIEW_URL=https://masi-fisetin-landing-855nuc4ys-masi.vercel.app node scripts/screenshots.mjs    Phone and desktop passed
vercel inspect https://masi-fisetin-landing-855nuc4ys-masi.vercel.app --scope masi              Preview, Ready
```

No horizontal overflow or browser script errors were found. The full quote, eight references, six research links, six process dropdowns, exact banner, Shop colors and absence of the automatic popup passed deployed browser checks.

## Release state

The owner approved the landing page merge on 21 October 2026. The landing source, assets, tests, and audit are isolated under `landing-pages/fisetin`. The quiz application and funnels project are unchanged. This merge does not publish the Fisetin production site. The shared gift fix was deployed separately through the existing MASI Satas app.

The latest read-only Vercel check found `fisetin.masi.eu` already registered on this project. This turn did not add or modify domains. Vercel reports no production deployment and no production target.

The dedicated landing Vercel project has automatic deployments disabled and no Git repository link. The existing quiz project retains its own Git integration. Its unchanged application can rebuild after this repository is updated.

Rollback: use the prior preview or delete only this preview deployment. No Shopify rollback is required.
