# Config checklist — fields left for you to fill in

Site-wide fields live in **`data/brands/flow-studio.json`**. Each app's own fields live in its
own file — **`data/apps/money-flow.json`** and **`data/apps/heal-flow.json`** — not nested
inside the brand file (the brand file's `apps[]` is just `["money-flow", "heal-flow"]`, a list
of ids; each app is a fully separate file). No HTML/CSS/JS changes needed for anything below.
Nothing here was guessed — these were left blank/placeholder on purpose because the real value
doesn't exist anywhere in the respective app's repo (see `docs/REQUIREMENTS.md` §4/§4b for the
sourcing) or is a business decision only you can make.

## Required before publishing

The site works and looks complete without these — the affected CTAs/links are simply hidden —
but Google Play Console needs real values here, and a live support email is the whole point of
this site.

| Field | File | Current value | What to put there |
|---|---|---|---|
| `site.contact.supportEmail` | `data/brands/flow-studio.json` | `""` | The real inbox you want users' support emails to land in. Also used as the site-wide fallback contact for both apps. |
| `site.contact.privacyEmail` | `data/brands/flow-studio.json` | `""` | Can be the same address as `supportEmail`, or a separate one if you want privacy questions routed differently. |
| `support.email` | `data/apps/money-flow.json` | `""` | Per-app support email for Money Flow. Leave empty to fall back to `site.contact.supportEmail` automatically. |
| `support.email` | `data/apps/heal-flow.json` | `""` | Same, for HealFlow. Given HealFlow handles health data, consider whether you want a dedicated address here rather than sharing the site-wide one. |
| `site.url` | `data/brands/flow-studio.json` | `""` | The canonical URL once deployed — either `https://<username>.github.io/<repo>/` or your custom domain. Used for SEO canonical tags and Open Graph metadata. |
| `links.googlePlay` | `data/apps/money-flow.json` | `null` | Money Flow's Play Store listing URL, once actually published. |
| `links.googlePlay` | `data/apps/heal-flow.json` | `null` | HealFlow's Play Store listing URL, once actually published. |
| `links.website` (optional) | `data/apps/heal-flow.json` | `null` | HealFlow's App Store listing, if you publish to iOS — there's no dedicated `appStore` field yet (see "Schema follow-ups" below). |

Until each Google Play link is set, its "Get it on Google Play" button stays hidden rather than
linking to a nonexistent listing.

## Worth checking before you publish (app identity)

| Field | File | Current value | Why it matters |
|---|---|---|---|
| `packageName` | `data/apps/money-flow.json` | `"com.moneyflow.app"` | Money Flow's own `docs/release/PLAYSTORE_LAUNCH.md` flags this as a generic placeholder that must change before the first upload — package names are permanent once published. |
| `packageName` | `data/apps/heal-flow.json` | `"com.appname.test"` | HealFlow's `app.config.js` calls this a local-dev placeholder too, overridden by `ANDROID_PACKAGE`/`IOS_BUNDLE_ID` env vars for a real build — update this field to match whatever you actually ship for both Android and iOS. |
| `status` | both `data/apps/*.json` | Both `"in-development"` | Change to `"published"` once live (unlocks the `published` badge styling) or `"beta"` during a testing track. |
| `metadata.version` | both `data/apps/*.json` | Both `"1.0.0"` | Keep in sync with the version you actually ship. |
| `metadata.lastUpdated` | both `data/apps/*.json` | Both `"2026-08-25"` | Bump whenever you meaningfully update the respective app. |

## Content dates (bump only when the underlying text actually changes)

| Field | File | Current value | Notes |
|---|---|---|---|
| `privacy.effectiveDate` | both `data/apps/*.json` | Both `"2026-08-25"` | Update whenever you edit that app's `privacy.sections[]`. |
| `terms.effectiveDate` | both `data/apps/*.json` | Both `"2026-08-25"` | Same rule, for `terms.sections[]`. |

## Optional — add only if/when true

| Field | File | Current state | How to add it |
|---|---|---|---|
| Governing law / jurisdiction | `terms.sections[]` in either `data/apps/*.json` | No section exists — intentionally omitted, not just empty | Append `{ "id": "governing-law", "title": "Governing Law", "paragraphs": ["These Terms are governed by the laws of <your jurisdiction>, without regard to conflict of law principles."] }`. Don't add this until you actually know the jurisdiction. |
| `screenshots` | both `data/apps/*.json` | Both `[]` (field may not be present — add it if not) | Add file paths once you have real screenshots, then place the image files there. Empty/absent stays fine — the site just omits that section. |
| `links.website` | both `data/apps/*.json` | Both `null` | Only if either app gets its own dedicated marketing site separate from this one. |
| `site.social` | `data/brands/flow-studio.json` | `{}` | Only add real, live social links — never placeholders. |
| `site.legalName` / `site.name` | `data/brands/flow-studio.json` | Both `"Flow Studio"` | Change if you ever want the publicly-displayed developer/brand name to differ from the site's own name. |

## If you ever turn on a currently-disabled feature

These aren't blank fields to fill in — they're places in the JSON that must be **rewritten**
(not just filled in) the day the underlying app behavior actually changes, because the current
text explicitly describes these features as off or inert.

### Money Flow (`data/apps/money-flow.json`)

| Feature | Where the text lives | What changes when you flip it on |
|---|---|---|
| Google Drive backup (`GOOGLE_DRIVE_BACKUP_ENABLED` in app code) | `privacy.sections[]` → `cloud-backup-google-drive`; `accountDeletion.sections[]` → `cloud-backup-data`; FAQ "Does Money Flow upload my data anywhere?" | Rewrite to describe what's uploaded, when, and how a user can delete it from their Google Drive. |
| Live ads (currently test ad unit IDs only) | `privacy.sections[]` → `advertising`; FAQ "Does Money Flow show ads?" | Rewrite to state real ads are live and what identifiers are processed. |
| Crashlytics (inert — no `google-services.json`, always no-op in dev) | `privacy.sections[]` → `crash-and-error-reporting`; FAQ "Does Money Flow upload my data anywhere?"; `dataSafety.notes` | Rewrite to state crash/device data is now collected; add an entry to `dataSafety.dataCollected[]`; update the real Play Console Data Safety form. |

### HealFlow (`data/apps/heal-flow.json`)

| Feature | Where the text lives | What changes when you flip it on |
|---|---|---|
| Analytics (user setting defaults on, but build-time `ANALYTICS_ENABLED` defaults off and isn't set here) | `privacy.sections[]` → `analytics`; FAQ "Does HealFlow upload my health records anywhere?"; `dataSafety.notes` | Once `ANALYTICS_ENABLED` is set at build time **and** a real Firebase project config is added, rewrite the last paragraph of the `analytics` section (drop the "not transmitted today" claim) and add an entry to `dataSafety.dataCollected[]`. |
| Crashlytics (off by default, and inert regardless — no Firebase project config) | `privacy.sections[]` → `crash-reporting`; `dataSafety.notes` | Once a real Firebase project config exists, rewrite the last paragraph of the `crash-reporting` section; the off-by-default framing itself stays correct either way since that's a genuine user-facing default, not something this change alters. |
| Live ads (currently test ad unit IDs only) | `privacy.sections[]` → `remote-configuration-and-advertising`; FAQ "Does HealFlow show ads?" | Rewrite to state real ads are live. |
| CSV/PDF export (`EXPORT_ENABLED = false` in app code — currently not mentioned anywhere on the site at all) | Not present in `features[]` or any section today | Once shipped, add an "Export" feature entry and a short Privacy Policy section describing what's exported and how (the app's own `docs/legal/privacy-policy.md` should be updated first, then mirrored here). |

## Schema follow-ups (not blocking, just noted)

- There's no dedicated `links.appStore` field yet — only `links.googlePlay`/`links.website`.
  HealFlow ships on iOS too, so if/when it's on the App Store, either reuse `links.website` for
  that URL or extend the schema (`render.js`'s `renderAppCard` and `app.js`'s hero rendering
  would need one small addition each to show an "On the App Store" button/link).

## Adding a third app or a new brand

See `README.md`'s "Adding a new app" / "Adding a new brand" sections for the full step-by-step.
