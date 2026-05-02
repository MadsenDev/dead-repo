# Changelog

## Unreleased

### Added

- Added repo-local guidance in `AGENTS.md` and `CLAUDE.md` to keep this changelog updated.
- Added `.env.example` and repo-local `.env` / `.env.local` loading in the Electron main process for GitHub OAuth configuration.
- Added live GitHub enrichment for per-repo commit activity, last commit message, contributor counts, branch counts, and open pull request counts.

### Changed

- Reset the app version from the old mock `2.4.1` branding to `0.1.0` across package metadata and UI copy.
- Reworked GitHub OAuth so credentials are read from environment configuration instead of being embedded in source.
- Made triage thresholds in Settings persist locally and actively reclassify repositories instead of acting as dead controls.
- Improved connected-mode data quality by preferring real GitHub-backed metrics where available and only falling back for visual-only elements like sparklines.
- Updated the top-right EKG trace to render a clearer heartbeat waveform with a stronger glow and baseline.
- Fixed relative date displays and timeline rendering to use the real current date instead of a hardcoded mock date.
- Fixed lifespan sorting to sort by actual repository lifetime rather than commit-count placeholders.

### Fixed

- Fixed empty connected GitHub accounts falling back to demo mode instead of showing a valid live empty state.
- Fixed autopsy and certificate views to handle missing live metrics more honestly instead of presenting fabricated values as real data.
- Fixed dead UI actions by removing non-functional controls and wiring “View on GitHub” to open externally.
