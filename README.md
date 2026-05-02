# Dead Repo

> Autopsy your abandoned GitHub repositories.

Dead Repo monitors the vital signs of projects on your GitHub account, classifies lifecycle state, and builds a grim dashboard around repos that have slowed down, flatlined, or died.

![Dead Repo — autopsy view](screenshot.png)

## Current Status

### Implemented

- GitHub-connected dashboard with repo lifecycle classification
- Connected sync with local session storage and local scan-result caching
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
- Safer desktop-native auth flow that avoids client-secret-based installed-app assumptions

## Features

- **Triage dashboard** — live overview of alive, fading, flatlined, and declared-dead repos
- **Autopsy view** — differential diagnosis with multi-cause confidence scoring, commit timeline, estimated file activity, dependency section with real manifest counts where available
- **Death certificates** — printable/exportable, voice-aware, stamped DECEASED
- **5 personality voices** — Neutral, Monday (brutal), Super Supportive (unhinged), Surfer, Professional
- **GitHub OAuth** — real live data via read-only scopes (`repo`, `read:user`, `read:org`)
- **Year in review** — Wrapped-style breakdown of your year in abandoned projects

## Stack

- **Electron** + **React** + **Vite**
- GitHub OAuth via local callback server configured from `.env`
- CSS custom properties + oklch color system
- IBM Plex Mono / IBM Plex Sans

## Getting Started

### Prerequisites

- Node.js 18+
- A GitHub OAuth app ([create one here](https://github.com/settings/developers))
  - Callback URL: `http://localhost:3000/callback`

### Install

```bash
npm install
```

### Configure

Create a local `.env` file from `.env.example` and set your GitHub OAuth credentials:

```bash
cp .env.example .env
```

Then edit `.env`:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_REDIRECT_URI=http://localhost:3000/callback
```

### Run

```bash
npm run dev
```

### Build

```bash
npm run build
```

Output goes to `release/`.

## OAuth Scopes

| Scope | Why |
|---|---|
| `repo` | Read repository metadata, commits, branches |
| `read:user` | Read your profile (name, avatar) |
| `read:org` | List organizations and their repos |

The client secret never reaches the renderer process. It is read by the Electron main process from local environment configuration.

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

## License

MIT
