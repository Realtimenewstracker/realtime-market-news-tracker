
# Track Platform India — port to Lovable and publish

## What we're doing

Your uploaded project is CRA + `react-router-dom` frontend and FastAPI + MongoDB + Emergent LLM backend. Neither runs on Lovable as-is. We'll rebuild the same product on Lovable's stack: TanStack Start (React 19), Lovable Cloud (Postgres + auth) for persistence and login, Lovable AI Gateway (Gemini) for summaries and Ask‑AI, and TanStack server routes for RSS ingest and market data. UI is ported page-for-page, keeping the iridescent/glass/framer‑motion vibe, ported to Lovable's design token system.

## Pages (parity with your app)

- `/` — News Feed with filter bar, ticker bar, news cards, article detail drawer with AI summary + Ask‑AI stream
- `/portfolio` — Add tickers with qty/avg price, live P&L via server-refreshed quotes, personalized news
- `/watchlist` — Symbols + keywords; feed filtered to matches
- `/geopolitics` — World map with curated hotspots + market impact notes
- `/account` — Profile, sign out, preferences
- `/auth` — Email/password + Google sign-in (Lovable Cloud)
- Global: TopBar, BottomDock (mobile), CommandPalette (⌘K), Toasts

## Backend on Lovable

**Data (Lovable Cloud / Postgres, RLS on):**
- `profiles` (auto-created on signup)
- `news_articles` (id, source, category, title, url, published_at, summary, tickers[], regions[], hash) — public read
- `tickers` (symbol, alias, label, last, change, change_pct, updated_at) — public read
- `portfolio_positions` (user_id, symbol, qty, avg_price) — owner RLS
- `watchlist_items` (user_id, kind: symbol|keyword, value) — owner RLS
- `hotspots` (curated seed data) — public read

**Server routes (`src/routes/api/public/*`) called by cron, signature/secret protected:**
- `POST /api/public/ingest-rss` — pulls the same RSS list, dedupes by hash, enriches new items with Lovable AI (Gemini) to extract tickers, regions, one-line summary, impact score; upserts into `news_articles`
- `POST /api/public/refresh-tickers` — Yahoo Finance + CoinGecko fetch, updates `tickers`
- Scheduled every ~2 min via pg_cron hitting stable `project--{id}.lovable.app` URLs

**Server functions (`createServerFn`):**
- `listNews({ filters })`, `getArticle(id)`
- `askAI(articleId, question)` — streams via Lovable AI (Gemini) using the SSE-friendly server route pattern
- Portfolio + watchlist CRUD (auth-required)
- `personalizedFeed()` — joins user's symbols/keywords with `news_articles`

## Frontend port

- Convert `App.js` + `react-router-dom` to TanStack file routes under `src/routes/`
- `__root.tsx` holds `AppShell` (iridescent bg, grain overlay, TopBar, Outlet, BottomDock, Toaster), framer-motion route transitions
- Port each `.jsx` component to `.tsx`, swap `axios` → server functions / `fetch`, swap `AuthContext` → Supabase session hook, keep shadcn/Radix components (already in Lovable template — reuse instead of re-adding)
- Replace `react-simple-maps` for GeopoliticalMap (works fine in React 19)
- Preserve visual language: port `App.css` iridescent + grain into `src/styles.css` as tokens (gradients, shadows, radii), no hardcoded colors in components
- Each route sets its own `head()` title/description/og

## Known issues in the uploaded code we'll fix during port

- `axios 1.18.0`, `lodash 4.18.1`, `bcrypt 4.1.3` don't exist — dropped anyway (we use fetch + server auth)
- `bcrypt` + custom JWT auth is replaced by Lovable Cloud auth (safer, less code)
- RSS fetch in the FastAPI app was synchronous inside async — reimplemented with `fetch` + `Promise.all` in the ingest route
- SSE Ask‑AI used Emergent Claude — replaced with Lovable AI Gateway streaming (Gemini 3.6 Flash default)
- `react-router-dom` catch-all `path="*"` redirect logic → TanStack `notFoundComponent`
- Reuters RSS URL in the source list frequently 403s — will keep it but tolerate failures per source

## Secrets / setup

- Enable Lovable Cloud (auth + Postgres + storage)
- Provision `LOVABLE_API_KEY` for AI Gateway
- Generate `CRON_SECRET` for the ingest/refresh endpoints
- No user-supplied API keys required (Yahoo/CoinGecko/RSS are public)

## Delivery order

1. Enable Cloud, create schema + RLS + seed hotspots, provision AI key + cron secret
2. Design tokens (iridescent/glass) in `src/styles.css`; AppShell in `__root.tsx`
3. Ingest + ticker refresh server routes, pg_cron schedule
4. Auth (`/auth`) + `_authenticated` gate for Portfolio/Watchlist/Account
5. Feed + Article drawer + Ask‑AI streaming
6. Portfolio, Watchlist, Geopolitics
7. TopBar, BottomDock, CommandPalette, TickerBar
8. SEO metadata per route, security scan, then publish

After this plan is approved I'll switch to build mode and start with step 1.
