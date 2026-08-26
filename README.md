# Flow Studio — policy & support site

Static, GitHub-Pages-hostable website that serves as the Google Play Store compliance/support
site for the Flow Studio app family. Plain HTML/CSS/JS, no build step, no backend. Every page
renders its content from JSON at runtime.

See [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) for the full spec history, the facts sourced
from the Money Flow app, and every content/architecture decision behind this build.

## Project structure

```
index.html            Site home (Flow Studio overview + featured apps)
apps.html              Full listing of every published app
apps/<app-id>/         One folder per app — index, privacy, terms, account-deletion,
                        support, faq, about — each a small identical shell page
404.html
assets/
  css/styles.css        Design tokens + every component style
  js/                    utils, theme, content, render, navigation, app (see below)
  images/brand/          Flow Studio wordmark (inline SVG, no external logo file)
  images/apps/<app-id>/  Per-app icon
data/
  site.json              { "activeBrand": "..." } — the one line that selects a brand
  brands/<brand-id>.json Site/company config + apps[] (a plain list of app id strings,
                          e.g. ["money-flow", "heal-flow"] — not the app content itself)
  apps/<app-id>.json     One file per app, holding all of that app's own content
                          (privacy, terms, faq, accountDeletion, support, features, ...)
docs/REQUIREMENTS.md  docs/CONFIG_CHECKLIST.md
robots.txt  sitemap.xml  .nojekyll
```

### JS modules

- `utils.js` — DOM helpers, date formatting, `withRoot()` path prefixing, no `innerHTML`.
- `theme.js` — light/dark/system, persisted in `localStorage`, no flash of wrong theme.
- `content.js` — fetches `data/site.json` → the active brand's `data/brands/<id>.json`, then
  fetches every app listed in that brand's `apps[]` from its own `data/apps/<app-id>.json` (in
  parallel), validates the assembled result, resolves which app a page belongs to.
- `render.js` — the only place JSON content becomes DOM. Whitelisted block types only
  (paragraph, bullets, numbered, notice, table, FAQ, feature grid, app card) — everything is
  built with `textContent`/DOM APIs, never `innerHTML`, so nothing in the JSON can execute.
- `navigation.js` — shared header, footer, mobile menu, breadcrumbs.
- `app.js` — per-page bootstrap: reads `<body data-page data-app-id>`, loads content, renders.

## How the multi-brand / multi-app model works

- `data/site.json`'s `activeBrand` names which file under `data/brands/` is live. To publish
  this same codebase under a different brand later: add `data/brands/<new-id>.json`, change
  `activeBrand`, redeploy. No HTML/CSS/JS edits.
- A brand's `apps[]` is just a list of id strings — the actual content for each one lives in
  its own `data/apps/<app-id>.json`, so apps are fully self-contained files, not entries
  buried inside a shared array. Two brands could even reference the same app id if that's ever
  useful.
- Each app also gets its own folder at `apps/<app-id>/` for its HTML pages. Every page in that
  folder is a thin, identical shell — no app content is hardcoded in HTML.
- Each app also has a `pages{}` map (`privacy`, `terms`, `accountDeletion`, `support`, `faq`,
  `about`) controlling which of those pages/nav items exist for that app.
- `accountDeletion.enabled` is separate from `pages.accountDeletion` — the deletion page
  itself should almost always stay enabled (Google Play Console needs a stable URL there),
  while `enabled: false` just changes which explanation renders on it for an app with no
  account system.

## Adding a new app

1. Create `data/apps/<new-id>.json` with the app's own content — see `data/apps/money-flow.json`
   or `data/apps/heal-flow.json` for the schema (`id`, `name`, `packageName`, `status`,
   `platforms`, `links`, `branding`, `metadata`, `pages{}`, `features[]`, `privacy`, `terms`,
   `accountDeletion`, `support`, `faq[]`, `dataSafety`). **Every claim in `privacy`/`terms`/
   `accountDeletion`/`faq` must trace back to that app's own audited code/docs — never copy
   another app's claims, they won't be true for a different app.**
2. Add `"<new-id>"` to the active brand's `apps[]` array in `data/brands/<brand-id>.json`
   (just the id string — the file above is what actually gets fetched).
3. Copy an existing app folder for the HTML shells, e.g. `apps/money-flow/` → `apps/<new-id>/`.
   In every copied file, change `data-app-id="money-flow"` to `data-app-id="<new-id>"`, the
   favicon `href`, the breadcrumb text, and `index.html`'s `<title>` — everything else
   (script tags, `FS_ROOT`, container ids) is the JS contract and stays identical.
4. Add an icon at `assets/images/apps/<new-id>/icon.png`.
5. Add the new app's URLs to `sitemap.xml` (`apps.html`'s listing needs no edit — it renders
   from `apps[]` automatically).
6. Commit. No CSS/JS changes required.

## Adding a new brand

1. Add `data/brands/<new-brand-id>.json` with its own `site` (name/branding/contact) and an
   `apps[]` list of id strings — reusing existing `data/apps/<id>.json` files, new ones, or a
   mix of both.
2. Add the brand's own logo under `assets/images/brand/` if different from the wordmark SVG.
3. Change `data/site.json`'s `activeBrand` to the new id, or deploy a separate copy of the
   repo with that one line changed — either way, no other files need to change.

## Editing content

Each app's content lives entirely in its own `data/apps/<app-id>.json` — that's the only file
to edit for any of the below.

- **Privacy Policy / Terms**: edit `privacy.sections[]` / `terms.sections[]`. Each section is
  `{ id, title, paragraphs?, bullets?, numbered?, notice?, table? }`.
  `id` becomes the anchor (`#id`) used by the on-page table of contents.
- **Account Deletion**: edit `accountDeletion.sections[]`; toggle `accountDeletion.enabled` to
  switch between the "here's how to delete/reset data" and "there is no account system"
  framings (the actual wording lives in `sections[]` either way).
- **FAQ**: edit the `faq[]` array (`{ question, answer }`).
- **Support**: edit `support.email`/`support.responseTime`/`support.topics[]`.

## Theme

Manual choice (System/Light/Dark) is stored in `localStorage` under `flow-studio-theme` and
applied via a tiny inline `<script>` in each page's `<head>`, before the stylesheet paints, to
avoid a flash of the wrong theme. `theme.js` wires up the switcher buttons after load.

## Testing locally

GitHub Pages compatible paths use `fetch()`, which browsers block on `file://` URLs — serve
the folder over HTTP instead:

```bash
cd app-sites/html
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Deploying to GitHub Pages

1. Push this folder's contents to a repository (or a `docs/`-style subfolder configured as the
   Pages source — either works, since every internal path is root-relative to wherever this
   folder is served from).
2. In the repo's Settings → Pages, set the source to the branch/folder containing these files.
3. Before publishing for real, fill in the fields intentionally left blank — see
   `docs/CONFIG_CHECKLIST.md` for the full list with exact file/field paths (site-wide
   `supportEmail`/`url` in `data/brands/<brand-id>.json`, each app's own `support.email`/
   `links.googlePlay` in its `data/apps/<app-id>.json`) — and update `sitemap.xml` with the
   real domain.
4. Optional custom domain: add a `CNAME` file at this folder's root containing the domain, and
   point its DNS at GitHub Pages per GitHub's custom-domain docs. `site.url` in the brand JSON
   should match whichever URL (the `github.io` one or the custom domain) is actually live.

## URLs

```
/index.html
/apps.html
/apps/money-flow/index.html
/apps/money-flow/privacy.html
/apps/money-flow/terms.html
/apps/money-flow/account-deletion.html
/apps/money-flow/support.html
/apps/money-flow/faq.html
/apps/money-flow/about.html
/apps/heal-flow/index.html
/apps/heal-flow/privacy.html
/apps/heal-flow/terms.html
/apps/heal-flow/account-deletion.html
/apps/heal-flow/support.html
/apps/heal-flow/faq.html
/apps/heal-flow/about.html
```
