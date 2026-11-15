# Nensi Zelić — CV

A short, white, single-page CV website built from the original PDF. Clean editorial typography,
a sticky visual panel on the left and a compact CV that scrolls beside it. No build step,
no framework, no dependencies — ready for GitHub Pages.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Using a local server is recommended because the frame sequence loads images with JavaScript.
Opening `index.html` directly can work in some browsers, but a server is the reliable option.

## Project structure

```text
index.html                 Page markup and all CV content
assets/css/style.css       White design system, responsive + print styles
assets/js/app.js           Frame-sequence engine and small interactions
assets/images/             Responsive page-background fallback artwork (desktop/tablet/mobile)
assets/frames/turing_pattern/  Frames for the sticky left visual panel (PNG)
assets/frames/petri_sim/       Frames for the fixed page background (WebP)
.nojekyll                  Keeps GitHub Pages from running Jekyll
README.md
```
## Customising

- **Content** — edit the sections in `index.html` (`#iskustvo`, `#obrazovanje`, `#vjestine`, `#kontakt`).
- **Colours** — the design tokens are at the top of `assets/css/style.css` (`--paper`, `--panel`, `--ink`, `--accent`, `--copper`, …).
- **Type** — Fraunces, Inter and JetBrains Mono are loaded from Google Fonts. The fallback stacks keep the layout usable offline.
- **Visual panel shape** — change `aspect-ratio` on `.visual-panel__stage` (4:5 desktop, 4:3 when stacked). On short desktop viewports the stage height is capped so the panel stays on screen.
- **Page background** — the responsive art-directed fallback is `assets/images/page-bg-desktop.webp`, `page-bg-tablet.webp` and `page-bg-mobile.webp`; the `<source media>` breakpoints live in `index.html` (880 px and 640 px). The blurred frame sequence from `assets/frames/petri_sim` overlays it and follows the page scroll. The background is hidden in print.
- **Sequence timing** — page scroll is mapped in `updateTarget()` in `assets/js/app.js`. The panel itself is made sticky in CSS.
- **Reduced motion** — the sequence easing and transitions respect `prefers-reduced-motion`.
- **Print / PDF** — the `Preuzmi CV` buttons open the browser print dialog and a dedicated A4 print stylesheet produces a clean, compact CV with selectable text. Choose “Save as PDF” there.

## Download button and the original PDF

The provided PDF (`White Simple Student Cv Resume.pdf`) is currently excluded by `.gitignore`
(`*.pdf`), so it would not be published to GitHub Pages.

For that reason the download buttons use **Print → Save as PDF**, which always works on a static
site. If you prefer to serve the original file instead:

1. allow the PDF in `.gitignore` (or remove the `*.pdf` rule),
2. commit the PDF, and
3. replace the `<button data-print>` elements in `index.html` with links to it, e.g.
   `<a class="btn" href="White%20Simple%20Student%20Cv%20Resume.pdf" download>`.

---
© 2026 Nensi Zelić. The design and code are part of this personal CV project.
