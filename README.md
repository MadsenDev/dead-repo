# Dead Repo

> Autopsy your abandoned GitHub repositories.

Dead Repo monitors the vital signs of projects on your GitHub account, classifies lifecycle state, and builds a grim dashboard around repos that have slowed down, flatlined, or died.

![Dead Repo — autopsy view](screenshot.png)

## Current Status

### Implemented

- GitHub-connected dashboard with repo lifecycle classification
- Browser-based local development flow using a GitHub personal access token and local scan-result caching
- Repo enrichment for commit activity, last commit message, contributor counts, branch counts, and open PR counts
- Adjustable triage thresholds
- Death certificate export
- Onboarding flow, settings, and multiple voice modes

### Heuristic / fallback-driven

- Cause-of-death scoring is heuristic, not sourced from GitHub metadata directly
- Sparklines can fall back to generated visual traces when commit activity is unavailable
- File activity / decay in connected mode is estimated, not fetched from actual file history

### Not yet implemented as real connected data

- Outdated dependency counts
- Real file-level decay analysis from repository history
- Hosted production auth/session strategy for true "Login with GitHub"

## Features

- **Triage dashboard** — live overview of alive, fading, flatlined, and declared-dead repos
- **Autopsy view** — differential diagnosis with multi-cause confidence scoring, commit timeline, estimated file activity, dependency section with real manifest counts where available
- **Death certificates** — printable/exportable, voice-aware, stamped DECEASED
- **5 personality voices** — Neutral, Monday (brutal), Super Supportive (unhinged), Surfer, Professional
- **GitHub-connected mode** — real live data via read-only scopes (`repo`, `read:user`, `read:org`)
- **Year in review** — Wrapped-style breakdown of your year in abandoned projects

## Stack

- **React** + **Vite**
- Local development token flow with optional future GitHub OAuth client ID
- CSS custom properties + oklch color system
- IBM Plex Mono / IBM Plex Sans

## Getting Started

### Prerequisites

- Node.js 18+
- A GitHub personal access token with `repo`, `read:user`, and `read:org`

### Install

```bash
npm install
```

### Configure

Create a local `.env` file from `.env.example` if you want to keep a future GitHub OAuth client ID in local config:

```bash
cp .env.example .env
```

Then edit `.env`:

```bash
VITE_GITHUB_CLIENT_ID=your_client_id
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

Output goes to `dist/`.

## OAuth Scopes

| Scope | Why |
|---|---|
| `repo` | Read repository metadata, commits, branches |
| `read:user` | Read your profile (name, avatar) |
| `read:org` | List organizations and their repos |

For local development, the browser app stores the user-supplied GitHub token in local browser storage.
GitHub's OAuth token endpoints do not allow the browser-only token exchange this app would need for a pure static "Login with GitHub" flow, so a backend or serverless auth endpoint is still required for that production path.

## Repo Classification

| State | Condition |
|---|---|
| Alive | Last push ≤ 30 days ago |
| Fading | Last push 31–90 days ago |
| Flatlined | Last push 91–365 days ago |
| Dead | Last push > 365 days ago, or archived |

## Cause of Death

Repos are diagnosed against 11 independent signals — each scored 0–100% confidence. Up to 3 contributing causes are surfaced per repo.

Signals: `Never Started`, `Existential Crisis`, `Experiment / POC`, `Lost Interest`, `Scope Inflation`, `Maintenance Fatigue`, `Burnout`, `Abandoned`, `Superseded`, `Archived`, `Shipped & Archived`.

## Notes

- Connected sessions hydrate from cached scan data first, then refresh in the background.
- Some sections are intentionally conservative about missing data and will show unavailable or estimated states instead of fabricated live values.
- This repo is now a web app, not an Electron desktop app.

## License

MIT
