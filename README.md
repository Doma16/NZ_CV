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

## Layout

On desktop the page is one compact two-column grid:

- **Left:** a sticky visual panel with the scroll-driven frame sequence. It stays in view
  while the CV scrolls, and the sequence advances from the first frame to the last as the
  page moves from top to bottom.
- **Right:** the introduction, work experience, education, and a compact 2 × 2 details
  strip for skills, languages, other information and contact.

There is no separate showcase section and no pinned scroll section. Below 880 px the grid
stacks in the order **intro → visual panel → CV**, so the page remains readable on tablets
and phones.

The warm cream/copper panel is the main contrast against the white page; the rest of the
design uses sage green and copper accents. A fixed, softly veiled page background combines
responsive art-directed fallback artwork (swapped at 880 px and 640 px) with its own
scroll-driven frame sequence from `assets/frames/petri_sim`, which drifts as the page
scrolls.

## Frame sequences

Two independent sequences are loaded and both follow page scroll (first frame at the top,
last frame at the bottom, with a short easing between neighbours):

| Area | Folder | Config element |
| --- | --- | --- |
| Sticky left visual panel | `assets/frames/turing_pattern` | `<main id="main">` |
| Fixed page background | `assets/frames/petri_sim` | `.page-background` |

Drop the images into the matching folder using the default naming:

```text
frame_000.webp
frame_001.webp
frame_002.webp
...
```

The first frame appears in the visual panel immediately. On desktop the sticky panel keeps
the sequence visible throughout the CV; on smaller screens the panel sits between the intro
and the CV but still follows the page scroll.

The panel configuration lives on the `<main>` element in `index.html`:

```html
<main
  id="main"
  data-frames-dir="assets/frames/turing_pattern"
  data-frames-pattern="frame_{i}.{ext}"
  data-frames-version="20261115d"
  data-frames-count="0"
  data-frames-start="0"
  data-frames-pad="3"
  ...
>
```

The background uses the same options with a `bg-` prefix on the `.page-background` element:

```html
<div class="page-background"
  data-bg-frames-dir="assets/frames/petri_sim"
  data-bg-frames-pattern="frame_{i}.{ext}"
  ...
>
```

`data-frames-count="0"` detects the sequence automatically. For production, set the exact
number of frames to avoid probe requests. `data-frames-version` appends a cache-busting query
to frame URLs; bump it when replacing frames that keep the same filenames.

The repository currently ships with generated mock sequences — 27 PNG frames in
`assets/frames/turing_pattern` and 40 WebP frames in `assets/frames/petri_sim` — so the
scroll effect can be previewed immediately. Replace or delete the files when the real frames
are ready; the page detects the new count automatically.

If the panel images are missing, the page draws a generated light placeholder, so the layout
always looks complete. If the background images are missing, the responsive fallback artwork
in `assets/images/` remains visible.

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

## Deploying to GitHub Pages

1. Commit `index.html`, `assets/`, `.nojekyll` and this README.
2. Push to GitHub.
3. Open **Settings → Pages** and choose **Deploy from a branch → main → / (root)**.
4. Wait for the deployment; the site will be at `https://<username>.github.io/<repo>/`.

All asset paths are relative, so the site works from a repository subpath as well as from a
custom domain. The only external dependency is Google Fonts; remove the font links if you need a
fully offline build and the fallback fonts will be used.

## Features

- Short, white, editorial layout with a warm cream/copper visual panel
- Sticky left frame sequence on desktop; compact stacked panel on mobile
- Responsive ambient page background with a scroll-driven frame echo
- Compact scroll-driven sequence with preloading, easing and frame/percentage readout
- Responsive from 320 px up, keyboard-friendly, skip link and reduced-motion support
- Print stylesheet for a clean CV / “Save as PDF”
- No build step, no dependencies, GitHub Pages-ready

---

© 2026 Nensi Zelić. The design and code are part of this personal CV project.
