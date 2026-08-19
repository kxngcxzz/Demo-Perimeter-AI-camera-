# PerimeterAI - proximity camera systems (demo build)

A portfolio build of a marketing site for an industrial safety product: AI
proximity cameras that detect people around forklifts, excavators and loaders.

**Live demo:** https://kxngcxzz.github.io/Demo-Perimeter-AI-camera-/

> This is a demo. The production site it was built for is
> [perimeterai.com.au](https://www.perimeterai.com.au/). The enquiry form here
> is deliberately not connected, and the site is `noindex` so it never competes
> with the client's real pages in search.

---

## What this is

Static site. No framework, no build step, no dependencies. The repository root
is the deployable site.

| | |
|---|---|
| HTML, CSS, JS | 47 KB |
| Fonts (7 subsetted faces) | 113 KB |
| First paint | 246 KB, from a single origin |
| Third-party requests at runtime | none |

## Build notes

**Typography is self-hosted and subsetted.** Archivo for display, Geist and
Geist Mono for text and data. Each face is subsetted to the 104 glyphs the page
actually renders, which took the font payload from 233 KB to 113 KB. Nothing is
fetched from a font CDN, so the page makes no third-party request and text does
not wait on an external stylesheet.

**One theme, one accent, one radius.** The page is dark throughout with no
section inverting mid-scroll. The accent is the brand orange taken from the
client's own material, desaturated to sit in the neutrals instead of vibrating
against them. Every corner is square.

**Images are never upscaled or stretched.** Two of the supplied source images
are only 230 px and 271 px wide. Rather than stretching them to fill their grid
cell, each sits on a fixed-size plate at native size or smaller, so nothing is
enlarged past its resolution. All eight images render at 0% aspect distortion.

**Accessibility.** Skip link, landmark elements, labelled form controls with
errors announced through `role="alert"`, visible focus rings, a keyboard
operable menu that closes on Escape, outside click and resize, and a full
`prefers-reduced-motion` path.

**Progressive enhancement.** Every section reads and every link works with
JavaScript blocked. There are no scroll listeners anywhere; reveal and nav
highlighting both run on `IntersectionObserver`.

## Layout

```
.
├── index.html
├── 404.html                    self-contained, so it renders from any URL depth
├── robots.txt                  noindex, this is a demo
├── site.webmanifest
├── .github/workflows/pages.yml verify, then deploy
├── scripts/check-links.sh      pre-deploy integrity check
└── assets/
    ├── css/styles.css
    ├── css/fonts.css           @font-face for the subsetted faces
    ├── js/main.js
    ├── fonts/                  7 woff2, latin subset
    └── img/                    8 images, .jpg and .webp
```

## Running it

```bash
python3 -m http.server 8000     # then open http://localhost:8000
bash scripts/check-links.sh     # the same check CI runs before deploying
```

`check-links.sh` resolves every local reference in every HTML file, checks each
in-page anchor against a real `id`, and fails on a `file://` link or a
base64-inlined image. The deploy is gated on it.

## Verified

Rendered in headless Chromium at 1440, 1024, 768, 390 and 320 px:

- no horizontal overflow at any width, no console errors
- all 8 images load, served as WebP, 0% aspect distortion, none upscaled
- every image carries explicit `width` and `height`, so nothing shifts as it loads
- mobile menu opens and closes on Escape; all scroll-reveal elements fire
- submitting the form empty returns three field errors and focuses the first
