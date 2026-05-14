# personal-hub

Cozy, smart personal website for NikPeg: posts, Telegram/VK links, pet project landings, thoughts, startup ideas, experiments, and a future life dashboard — hosted self-managed with smooth animations and one warm visual style.

## Stack

Vite + React static site.

```bash
npm install
npm run dev
npm run build
```

The production artifact is `dist/`, served by Nginx on the server.

## Current sections

- **Home** — identity hero, portrait, polished post feed, and project teasers.
- **Posts** — a feed of better-shaped, public-facing notes and essays.
- **Ideas** — mainly startup/product ideas; already structured for scores and upvotes.
- **Thoughts** — raw, less polished thoughts that are not ready to become posts yet.
- **Projects** — pet projects and experiments that can later get their own landings.

## Roadmap / plans

- Add richer interactivity to the Ideas section:
  - sort ideas by number of upvotes;
  - give each idea an overall score;
  - compare ideas in tables;
  - evaluate ideas across criteria such as usefulness, feasibility, market, effort, delight, and personal fit.
- Turn posts into a beautiful content feed with real long-form entries.
- Add social interactions later:
  - comments under posts, ideas, and possibly photos;
  - likes/reactions for posts, thoughts, and ideas.
- Add dedicated project landing pages.
- Possibly add a **Photos** tab later.
- Add a backend and persistence/API layer when votes, ratings, likes, comments, and comparisons need to survive across sessions.

## Deployment

On the server, use:

```bash
/usr/local/bin/deploy-personal-hub
```

It pulls the latest code, runs `npm install` when needed, builds the Vite app, syncs `dist/` to `/var/www/personal-hub`, and reloads Nginx.
