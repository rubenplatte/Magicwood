# Magic Wood Boulders 🪨

A mobile-first, installable web app (PWA) for finding the boulders you most want
to climb in **Magic Wood**, Switzerland — built as a focused alternative to the
27crags map screen, using the data 27crags already exposes (ratings, number of
sends, sectors and GPS) for **rich filtering**, not just grades.

> 1,360 boulders across 381 sectors, with star ratings, send counts and
> per-sector GPS.

## Features

- **Rich filters** — combine grade range, minimum star rating, minimum number
  of sends, sector, and "has video beta". Sort by top-rated, most-sent, grade
  or name.
- **Save & organise** — ❤️ like, 🎯 mark as project, ✓ tick as **redpoint** or
  ⚡ **flash**, and add boulders to your own custom **lists** (tick list,
  warmups, next trip…).
- **Filter on your own ticks** — show only liked / projects / ticked / not-yet-
  ticked, or restrict the list to a single custom list.
- **Map** — every sector plotted from real GPS, markers sized by how many
  boulders match your current filters; tap a sector to browse its boulders.
- **Fast search** across boulder names, sectors and grades.
- **Installable & offline** — add to your home screen and it runs like a native
  app; boulder data, photos and map tiles are cached for offline use at the crag
  (where there's often no signal).
- **All local, no account** — your likes, projects, ticks and lists live in your
  browser (localStorage). Nothing is uploaded anywhere.

## Tech

React + Vite + TypeScript + Tailwind, Zustand for state, React-Leaflet for the
map, `vite-plugin-pwa` for installability/offline.

## Getting started

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run preview    # preview the production build
```

## Data

Boulder data is scraped from **publicly available** 27crags pages for Magic Wood
(no login, no premium data):

- `…/magic-wood/routelist` → name, grade, type, number of ascents, rating, votes
  and sector for every boulder
- `…/magic-wood/cragmap` → GPS coordinates per sector (per-boulder coordinates
  aren't public, so boulders are mapped at their sector)

Regenerate the dataset any time with:

```bash
npm run scrape     # writes src/data/boulders.json and src/data/sectors.json
```

The generated JSON is committed so the app builds and runs without re-scraping.
Icons are generated with `node scripts/gen-icons.mjs` (no native deps).

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages). For **GitHub Pages**,
the included workflow builds and deploys on push to the development branch; set
`BASE_PATH` if hosting under a sub-path.

## Notes

This is a personal, non-commercial tool for trip planning. All boulder data,
photos and ratings belong to 27crags and their contributors — open a boulder's
detail sheet and tap **View on 27crags** to see the original page, topo and
tick lists.
