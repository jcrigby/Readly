# Readly — A Static RSS Reader

A Feedly-inspired RSS reader that runs as a static site on GitHub Pages, stores state in Google Drive, and refreshes feeds via GitHub Actions.

## Architecture

```
GitHub Actions (cron)          GitHub Pages (static)
        │                              │
        ▼                              ▼
  fetch feeds ──► build JSON ──► PWA reads JSON
        │                              │
        ▼                              ▼
  Google Drive API             Google Drive API
  (write feed cache)           (read/write user state)
```

### Three moving pieces

1. **GitHub Actions worker** — Runs on a cron schedule. Fetches RSS/Atom feeds, normalizes entries, writes a static JSON bundle to the `gh-pages` branch. Also syncs feed list and read-state from Google Drive so the worker knows what to fetch.

2. **Static PWA** — Served from GitHub Pages. Reads the pre-built JSON feed bundle. Manages user state (subscriptions, read/unread, folders, saved articles) via the Google Drive API directly from the browser using OAuth.

3. **Google Drive** — Acts as the persistence layer. Stores:
   - `readly/config.json` — feed subscriptions, folders, preferences
   - `readly/state.json` — read/unread status, saved articles
   - `readly/opml.xml` — standard OPML export (kept in sync)

### Why this shape

- **No server** — GitHub Pages is free static hosting. No backend to maintain or pay for.
- **No database** — Google Drive gives authenticated, user-owned storage with a REST API accessible from both Actions and the browser.
- **Portable data** — OPML export means you can leave anytime. Your data lives in your own Drive.
- **Offline-capable** — The PWA caches the feed bundle. Read it on the train.
- **GitHub Actions as cron** — Free compute for periodic feed fetching. Runs every 30 minutes (configurable).

## Tech Stack

| Layer        | Choice                   | Rationale                                             |
| ------------ | ------------------------ | ----------------------------------------------------- |
| Frontend     | Svelte + Vite            | Fast build, small bundle, good PWA tooling            |
| Styling      | Tailwind CSS             | Utility-first, works well with static builds          |
| Feed parsing | GitHub Actions (Node.js) | Server-side parsing avoids CORS issues with RSS feeds |
| Persistence  | Google Drive API v3      | User-owned, no backend needed, OAuth from browser     |
| Hosting      | GitHub Pages             | Free, automatic deploys from Actions                  |
| CI/CD        | GitHub Actions           | Feed refresh + site deploy in one workflow            |

## Getting Started

### Prerequisites

- Node.js 20+
- A Google Cloud project with Drive API enabled
- A GitHub repo with Pages enabled

### Setup

```bash
git clone https://github.com/YOUR_USER/readly.git
cd readly
npm install
```

### Google OAuth Setup

1. Create a Google Cloud project
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials (Web application type)
4. Add your GitHub Pages URL as an authorized redirect URI
5. Copy the client ID to `.env` and to GitHub Actions secrets

### Local Development

```bash
npm run dev          # Start Vite dev server
npm run fetch-feeds  # Run the feed fetcher locally
```

### GitHub Actions Secrets

| Secret                 | Purpose                             |
| ---------------------- | ----------------------------------- |
| `GOOGLE_CLIENT_ID`     | OAuth client ID for Drive API       |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret                 |
| `GOOGLE_REFRESH_TOKEN` | Long-lived token for Actions worker |

## Project Structure

```
readly/
├── src/
│   ├── app.html
│   ├── lib/
│   │   ├── components/      # Svelte UI components
│   │   ├── stores/          # Svelte stores (feeds, state, auth)
│   │   ├── drive.ts         # Google Drive read/write helpers
│   │   ├── feed-parser.ts   # RSS/Atom normalization
│   │   └── types.ts         # Shared type definitions
│   └── routes/              # SvelteKit routes (static adapter)
├── worker/
│   ├── fetch-feeds.ts       # Actions entry point: fetch + build JSON
│   └── drive-sync.ts        # Actions-side Drive read/write
├── static/
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker
├── .github/
│   └── workflows/
│       └── refresh.yml      # Cron workflow: fetch feeds + deploy
├── CLAUDE.md
├── README.md
└── package.json
```

## Data Shapes

### config.json (Google Drive)

```json
{
	"feeds": [
		{
			"url": "https://example.com/feed.xml",
			"title": "Example Blog",
			"folder": "Tech",
			"added": "2025-01-15T00:00:00Z"
		}
	],
	"folders": ["Tech", "News", "Comics"],
	"preferences": {
		"refreshInterval": 30,
		"theme": "system",
		"defaultView": "unread"
	}
}
```

### state.json (Google Drive)

```json
{
	"read": ["entry-id-1", "entry-id-2"],
	"saved": ["entry-id-3"],
	"lastSync": "2025-01-15T12:00:00Z"
}
```

### Feed bundle (gh-pages branch)

```json
{
	"generated": "2025-01-15T12:00:00Z",
	"feeds": {
		"https://example.com/feed.xml": {
			"title": "Example Blog",
			"entries": [
				{
					"id": "stable-hash-of-url",
					"title": "Post Title",
					"url": "https://example.com/post",
					"published": "2025-01-14T00:00:00Z",
					"summary": "First 300 chars..."
				}
			]
		}
	}
}
```

## Ralph Loop Targets

This project is designed for autonomous AI iteration. Good loop candidates:

- **Feed parser** — Input: raw RSS/Atom XML. Output: normalized JSON. Completion: parsed output matches expected shape + round-trip tests pass.
- **Drive sync module** — Completion: read/write/merge cycle works against Drive API mock.
- **UI components** — Each component in isolation. Completion: renders without errors, screenshot matches reference.
- **Service worker** — Completion: offline mode serves cached feed bundle, Lighthouse PWA audit passes.
- **GitHub Actions workflow** — Completion: `act` runs the workflow locally and produces valid feed JSON.

## License

MIT
