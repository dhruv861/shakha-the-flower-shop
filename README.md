# Shakha The Flower Shop — website

The homepage for Shakha The Flower Shop (Surat), built from the Claude Design
canvas "Shakha Website Design" (desktop and mobile artboards). Ordering happens
on WhatsApp, so the site is fully static: no server, database or forms.

- Next.js 16 (App Router), React 19, TypeScript, CSS Modules
- Static export: `npm run build` writes plain HTML/CSS/JS to `out/`
- Photos pre-built as AVIF and WebP in several sizes (`scripts/optimize-images.mjs`)

## Commands

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # static site in out/
npm start              # serve out/ locally
npm run lint
npm run images         # rebuild responsive photos after changing media-src/images/
npm run brand-assets   # rebuild favicon, app icon and share image
```

## Where things live

| What | Where |
| --- | --- |
| Phone, WhatsApp, email, Instagram, prices, delivery cut-off | `src/lib/site.ts` |
| Studio addresses, hours, map links | `branches` in `src/lib/site.ts` |
| Section copy and the pre-typed WhatsApp messages | `src/components/<Section>.tsx` |
| Colours, type scale, buttons, scroll reveals | `src/app/globals.css` |
| Page title, description, share image | `src/app/layout.tsx`, `src/app/opengraph-image.jpg` |
| Search-engine business data (both studios) | JSON-LD in `src/app/page.tsx` |

## Before launch

These are shown on the site as visible placeholders on purpose. Fill each one
in `src/lib/site.ts` (or as noted), then rebuild.

- [ ] **Prices** — every `₹[PRICE]`: `site.prices` (bouquets, signature, hampers,
      and each signature creation).
- [ ] **Same-day delivery cut-off** — `[CUTOFF TIME]`: `site.sameDayCutoff`.
- [ ] **Logo** — the SHAKHA wordmark is typeset in Fraunces as a stand-in. Swap in
      the official logo in `Header.tsx`, `Footer.tsx` and `not-found.tsx`, and
      update the icons in `scripts/make-brand-assets.mjs`.
- [ ] **Consent** — OK from anyone recognisable in the photos (the Litchi
      Bouquet photo and the Instagram tiles).
- [ ] **Domain** — renew `shakhatheflowershop.com` (Namecheap). `site.url` feeds the
      canonical link, share tags, sitemap and structured data.
- [ ] **Review numbers** — `googleReviews` (84 five-star, 143 total, 4.1 average)
      are from the Vesu Google listing in September 2026; refresh them now and then.

## Deploying

Build once, then publish the `out/` folder on any static host.

- **Netlify or Cloudflare Pages** — build command `npm run build`, output
  directory `out`. `public/_headers` gives hashed files a one-year cache.
- **Vercel** — import the repo; it detects Next.js. (The free Hobby plan is for
  non-commercial use.)
- **cPanel / shared hosting** — upload the contents of `out/` to `public_html`
  and add `ErrorDocument 404 /404.html` to `.htaccess`.

Then point the domain at the host and make sure HTTPS is on.

## Motion

- On load the hero photo eases out of a slight zoom and the headline rises in.
- On scroll the hero photo sinks slightly slower than the page and, on desktop,
  the headline lifts away. Headings, cards and photos fade up as they enter,
  cards in a row one after another, and photos settle from a small zoom.
- Chrome, Edge and Safari 26+ run this as CSS scroll-driven animation (no
  JavaScript). Firefox and older Safari get a lighter JavaScript fallback
  (`RevealFallback.tsx`). Visitors with "reduce motion" on see no animation.
- On desktop, Lighthouse can report low contrast for the "Signature creations"
  label when the page loads with it just entering the screen: the audit catches
  it mid-fade. It reaches full contrast once it settles.

## Photos

Sources are in `media-src/images/`, copied from the Instagram/Google brand
bundle. Some were edited with AI for the site; `media-src/ai-edits-manifest.json`
records each edit. In short: the hero background was replaced, three tiles and
the coffee bouquet were restaged, the storefront's right edge was extended, and
the petal texture was generated. The products themselves are real.

To swap a photo, replace the file under the same name, run `npm run images` and
rebuild. A new photo name also needs adding where it's used, plus an entry in
`MAX_WIDTH` in `scripts/optimize-images.mjs` if it's shown wider than 320px.

## Structure

```
src/app/          layout (fonts, metadata), page (sections + JSON-LD), globals.css,
                  404, robots.txt, sitemap.xml, icons and share image
src/components/   one component + CSS module per section, Picture (responsive
                  photos), Icons, Header (mobile menu), RevealFallback
src/lib/          site.ts (business facts), images.generated.json (generated)
scripts/          optimize-images.mjs, make-brand-assets.mjs
media-src/        source photos, brand fonts for the asset script, AI-edit log
```
