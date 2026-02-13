# CLAUDE.md — Readly Development Guide

## Project Summary

Readly is a static RSS reader hosted on GitHub Pages. It stores user data in Google Drive and refreshes feeds via GitHub Actions. There is no backend server. The frontend is a Svelte PWA; the feed-fetching worker runs in GitHub Actions on a cron schedule.

## Tech Stack

- **Frontend**: Svelte 5 + SvelteKit (static adapter) + Vite
- **Styling**: Tailwind CSS
- **Worker**: Node.js (TypeScript) running in GitHub Actions
- **Persistence**: Google Drive API v3
- **Feed parsing**: `feedparser-promised` or similar (worker-side only)
- **Testing**: Vitest (unit), Playwright (e2e)
- **PWA**: Workbox for service worker generation

## Commands

```bash
npm run dev           # Start dev server (localhost:5173)
npm run build         # Production build (static output to build/)
npm run preview       # Preview production build
npm run test          # Run Vitest unit tests
npm run test:e2e      # Run Playwright tests
npm run lint          # ESLint + Prettier check
npm run fetch-feeds   # Run feed fetcher locally (needs GOOGLE_REFRESH_TOKEN in .env)
npm run check         # svelte-check (type checking)
```

## Architecture Rules

### No backend

Everything runs either in the browser (PWA) or in GitHub Actions (worker). Do not introduce a server, database, or serverless function. If you think you need one, you're solving the wrong problem.

### Google Drive is the database

User state lives in Google Drive under an app-specific folder (`readly/`). Files:

- `config.json` — subscriptions, folders, preferences
- `state.json` — read/unread, saved articles
- `opml.xml` — standard export format, kept in sync with config

The browser uses OAuth (implicit grant / PKCE) to access Drive directly. The Actions worker uses a refresh token stored in GitHub Secrets.

### Feed bundle is static JSON

The Actions worker fetches all subscribed feeds, normalizes them into a single JSON file, and commits it to the `gh-pages` branch. The PWA reads this file as a static asset. This avoids CORS issues and means the PWA works offline with cached data.

### Offline-first

The service worker caches the feed bundle and app shell. The app must function when offline using the last cached bundle. Drive sync happens opportunistically when online.

## File Organization

```
src/lib/components/   → Svelte UI components (one per file, exported from index.ts)
src/lib/stores/       → Svelte stores: feedStore, stateStore, authStore
src/lib/drive.ts      → Google Drive helpers (read, write, ensure folder exists)
src/lib/types.ts      → TypeScript types/interfaces (shared between PWA and worker)
src/lib/feed-parser.ts → Feed normalization (used by worker, may be imported in tests)
src/routes/           → SvelteKit pages
worker/               → GitHub Actions feed fetcher (separate from PWA code)
static/               → PWA manifest, icons
```

## Conventions

### TypeScript

- Strict mode. No `any` unless absolutely necessary (and add a comment explaining why).
- Shared types go in `src/lib/types.ts` — both the worker and PWA import from here.
- Prefer interfaces over type aliases for object shapes.

### Svelte

- Svelte 5 runes syntax (`$state`, `$derived`, `$effect`).
- Components are `.svelte` files in `src/lib/components/`.
- Keep components small. If a component exceeds ~150 lines, split it.
- Use Svelte stores for global state, component-level `$state` for local state.

### CSS / Tailwind

- Use Tailwind utility classes. No custom CSS unless Tailwind genuinely can't express it.
- Dark mode via `class` strategy (toggle a `dark` class on `<html>`).
- Responsive: mobile-first. Feed list collapses to single column on small screens.

### Testing

- Unit tests live next to the code: `drive.ts` → `drive.test.ts`.
- Mock Google Drive API responses — don't hit real APIs in tests.
- Mock RSS feeds with fixture XML files in `tests/fixtures/`.
- Playwright tests go in `tests/e2e/`.
- Every new module needs tests before it's considered done.

### Git

- Commits are conventional: `feat:`, `fix:`, `refactor:`, `test:`, `ci:`, `docs:`.
- The `main` branch is the source. The `gh-pages` branch is build output only — never edit it directly.
- The feed bundle JSON is committed to `gh-pages` by the Actions workflow, not manually.

## Key Design Decisions

### Entry IDs

Feed entry IDs are a stable hash of the entry URL (SHA-256, truncated to 12 hex chars). This ensures IDs are consistent across fetches even if the feed's own `<guid>` changes. The `state.json` read/saved arrays use these IDs.

### Drive conflict resolution

Last-write-wins for now. The PWA writes state after each user action (mark read, save, etc.). The Actions worker only reads config (to know which feeds to fetch) and does not write to state.json. This avoids conflicts.

### Feed refresh flow

1. Actions cron triggers `worker/fetch-feeds.ts`
2. Worker reads `config.json` from Drive to get feed URLs
3. Worker fetches all feeds in parallel (with timeout + retry)
4. Worker normalizes entries into the bundle JSON schema
5. Worker commits bundle to `gh-pages` branch
6. GitHub Pages deploys automatically

### PWA auth flow

1. User clicks "Sign in with Google"
2. OAuth PKCE flow grants Drive-scoped access token
3. Token stored in memory (not localStorage — refresh on each session)
4. PWA reads/writes config.json and state.json directly via Drive API
5. If offline, queue writes and sync when back online

## Ralph Loop Guidance

### Good loop targets (machine-verifiable)

**Feed parser module**

- Input: fixture XML files (RSS 2.0, Atom, edge cases)
- Completion: `npm run test -- feed-parser` passes, all fixtures produce valid typed output

**Drive sync module**

- Input: mock Drive API responses
- Completion: `npm run test -- drive` passes, read/write/folder-creation round-trips work

**Individual UI components**

- Completion: `npm run check` clean, `npm run test` passes, component renders in Storybook/test harness

**GitHub Actions workflow**

- Test with `act` locally
- Completion: workflow runs, produces valid bundle JSON, diff shows expected entries

**Service worker / offline**

- Completion: Playwright test loads app, goes offline, verifies cached content still renders

### Loop anti-patterns (avoid these)

- Don't loop on the full app end-to-end until individual modules are solid
- Don't loop on OAuth flows — too many external dependencies, test with mocks instead
- Don't loop on "make it look like Feedly" — visual design needs human judgment. Loop on specific components with screenshot reference comparisons instead.

### Iteration strategy

1. Start with types.ts — get the data shapes right
2. Feed parser with fixture tests
3. Drive module with mock tests
4. Stores wiring (feedStore, stateStore)
5. UI components one at a time
6. Actions workflow
7. PWA plumbing (service worker, manifest, offline)
8. Integration: wire it all together

Each step is independently loopable. Don't skip ahead.

## Environment Variables

```bash
# .env (local development)
VITE_GOOGLE_CLIENT_ID=xxx        # OAuth client ID (public, baked into PWA)
GOOGLE_CLIENT_SECRET=xxx          # Only used by worker, never in PWA
GOOGLE_REFRESH_TOKEN=xxx          # Only used by worker
```

The PWA only ever sees `VITE_GOOGLE_CLIENT_ID`. The secret and refresh token are for the Actions worker only and live in GitHub Secrets.

## Gotchas

- **CORS**: You cannot fetch RSS feeds from the browser. That's why the worker exists. Don't try to add a CORS proxy — it defeats the "no server" principle.
- **Drive API quotas**: Google Drive API has rate limits. Batch reads/writes where possible. The PWA should debounce state writes (e.g., marking multiple articles read in quick succession).
- **Feed bundle size**: Keep only the most recent N entries per feed (default: 50). Prune on each refresh. The bundle should stay under 1MB for fast PWA loading.
- **GitHub Actions cron**: Minimum interval is 5 minutes, but GitHub throttles. 30 minutes is a reasonable default. Don't go below 15.
- **OAuth token in memory**: We deliberately don't persist tokens to localStorage. The user re-authenticates each session. This is simpler and avoids token-theft concerns. If this UX is annoying, revisit later with a service worker token cache — but not yet.
