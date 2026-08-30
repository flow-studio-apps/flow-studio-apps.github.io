# Requirements & decisions — Flow Studio policy/support site

This file is the durable reference for this project (`app-sites/html/`). It consolidates the
two spec messages that shaped this build, the decisions made to reconcile them, and the facts
sourced directly from the Money Flow app's own code/docs (nothing here was invented). Scope of
this document is this folder only — it does not describe or govern anything else in the
workspace.

## 1. What this site is

A static, GitHub-Pages-hostable website that serves as the official Google Play Store
compliance/support site for the "Flow Studio" app family, starting with **Money Flow**. No
backend, no database — plain HTML/CSS/JS, data-driven from JSON.

The site is **generated** from that JSON by `tools/build.js` (Node, no dependencies) and
deployed as complete static HTML. It previously rendered its content in the browser at
runtime; see §6 for what changed and why.

## 2. Source specs (both honored, reconciled where they differed)

1. `app-sites/todo.md` — the original ~1850-line spec. Multi-app site (`site.apps[]`),
   query-string routing (`privacy.html?app=<slug>`), detailed content-block model, dark/light
   theme system, accessibility and SEO requirements, "do not invent legal claims" rules.
2. A second, later chat message — same goals, phrased around a single app with clean page
   paths (`/privacy`, `/terms`, `/account-deletion`, `/contact`, `/faq`), a slightly different
   JSON schema sketch, and an explicit instruction to omit ungrounded legal fields
   (jurisdiction, governing law, refund policy) rather than invent them.

**Reconciliation used in this build:**
- Clean per-page `.html` files, matching spec #2's routing preference — but taken further than
  either spec's original sketch once a second app was actually added: each app gets its own
  folder (`apps/<app-id>/privacy.html`, etc.) rather than one shared set of root-level pages
  disambiguated by a `?app=` query string. The app id for a given page comes from
  `<body data-app-id="...">`, not the URL's query string (superseded the original `?app=`
  design once multiple real apps existed — see §6).
- `support.html` (not `contact.html`) is the canonical filename — matches spec #1 and Google
  Play Console's own terminology; nav label "Support" satisfies both.
- Content model: structured `{heading, paragraphs[], bullets[]}` sections rendered by a
  whitelisted renderer (spec #1 §5), not raw HTML in JSON.
- Missing/unconfirmed legal facts are represented as empty configurable fields or omitted
  sections (spec #2's explicit rule), never fabricated.

## 3. Decisions made with the user (this session)

| Decision | Answer |
|---|---|
| Which app(s) to build first | **Money Flow only.** Architecture must let more apps be added later by dropping in a JSON entry + icon — no HTML/CSS/JS changes. |
| Site model | **Full multi-brand hosting.** The same codebase must be able to power a separately-branded deployment (different name/logo/domain) later, switched via one config value — not a rebuild of components. |
| Brand name | **"Flow Studio"** — stored in JSON, not hardcoded, used as the umbrella developer/publisher identity in header/footer/copyright. |
| Legal/contact facts | Sourced from Money Flow's own docs/code first (see §4) rather than invented. Genuine gaps (support email, jurisdiction) are left as empty/omitted per spec #2's own rule, not blocked on. |

## 4. Facts sourced directly from `money-flow/` (cite-checked)

| Fact | Source | Value used on the site |
|---|---|---|
| App name | `app.json` | Money Flow |
| Package name | `app.json` → `android.package` | `com.moneyflow.app` — flagged in the app's own `docs/release/PLAYSTORE_LAUNCH.md` §3 as "a generic placeholder" that must change before publishing. Site marks the app `status: in-development` and shows no Google Play link. |
| Platform | no `ios/` dir; `app.json` has unbuilt iOS config | Android only |
| What it does | `README.md` | Offline-first personal finance tracker — accounts, transactions, budgets, goals, investments, loans/EMI, reports. Local SQLite (`expo-sqlite`). No login. |
| Data storage | `README.md`, `src/database/`, `src/services/backup/*` | Local SQLite + MMKV only, on-device. No backend. Optional Google Drive backup exists in code but is hardcoded disabled — verified directly in source: `src/services/backup/googleDriveBackupService.ts:24` `export const GOOGLE_DRIVE_BACKUP_ENABLED = false;`. |
| Backup encryption | `src/services/backup/backupEncryption.ts` (read directly, not just its module doc) | Every backup is **automatically** encrypted (`BACKUP_ENCRYPTION_ENABLED = true`, no user toggle) with AES, keyed via 2,000 rounds of chained SHA-256 over an app-embedded secret (`getAppBackupSecret()` — same across installs of a build, not a per-user password). Site's wording was corrected from "can optionally be encrypted" (implied a user choice that doesn't exist) to "automatically encrypted." |
| Crash/analytics | `src/services/crashReporting/index.ts`, `app.json extra.crashReporting` (read directly — `docs/modules/security.md` was found to reference a `backupPasswordService.ts` that doesn't actually exist in the codebase, so module docs alone aren't trusted here) | Firebase Crashlytics is wired up and `app.json` marks it `disabled: false` (enabled by default for a real release). It is provably inert **today** for two independent reasons: (1) `resolveProvider()` always returns a no-op provider in `__DEV__`; (2) no `google-services.json` exists in the repo, so a release build has no working Firebase project to report to. Site states both the current inert state and the future-enabled intent, rather than a flat "not configured." |
| Ads | `src/services/ads/adsConfig.ts` (read directly), `README.md` | `__DEV__` always serves Google's public test ad unit IDs; a real **release** build reads `extra.adUnitIds`, which today still holds Google's test IDs (no `MM_ADMOB_*` env override has been set) — so test-IDs-only is accurate for this repo's current configuration, not a hardcoded permanent stub. |
| Permissions | `android/app/src/main/AndroidManifest.xml` | `INTERNET`, `READ/WRITE_EXTERNAL_STORAGE` (maxSdk 32), `USE_BIOMETRIC`/`USE_FINGERPRINT`, `VIBRATE`, `SYSTEM_ALERT_WINDOW`; `allowBackup="false"`. |
| Account/login | grep across `app/`, `src/` | None — no auth flow, no account system. |
| Device integrity | `package.json` (`freerasp-react-native`, `jail-monkey`), `docs/modules/integrity.md` | Local root/tamper detection + Play Integrity API, device-local only, not used to identify or track users. |
| App-lock security | `docs/modules/security.md` | PIN salted + SHA-256 hashed, stored via `expo-secure-store`; biometric handled entirely by the OS. |
| Developer/legal entity | grep across whole repo; `LICENSE` names Expo/650 Industries (the template's license, not this app's); no About screen text; no `package.json` author field | Not found anywhere in the app repo. Site uses the brand name "Flow Studio" as the publicly displayed developer identity, per the user's decision. |
| Support/contact email | grep across whole repo, docs, `app.json`, manifests | Not found anywhere (only unrelated generic doc placeholders and developer git-commit emails, neither a designated support address). Left as an **empty, clearly-labeled config field** (`site.contact.supportEmail`, `apps[].support.email`) — mailto CTAs and the email display are conditionally rendered and simply omitted while empty. **Must be filled in before publishing.** |
| Governing law / jurisdiction | grep across whole repo | Not found. Terms page's Governing Law section is **omitted** rather than fabricated (add `terms.governingLaw` to the app JSON later if wanted). |
| Children's privacy stance | No accounts, no kid-targeted content, no live ad targeting | Standard factual default: "not directed at children; does not knowingly collect data from children" — describes current app behavior, not an invented compliance claim. |
| Reusable assets | `money-flow/assets/` | `icon.png` (1024×1024, the app's own real icon) copied into this site. No screenshots exist yet — that section is simply omitted, not faked. |

## 4b. Facts sourced directly from `heal-flow/` (second app, cite-checked)

`heal-flow`'s own `docs/legal/privacy-policy.md` is unusually strong: current, self-audited
with a per-claim source-file citation table, and already corrected once from a prior stale
version (it names what it used to wrongly claim). It was the primary content source for this
app — not rewritten boilerplate.

| Fact | Source | Value used on the site |
|---|---|---|
| Display name | `app.json` | HealFlow |
| Package name | `app.json` + `android/app/build.gradle` (the two agree here, unlike money-flow) | `com.appname.test` — `app.config.js` comments call this a local-dev placeholder. `status: in-development`, no store links. |
| Platform | both `android/` and `ios/` dirs exist | Android **and** iOS (money-flow is Android-only) |
| What it does | `src/database/schema.ts`, `help.aboutDescription` i18n string | Offline-first personal health record: blood pressure, weight, blood sugar, heart rate, temperature, height, symptoms, medications, plus documents (lab reports, prescriptions, scans, vaccination records). |
| Account/login | grep across `src/`; policy states it outright | None — no server, no accounts. |
| Data storage | `docs/legal/privacy-policy.md`, `src/database/schema.ts` | Local SQLite, **not encrypted** (no SQLCipher — the app's own policy says so plainly) + private file storage for documents. `allowBackup: false`. |
| Backup | `src/services/backup/backupService.ts`, policy | Local zip file, **not encrypted**, shared only on explicit user action, no cloud upload. |
| CSV/PDF export | `src/config/featureFlags.ts` | `EXPORT_ENABLED = false` — built but off. **Not described as available anywhere on the site.** |
| App Lock | `src/services/security/pinService.ts`, `biometricService.ts`, policy | PIN salted+SHA-256 hashed via `expo-secure-store`; biometric via device OS. Policy explicitly notes it does **not** encrypt the DB and does **not** block screenshots/recent-apps preview — kept as a stated limitation, not softened. |
| Analytics | `src/store/useAnalyticsStore.ts` (read directly) | User-facing toggle (Settings → Privacy → Share usage data) **defaults ON/opt-out** — verified directly in source (`DEFAULT_STATE.analyticsEnabled = true`, with the comment explaining why: no health data or identity collected, so an opt-in wall costs a decision for no privacy gain). Separately, `src/analytics/analyticsConsent.ts` documents a build-time `ANALYTICS_ENABLED` flag that **defaults OFF** and isn't set in this repo — so no analytics is transmitted today regardless of the on-by-default user setting. Both halves are stated on the site, not just one. |
| Crash reporting | `docs/legal/privacy-policy.md`'s citation table (`useCrashReportingStore.ts` defaults disabled) | Off by default, opt-in only; inert today (no Firebase project config in repo) — same framing as money-flow's Crashlytics section. |
| Remote Config / Ads | policy, `src/config/ads.ts` | Remote Config reads one ads-enabled boolean only, no health data. AdMob present, test ad unit IDs only, explicitly isolated from health records (`src/tests/ads/healthDataIsolation.test.ts` per the app's own citation table). |
| Permissions | `AndroidManifest.xml` | `INTERNET`, `READ/WRITE_EXTERNAL_STORAGE` (maxSdk 32), `USE_BIOMETRIC`, `USE_FINGERPRINT`, `VIBRATE`. `RECORD_AUDIO` and `SYSTEM_ALERT_WINDOW` are explicitly removed (`tools:node="remove"`) — stated positively in the Permissions section. |
| Device integrity checks | grep for freerasp/jail-monkey in `package.json` | Not present in this app (unlike money-flow) — no such section written, to avoid claiming a check that doesn't exist. |
| Developer/legal entity | `.env.production.example` (blank), `src/config/appInfo.ts` (deliberately returns `undefined`) | Not found — same resolution as money-flow: "Flow Studio" is the publicly displayed brand. |
| Support email | `.env.production.example` (blank); only test-fixture emails in `src/tests/*` | Not found — empty config field. |
| Terms of Service | repo-wide search | Does not exist. A genuine **medical disclaimer** does (`docs/legal/disclaimer.md`) — used as the Terms page's core disclaimer section in place of a generic ToS clause. No governing-law section (still unknown) — omitted. |
| Account/data deletion | no dedicated screen (no accounts) | Built from the real "Delete All Data" flow text in `docs/legal/privacy-policy.md` / `help.body`. |
| Children's privacy | grep for child/kid/minor/coppa — no relevant hits | General-audience tool, same factual-default framing as money-flow. |
| Reusable assets | `heal-flow/assets/images/icon.png` (1024×1024, confirmed via `file`) | Path differs from money-flow's (`assets/icon.png`) — not copy-pasted blindly. |

## 5. Existing draft content reused (not rewritten from scratch)

`web-sites/next-site/src/data/apps/money-flow.json` already contained an audited, structured
Privacy Policy / Terms / FAQ / Data-Deletion draft for Money Flow, in the same
`{heading, body[]}` shape this site's content model uses. Its four unresolved bracket
placeholders were each resolved per §4 above (effective date = this build's date; support
email = empty config field; jurisdiction section = omitted; children's stance = the factual
default). Content was reworded to fit this site's block schema (`heading`→`title`,
`body`→`paragraphs`), not copied as raw HTML.

## 6. Architecture

Reflects the current, built state. This section has been updated three times since the initial
build: once to move each app's pages into their own folder (`apps/<id>/*.html` instead of flat
root-level pages + `?app=` query string), once to split each app's content out of the brand
file into its own `data/apps/<id>.json`, and once to move rendering from the browser into a
build step (§6a).

```
app-sites/
├── tools/build.js            the generator — reads data/, writes every page + sitemap + robots
└── html/                     the deployable site
    ├── index.html  apps.html  404.html          ← generated
    ├── apps/
    │   ├── money-flow/    index privacy terms account-deletion support faq about (.html)
    │   └── heal-flow/     same seven pages      ← all generated
    ├── assets/
    │   ├── css/styles.css
    │   ├── js/
    │   │   ├── theme.js     light/dark/system, localStorage, no-flash; drives both
    │   │   │                switcher forms (radiogroup, and the compact cycle button)
    │   │   └── site.js      behaviour only — mobile menu + focus trap, header auto-hide,
    │   │                    FAQ accordion, policy TOC scroll-spy. Renders nothing.
    │   └── images/
    │       ├── brand/            Flow Studio wordmark (SVG, inlined into each page at build)
    │       └── apps/<app-id>/    icon.png (1024px master, store assets only — never
    │                             referenced by a page), icon-96/192/512.png, favicon-32.png
    ├── data/                 ← the only hand-edited content
    │   ├── site.json                { "activeBrand": "flow-studio" }
    │   ├── brands/flow-studio.json  site/company config + apps[] (a list of id strings only)
    │   └── apps/
    │       ├── money-flow.json      full content for one app — self-contained
    │       └── heal-flow.json       same shape, separate file
    ├── docs/REQUIREMENTS.md  docs/CONFIG_CHECKLIST.md
    ├── robots.txt  sitemap.xml      ← generated from site.url
    └── .nojekyll  README.md
```

Every `.html` file, plus `sitemap.xml` and `robots.txt`, is build output and carries a
`<!-- Generated by tools/build.js -->` comment. Do not hand-edit them; edit `data/` (or the
generator) and rerun `node tools/build.js`.

### 6a. Why the build step

The runtime-rendering design shipped every page as an empty shell whose content arrived through
a three-level fetch waterfall (`site.json` → brand → app files). That had four consequences
serious enough to justify replacing it:

1. **A privacy policy URL handed to Play Store review was blank without JavaScript.** These
   pages exist to be durable, crawlable legal documents; a fetch failure or a JS-off client
   yielded an empty policy.
2. **No page emitted a `<meta name="description">` or a canonical** in its static HTML — both
   were injected after data loaded, and the canonical was never passed a value at all.
3. **Every page downloaded both app JSON files** (~400 lines each) to render one app, with
   revalidation forced on all four files on every navigation.
4. **Adding an app meant hand-writing seven HTML files**, each hardcoding a title, a favicon
   path and breadcrumbs — directly contrary to the data-driven goal in `todo.md`.

The generator resolves all four at once. It escapes every JSON-sourced string on the way out
(same guarantee the old `render.js` gave via `textContent`), and it **fails the build** rather
than emitting a broken page if an app sets `pages.privacy: true` without a `privacy.sections[]`
— and likewise for every other page key.

Client JS is now behaviour only. No page content depends on it.

### 6b. Per-page contract

Each generated page carries `<body data-page="..." data-app-id="..." data-app-accent
style="--app-accent: ...; --app-accent-solid: ...">`. `data-page`/`data-app-id` are retained as
a debugging/inspection aid; the accent custom properties are what the CSS actually consumes.
`window.FS_ROOT` is gone — relative paths are resolved at build time per page depth.

### Multi-brand model

`data/site.json` holds one line — `activeBrand` — naming which file under `data/brands/` is
live. To deploy this same codebase under a different brand later: add
`data/brands/<new-brand-id>.json` (own name/logo/colors, plus an `apps[]` list of id strings —
new ones or existing `data/apps/*.json` files reused), change `activeBrand`, redeploy. No
HTML/CSS/JS changes required.

### Per-app content files

A brand's `apps[]` is intentionally just an array of plain id strings, not embedded objects —
`tools/build.js` reads the brand file, then reads every listed id's own `data/apps/<id>.json`.
This keeps each app's privacy/terms/FAQ/etc. content in its own file, which is easier to
review, diff and hand off per app.

### Per-app page toggles

Each app entry has a `pages{}` map (`privacy`, `terms`, `accountDeletion`, `support`, `faq`,
`about`) controlling whether that page/nav item exists at all for that app. This is separate
from `accountDeletion.enabled`, which only controls which explanation renders **within** the
account-deletion page — that page always exists (when `pages.accountDeletion` is true) because
Google Play Console needs a stable URL there even for apps with no account system.

### Adding a new app

See `README.md`'s "Adding a new app" section for the current step-by-step: create
`data/apps/<id>.json`, reference its id in the brand's `apps[]`, add the icon set, and run
`node tools/build.js`. **No HTML is written or copied** — the app's seven pages, its nav and
footer links across the whole site, its cards and its sitemap entries are all generated.

The content rule doesn't change: **every claim must be sourced from that app's own code —
never copy another app's claims**, they won't be true.

## 7. Content rules (non-negotiable, from both specs)

- Every claim must trace to a real fact (§4 table, or the equivalent audit for a future app).
- No fabricated legal/compliance claims (GDPR/HIPAA/SOC2/"anonymous analytics"/"no tracking")
  unless explicitly present in the JSON.
- No fake testimonials, statistics, "trusted by thousands", stock-photo hero sections.
- Missing optional data → omit the section/link/card, never render an empty placeholder.
- Structured content only — no raw HTML strings in JSON. Every JSON-sourced string is
  HTML-escaped by the generator, so nothing in the data can inject markup or script.
- Missing or inconsistent data fails the build loudly (`pages.<key>: true` with no matching
  content block), rather than reaching a visitor as a broken page. A brand's `apps[]`
  referencing a `data/apps/<id>.json` that doesn't exist aborts the build for the same reason.
- Content objects carry `is_active`. Absent means active; only an explicit `false` hides the
  entry, so data written before the flag existed keeps rendering.

## 8. Open items to fill in before publishing (not blocking this build)

- `site.contact.supportEmail` / `apps[].support.email` — currently empty. The affected mailto
  CTAs are simply not generated while empty, but a live support address is the whole point of
  this site.
- `apps[].links.googlePlay` — once Money Flow is actually published (its package name is also
  still a placeholder per the app's own `PLAYSTORE_LAUNCH.md`).
- `terms.governingLaw` — optional; add later if wanted.

Resolved: `site.url` is set to `https://flow-studio-apps.github.io` (a GitHub Pages *user*
page, hence the root-absolute asset paths in `404.html`). It is the single source for every
canonical, `og:url`, and `sitemap.xml`/`robots.txt` entry — change that one field and rebuild
to move the site to a project page or a custom domain.
