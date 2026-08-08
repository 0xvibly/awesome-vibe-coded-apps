# Contributing to Awesome Vibe-Coded Apps

Thanks for your interest! This list works a little differently from most awesome lists: **the README is auto-generated daily** from the live [vibeking.fun](https://vibeking.fun) directory by [`scripts/generate.js`](./scripts/generate.js). Hand-edits to `README.md` will be overwritten on the next sync.

## How to add an app

Don't open a PR against `README.md` — submit the app to the directory instead:

1. Go to [vibeking.fun/submit](https://vibeking.fun/submit)
2. Submit your app (free; approved listings get community upvotes and an embeddable badge — put the badge on your own site and your listing's outbound link becomes a followed link, see [Verified Makers](https://vibeking.fun/verified))
3. Once approved and upvoted into a category's top 15, it appears here automatically on the next daily sync

The generator reads the directory through its free public API — [docs](https://vibeking.fun/api), [reference repo](https://github.com/0xvibly/vibeking-api).

### Guidelines for submissions

- **The app must be publicly reachable** — no dead links, no waitlist-only pages
- **It should genuinely be vibe-coded** — built substantially with AI coding tools
- **Factual taglines** — no "revolutionary", no "#1", no marketing superlatives
- **Official URLs only** — no affiliate or tracking links

## How to report an error

If an entry is wrong (dead link, wrong URL, misleading tagline), open an **Issue** here with:

- The entry (name + category)
- What's wrong
- The correct information, with a source

Data fixes happen in the directory, then flow into this list on the next sync.

## Improving the generator

PRs are welcome for the things that live in this repo:

- `scripts/generate.js` — formatting, category handling, output structure
- `.github/workflows/update.yml` — sync workflow

Keep the generator dependency-free (plain Node 18+). Run it locally with:

```bash
node scripts/generate.js
```

## Code of conduct

Be kind, be factual, don't spam. Repeated low-quality or self-promotional issues/PRs will be closed.
