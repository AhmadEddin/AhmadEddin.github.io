# Ahmad Kamal Eddin, portfolio

Astro static site. The concept, palette, type and layout rules are in `DESIGN.md`.

## Run

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in dist/
npm run preview      # serve dist/ locally
```

## Where things live

- `src/data/site.ts`: every visible string (hero, statement, projects, facts, experience, skills).
- `src/motion/recorder.ts`: the signature, the pen that writes the trace. Each work row and case
  hero carries `data-event="<kind>"`; the shapes are defined in the same file.
- `src/figures/recorder/`: Fig 0 on the home page, the recorder itself. Same build/live split as
  Fig 1; rebuild with `node src/figures/recorder/build.mjs`.
- `src/figures/testbed/`: Fig 1 on the testbed case. `build.mjs` (anatomy kit) writes
  `figure.html` and `figure.json`; `live.ts` runs the loop. After changing the build script:
  `node src/figures/testbed/build.mjs`.
- `src/engine/`: motion plumbing (Lenis, GSAP, page lifecycle). Rarely needs edits.

## Before deploying

1. Set the real domain in `astro.config.mjs` (`site`), `src/data/site.ts` (`site.url`) and
   `public/robots.txt`.
2. `npm run build`, then regenerate `public/og.png` from the built hero if the hero changed, and
   build again.
3. Deploy `dist/` to any static host, for example `npx vercel --prod` or
   `npx netlify deploy --prod --dir dist`.
