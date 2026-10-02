# Shakha The Flower Shop — website and online shop

The website for Shakha The Flower Shop (Surat), built from the Claude Design
canvas "Shakha Website Design". Customers browse the shop and order online for
delivery or studio pickup; the shop runs orders, products and settings from an
admin panel at `/admin`.

- Next.js 16 (App Router), React 19, TypeScript, CSS Modules
- SQLite through Drizzle ORM and libSQL: a file in `data/` locally, a Turso
  database when hosted on Vercel
- Product photos uploaded in the admin are resized to AVIF, WebP and JPEG with
  sharp and kept in `data/uploads/`, or in Vercel Blob when hosted on Vercel
- Runs on Vercel or any Node.js server (`next start`), not on a static host

## Run it locally

Node.js 20.9 or newer.

```bash
npm install
npm run setup                                     # database + categories + draft products
npm run admin:create -- --email you@example.com   # admin login; prints the password once
npm run dev                                       # http://localhost:3000, admin at /admin
```

The seeded products are drafts without prices, so the shop says it "opens
soon" until you price products and mark them Live in the admin.

### Demo shop

To show the shop working end to end, load the demo on a fresh database:

```bash
npm run setup
npm run db:demo
npm run admin:create -- --email you@example.com
```

`db:demo` adds Shakha's own photos to every product (and four more products
from Shakha's posts), puts everything live with **sample prices**, marks the
Jamun Bouquet sold out, and adds seven **sample orders** at different stages.
Shakha has never published prices: the demo's prices and orders are made up,
so never deploy a demo database. The sample orders use the shop's own phone
number, so their WhatsApp buttons are safe to try.

To start the demo over (for example on another day, so "today" and "tomorrow"
line up again), stop the server, delete `data/`, run the three commands above,
and rebuild if you use `npm start`.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server (applies database migrations first) |
| `npm run build` / `npm start` | Production build and server (the build applies migrations first) |
| `npm run setup` | Migrations plus categories and draft products (the seed skips if products exist) |
| `npm run db:demo` | Demo data as above; refuses a database with orders or live products |
| `npm run admin:create -- --email … [--name …] [--password …]` | Add an admin, or reset an admin's password (signs them out) |
| `npm run db:generate` | After editing `src/db/schema.ts`, write the next migration into `drizzle/` |
| `npm run db:migrate` | Apply migrations |
| `npm test` | Unit tests: delivery slots and cut-off, phone numbers, WhatsApp messages, passwords |
| `npm run lint` | ESLint |
| `npm run images` | Rebuild the site's responsive photos after changing `media-src/images/` |
| `npm run brand-assets` | Rebuild the favicon, app icon and share image |

Settings for the database and uploads are in `.env.example`. Copy it to
`.env.local` or set them in your host's environment; the app and the scripts
above read the same files.

## How the shop works

**Customers**

- `/shop` lists live products with category and occasion filters. Product
  pages have sizes, gift add-ons ("Make it a gift") and a WhatsApp button.
- The cart lives in the browser, but prices are always worked out again on the
  server, so an edited cart can't change what's charged.
- Checkout: delivery (with a different recipient if it's a gift) or pickup
  from Vesu or Dumas; a date and time slot in India time, following the
  same-day cut-off and lead time; a card message; pay on delivery or by UPI.
- Each order gets a private page (an unguessable link) showing its progress.
  Right after ordering, the customer can send it to Shakha's WhatsApp in one
  tap; with UPI on, the page shows a UPI link and QR code.

**Shakha, at `/admin`**

- Dashboard: orders to confirm, what's due today and tomorrow, the last 7 days,
  and a setup checklist. It refreshes every minute.
- Orders: filter and search; move an order along (Confirmed, Being made, Out for
  delivery or Ready for pickup, Completed, or Cancelled); mark it paid or
  refunded; WhatsApp the customer an update; print a slip; keep private notes.
- Products: sizes and prices, photos (upload, reorder, describe, delete), Live,
  Draft or Archived, "Sold out today", gift add-on, occasions.
- Categories; Settings (online orders on or off, delivery charge, free-delivery
  threshold, same-day cut-off, lead time, time slots, how far ahead, pickup,
  UPI ID, the WhatsApp number orders go to); Account (password, other admins,
  sign out everywhere).

**Payments.** There's no card gateway. Customers pay on delivery or pickup, or
by UPI straight to Shakha's UPI ID, and the shop marks orders paid in the admin.
A gateway such as Razorpay would need Shakha's own account and more work.

**Notifications.** No email or SMS: new orders show in the admin (a badge and
the dashboard), and customers are prompted to send their order on WhatsApp.

**Caching.** The homepage and product pages are pre-built from the database
and refreshed whenever anything is saved in the admin. If the database changes
another way (a script while a production server runs, or a build that couldn't
see the live database), rebuild or save anything in the admin.

## Where things live

| What | Where |
| --- | --- |
| Products, prices, photos, categories | Admin → Products, Categories |
| Delivery charge, cut-off, time slots, pickup, UPI, order WhatsApp number | Admin → Settings |
| Phone, WhatsApp, email, Instagram, studios, hours, review numbers | `src/lib/site.ts` |
| Section copy and the pre-typed WhatsApp messages | `src/components/<Section>.tsx` |
| Colours, type scale, buttons, scroll reveals | `src/app/globals.css` |
| Page title, description, share image | `src/app/layout.tsx`, `src/app/opengraph-image.jpg` |
| Search-engine business data (both studios) | JSON-LD in `src/app/(store)/page.tsx` |
| Database tables | `src/db/schema.ts` (migrations in `drizzle/`) |

## Before launch

- [ ] **Prices**: set real prices in Admin → Products and mark each product Live.
- [ ] **Delivery**: in Admin → Settings, set the delivery charge (blank means
      "confirmed by Shakha" per order), any free-delivery threshold, the
      same-day cut-off, lead time and time slots.
- [ ] **UPI**: add Shakha's UPI ID if customers should be able to pay online.
- [ ] **Logins**: one admin per person (`npm run admin:create`); change
      passwords in Admin → Account.
- [ ] **Logo**: the SHAKHA wordmark is typeset in Fraunces as a stand-in. Swap in
      the official logo in `Header.tsx`, `Footer.tsx` and `not-found.tsx`, and
      update the icons in `scripts/make-brand-assets.mjs`.
- [ ] **Consent**: OK from anyone recognisable in the photos (the Litchi
      Bouquet photo and the Instagram tiles).
- [ ] **Domain**: renew `shakhatheflowershop.com` (Namecheap). `site.url` feeds
      the canonical link, share tags, sitemap and structured data.
- [ ] **Review numbers**: `googleReviews` (84 five-star, 143 total, 4.1 average)
      are from the Vesu Google listing in September 2026; refresh them now and then.

## Deploying

The shop needs a server (Vercel, or any Node.js host) and a permanent place for
the database and uploaded photos. Static hosts (Netlify, Cloudflare Pages, plain
cPanel hosting) can't run it any more.

### Vercel, with Turso and Vercel Blob

Vercel's servers can't keep files, so the database lives in Turso and photos in
Vercel Blob. Both are added from the Vercel project; their free plans cover a
shop this size.

1. **Database.** In the project, open **Storage → Create → Turso**. Choose the
   Mumbai (`ap-south-1`) location: `vercel.json` runs the shop's server code in
   Mumbai (`bom1`), close to Surat. Connect it to the project for Production and
   Preview. This adds `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
2. **Photos.** **Storage → Create → Blob**, with public access, connected for
   Production and Preview. This adds `BLOB_READ_WRITE_TOKEN`.
3. **Fill the database** from your machine. `vercel env pull` can't download
   secret values: Turso's arrive as `[SENSITIVE]` placeholders. Copy the real
   `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` and `BLOB_READ_WRITE_TOKEN` values
   from each store's page in Vercel → Storage (or Turso's dashboard) into
   `.env.local` or `.env.development.local`, then:

   ```bash
   npm run setup
   npm run db:demo        # only for a demo shop
   npm run admin:create -- --email owner@example.com
   ```

   Photos from the seed and demo go straight to Blob.
4. **Redeploy** the project. Each build applies database migrations, then
   pre-builds the homepage and product pages from the database.

Good to know:

- Without a Turso database the build stops with a message saying what to add.
- Production uses the main Turso database. Each Preview deployment gets its
  own copy of it, made when it deploys, so orders and edits on a preview are
  thrown away with it. Photos are shared, so previews never delete photo files.
- Vercel caps each request at 4.5 MB, so the admin scales photos down in the
  browser and uploads them one at a time.
- Preview deployments sit behind Vercel's login (Deployment Protection). Show
  the shop from the production deployment, or turn protection off for previews.
- Login and order rate limits are kept in memory per server instance, so on
  Vercel they're looser than on a single server.

### A server with a disk

A small VPS (or any Node host with a persistent disk) needs no extra services:

```bash
npm ci                      # dev tools are needed: the build and scripts use them
npm run setup               # first deploy only
npm run admin:create -- --email owner@example.com
npm run build
npm start                   # port 3000; use -p or PORT to change it
```

- Keep `data/` on the persistent disk (or point `DATABASE_URL` and `UPLOAD_DIR`
  at it) and back it up.
- Serve it over HTTPS (Caddy or nginx in front). The admin login cookie is
  secure-only in production, so the admin won't sign in over plain HTTP
  (localhost is fine for testing).
- Run a single instance: login and order rate limits are kept in memory.
- Build where the database is reachable, because the homepage and product
  pages are pre-built from it. On hosts that attach the disk only at runtime
  (Render, Railway), use Turso for the database or save anything in the admin
  after each deploy.

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

Site photos are in `media-src/images/`, copied from the Instagram/Google brand
bundle. Some were edited with AI for the site; `media-src/ai-edits-manifest.json`
records each edit. In short: the hero background was replaced, three tiles and
the coffee bouquet were restaged, the storefront's right edge was extended, and
the petal texture was generated. The products themselves are real.

To swap a site photo, replace the file under the same name, run `npm run images`
and rebuild. A new photo name also needs adding where it's used, plus an entry
in `MAX_WIDTH` in `scripts/optimize-images.mjs` if it's shown wider than 320px.

Product photos for the seed come from `media-src/images/`, and the demo's extra
ones from `media-src/products/`: plain crops of Shakha's own Instagram and
Google posts, with each source listed in `media-src/products/sources.json`.
Photos added in the admin go to `data/uploads/`, or to Vercel Blob when a Blob
store is connected.

## Structure

```
src/app/(store)/   homepage, shop, product pages, cart, checkout, order pages, checkout actions
src/app/admin/     login and the admin panel, with its server actions
src/app/media/     serves uploaded product photos kept on local disk
src/components/    homepage sections; shop/ (cart, product, checkout); admin/ (admin UI)
src/db/            schema and database client (Drizzle + libSQL)
src/lib/           site facts, catalog, orders, settings, delivery slots, auth, images, WhatsApp
drizzle/           SQL migrations
scripts/           database setup, seed, demo and admin scripts; image and brand-asset builders
tests/             unit tests (node:test, run with tsx)
media-src/         source photos (site and products), brand fonts, AI-edit log
data/              local database and uploads (not in git)
```
