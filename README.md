# personal-hub

Cozy, smart personal website for NikPeg: feed, channels, Telegram/VK links, project pages, thoughts, startup ideas, photos, experiments, and a future life dashboard — hosted self-managed with smooth animations and one warm visual style.

## Stack

Vite + React static site.

```bash
npm install
npm run dev
npm run build
```

The production artifact is `dist/`, served by Nginx on the server.

## Current sections

- **Home** — identity hero, portrait, compact feed, and project teasers.
- **Feed** — visual posts with title, text, and optional image carousels.
- **Ideas** — mainly startup/product ideas; already structured for scores and upvotes.
- **Thoughts** — raw, less polished thoughts that are not ready to become posts yet.
- **Channels** — stable places where NikPeg writes, publishes code, and keeps public channels: Telegram, VK, GitHub, LinkedIn, and future sources.
- **Projects** — selling-style landings for each project, e.g. `/scribo`, `/edu`, `/slidebot`.
- **Photos** — a future room for NikPeg photos and visual notes.

## Roadmap / plans

- Add richer interactivity to the Ideas section:
  - sort ideas by number of upvotes;
  - give each idea an overall score;
  - compare ideas in tables;
  - evaluate ideas across criteria such as usefulness, feasibility, market, effort, delight, and personal fit.
- Expand the feed into polished posts with images, carousels, long text, and full-screen reading.
- Give every project its own landing page with distinct positioning and style.
- Add social interactions later:
  - comments under posts, ideas, and possibly photos;
  - likes/reactions for posts, thoughts, and ideas.
- Add dedicated project landing pages.
- Fill the **Photos** tab with portraits, places, work-in-progress moments, and visual notes.
- Add a backend and persistence/API layer when votes, ratings, likes, comments, and comparisons need to survive across sessions.

## Deployment

On the server, use:

```bash
/usr/local/bin/deploy-personal-hub
```

It pulls the latest code, runs `npm install` when needed, builds the Vite app, syncs `dist/` to `/var/www/personal-hub`, and reloads Nginx.
