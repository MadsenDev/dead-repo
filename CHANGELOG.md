# Changelog

## Unreleased

### Added

- Super Supportive voice now takes over the app: 12 floating hearts drifting up from the bottom at all times, a fixed banner below the titlebar with rotating clingy messages (context-aware for graveyard/morgue pages and open repos), nav items lean in on hover, alive stat cards glow pink, and all copy pushed to full unhinged territory.
- Added three new voice personalities: Therapist ("How does that make you feel?"), Deeply Moved ("I just need a moment. (sobbing)"), and Victorian ("Here lies another unfinished dream.") — each with full copy across all UI sections and a distinct death certificate.
- Deeply Moved (weepy) voice takes over the app: 12 falling teardrops drifting down from the top, a fixed banner with rotating sobbing messages (context-aware for graveyard/morgue/open repo), blue watery color accent, and fully emotional copy throughout.
- All display preferences (voice, accent, density, theme, default page, scan limit, columns, date format) now persist to localStorage across sessions.
- Light theme — flips all bg/fg variables, titlebar gradient, and EKG base color; toggled via Settings → Appearance.
- Default landing page — choose which page opens on app load (dashboard, ward, hospital, morgue, graveyard).
- Scan limit — cap GitHub repo fetch at 100, 250, or 500 per sync.
- Table column visibility — toggle status, vitals, activity, last commit, lifespan, and stars columns on/off.
- Date format — repo table "last commit" column shows relative, absolute, or both formats.
- Density setting now functional — `dense` tightens padding/font sizes across tables, panels, nav, and stat cards; `sparse` opens them up.
- Added Print button to death certificate modal — renders on white paper via `@media print` with full light-theme override.
- Death certificate now fully adapts to the active voice/tone — title, section labels, stamp, footer, and caption all vary per personality.
- Added repo-local guidance in `AGENTS.md` and `CLAUDE.md` to keep this changelog updated.
- Added repo-local guidance to track major follow-up work in `TODO.md`.
- Added `.env.example` for local GitHub client configuration in web development.
- Added live GitHub enrichment for per-repo commit activity, last commit message, contributor counts, branch counts, and open pull request counts.
- Added local scan-result caching with last-scan timestamps so connected sessions can hydrate from cached data before background refresh.
- Added a built-in `node --test` classification test suite and wired it to `npm test`.
- Added lazy file-history sampling for connected autopsy views so file activity can be derived from recent GitHub commits when a live repo is opened.

### Fixed

- Death certificate modal top getting cut off when taller than the viewport — changed flex alignment from `center` to `flex-start` so the modal scrolls from the top.

### Changed

- Removed the Electron shell and converted the project back to a plain Vite web app.
- Replaced the removed desktop auth path with a browser-based local-development token flow, and documented that real web "Login with GitHub" still needs a backend or serverless exchange endpoint.
- Reset the app version from the old mock `2.4.1` branding to `0.1.0` across package metadata and UI copy.
- Reworked GitHub sign-in so credentials are read from environment configuration instead of being embedded in source.
- Made triage thresholds in Settings persist locally and actively reclassify repositories instead of acting as dead controls.
- Improved connected-mode data quality by preferring real GitHub-backed metrics where available and only falling back for visual-only elements like sparklines.
- Improved connected-mode dependency reporting by parsing declared dependency counts from common root manifests (`package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`) when available.
- Updated the top-right EKG trace to render a clearer heartbeat waveform with a stronger glow and baseline.
- Fixed relative date displays and timeline rendering to use the real current date instead of a hardcoded mock date.
- Fixed lifespan sorting to sort by actual repository lifetime rather than commit-count placeholders.
- Updated README and connected-mode UI copy to distinguish real GitHub-backed data from estimated or unavailable sections.
- Centralized app version usage so UI strings read from a shared package version source instead of hardcoded literals.
- Reworked the Wrapped report to derive yearly stats, causes, heatmap activity, and longest-survivor summaries from actual repository data instead of fixed mock 2025 values.
- Refined Wrapped lifespan ranking to prefer actual commit-activity windows over raw repo creation dates when weekly activity data is available.
- Refined Wrapped lifespan ranking again to prefer actual first/last commit dates from the commits API, avoiding inflated lifespans for repos that were created long before their real work window.
- Upgraded the Wrapped experience with stronger slide motion, animated heatmap/bar reveals, and count-up numerics for the headline stats.
- Added per-slide animated background treatments to Wrapped and expanded the tone system so each voice now delivers slide-specific copy instead of sharing mostly global text.
- Added real slide-to-slide transition motion in Wrapped so advancing between cards now animates outgoing and incoming panels instead of only reanimating slide contents.
- Updated connected autopsy file activity to prefer real recent commit-file data, while explicitly labeling fallback estimates when live history is unavailable.

### Fixed

- Fixed empty connected GitHub accounts falling back to demo mode instead of showing a valid live empty state.
- Fixed autopsy and certificate views to handle missing live metrics more honestly instead of presenting fabricated values as real data.
- Fixed dead UI actions by removing non-functional controls and wiring “View on GitHub” to open externally.
- Standardized GitHub session storage on browser `localStorage` for the web app build.
- Fixed GitHub sync failure handling so rate limits and partial enrichment no longer behave like expired auth sessions, and partial results remain usable.
