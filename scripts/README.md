# Scripts (build & API)

**Where to run:** On your computer, in a terminal. Open the **project root** (`html-to-api/`) and run the commands from there. Not on the WordPress server.

## Single build command (all steps)

```bash
cd /path/to/html-to-api
npm run build
```

Runs `build-blog-list.js` then `build-blog-singles.js`. See `ai-reference/deployment-strategy.md` for deploy workflow.

---

Run all scripts from the **project root** (`html-to-api/`).

## check-api.js (Sprint 1)

Verifies that the WordPress REST API is reachable.

```bash
node scripts/check-api.js
```

- Reads `apiBase` from `config.json`. Override with env: `WP_API_BASE=<url>`.
- Requires Node 18+ (uses built-in `fetch`).
- For local WP with self-signed HTTPS, you may need: `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/check-api.js` (use only in dev).

## wp-content.js (Sprint 2, browser)

Lives in `src/js/blog/wp-content.js`. Loaded by `blog.html`; reads `data-wp-api-base` from `#blog-list`, fetches `GET /wp/v2/posts?per_page=3`, logs result in the console. Proof-of-fetch only (no DOM rendering). Open `blog.html` in a browser and check DevTools → Console.

## build-blog-list.js (Sprint 3, build-time)

Fetches posts from the WP API and injects the blog list into `blog.html`. First N posts in HTML; all posts (with meta) in JSON for filter + Load more.

```bash
node scripts/build-blog-list.js
```

- Reads `apiBase` from `config.json` (or `WP_API_BASE`). Fetches `GET /wp/v2/posts?per_page=30&_embed`.
- First N posts in HTML; **all** posts (with meta: categories, tags, date) written to `data/blog-list-more.json`. Filter bar (Kategorie, Schlagwort) + Load more uses `src/js/filters/filter-archive-blog.js`.
- **Multi-tab note:** On simple local dev servers (Python, PHP built-in), Load more can hang when blog.html is open in two tabs. Use `npx serve` or similar; production (Hostinger, Netlify) has no issue. See `ai-reference/bug-blog-load-more-multi-tab.md`.
- Override TLS for local WP: `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/build-blog-list.js`.

## build-blog-singles.js (Sprint 4, build-time)

Generates one static HTML page per post in `blog/<slug>.html`.

```bash
node scripts/build-blog-singles.js
```

- Fetches `GET /wp/v2/posts?per_page=20&_embed`, reads `blog-api.html` as template, fills `<title>`, `#post-title`, featured image, `#post-content` (post body), writes each to `blog/<slug>.html`. Relative links in the template are prefixed with `../` so CSS, assets, and nav work from the subdir. For local WP: `NODE_TLS_REJECT_UNAUTHORIZED=0 node scripts/build-blog-singles.js`.
