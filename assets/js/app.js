/* ============================================================
   Nensi Zelić — CV interactions
   - Sticky left visual panel with scroll-driven frame sequence
   - Fixed page background driven by its own frame sequence
   - Print buttons (browser print → save as PDF)
   ============================================================ */

(() => {
    'use strict';

    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* ------------------------------------------------------------
       Frame sequence engine
       ------------------------------------------------------------ */

    const sequenceCanvas = $('#sequenceCanvas');
    const sequenceRoot = $('#main');
    const pageBackground = $('.page-background');
    const backgroundCanvas = $('#pageBackgroundCanvas');

    const ui = {
        counter: $('#sequenceCounter'),
        percent: $('#sequencePercent'),
        fill: $('#sequenceFill'),
        status: $('#sequenceStatus'),
    };

    const state = {
        scroll: 0,
    };

    const sequences = {
        // Small sticky window in the left column.
        foreground: {
            canvas: sequenceCanvas,
            config: null,
            frames: [],
            current: 0,
            maxDpr: 2,
        },
        // Full-viewport backdrop behind the CV.
        background: {
            canvas: backgroundCanvas,
            config: null,
            frames: [],
            current: 0,
            maxDpr: 1.25,
        },
    };

    /*
     * Reads a sequence config from data attributes. `prefix` lets one element
     * host multiple configs: "frames" → data-frames-dir, "bgFrames" →
     * data-bg-frames-dir, and so on.
     */
    function readConfig(root, prefix, defaultDir) {
        const ds = root ? root.dataset : {};
        const datasetKey = (name) => prefix + name.charAt(0).toUpperCase() + name.slice(1);
        const read = (name, fallback) => {
            const value = ds[datasetKey(name)];
            return value === undefined || value === '' ? fallback : value;
        };

        return {
            dir: read('dir', defaultDir),
            pattern: read('pattern', 'frame_{i}.{ext}'),
            version: read('version', ''),
            count: parseInt(read('count', '0'), 10) || 0,
            start: parseInt(read('start', '0'), 10) || 0,
            pad: Math.min(8, Math.max(0, parseInt(read('pad', '3'), 10) || 0)),
            extensions: read('extensions', 'webp,jpg,jpeg,png,avif')
                .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
            max: Math.max(1, parseInt(read('max', '300'), 10) || 300),
        };
    }

    function frameUrl(config, index, extension) {
        const n = String(index).padStart(config.pad, '0');
        const url = `${config.dir}/${config.pattern
            .replace('{i}', n)
            .replace('{ext}', extension)}`;
        return config.version
            ? `${url}?v=${encodeURIComponent(config.version)}`
            : url;
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Load failed: ${src}`));
            img.src = src;
        });
    }

    function fitCanvas(canvas, maxDpr = 2) {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(maxDpr, window.devicePixelRatio || 1);
        const w = Math.max(1, Math.round(rect.width * dpr));
        const h = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }
        return { w, h, dpr };
    }

    function drawCover(canvas, img, maxDpr = 2) {
        const { w, h } = fitCanvas(canvas, maxDpr);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);

        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }

    function drawPlaceholder(canvas) {
        const { w, h, dpr } = fitCanvas(canvas);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) * 0.22;

        ctx.fillStyle = '#e9dfd2';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(110, 75, 53, .28)';
        ctx.lineWidth = Math.max(1, 1.4 * dpr);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(110, 75, 53, .55)';
        ctx.font = `${Math.max(9, 9.5 * dpr)}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('KADROVI', cx, cy + r + 20 * dpr);
    }

    function setStatus(text) {
        if (ui.status) ui.status.textContent = text;
    }

    function padCount(total) {
        return Math.max(2, String(Math.max(1, total)).length);
    }

    function updateHud(index, progress) {
        const n = sequences.foreground.frames.length || 0;
        const shown = n ? clamp(Math.round(index) + 1, 1, n) : 0;
        const pad = padCount(n);
        if (ui.counter) {
            ui.counter.textContent = n ? `${String(shown).padStart(pad, '0')} / ${String(n).padStart(pad, '0')}` : '— / —';
        }
        const pct = Math.round(clamp(progress, 0, 1) * 100);
        if (ui.percent) ui.percent.textContent = `${pct}%`;
        if (ui.fill) ui.fill.style.width = `${pct}%`;
    }

    function drawBackground() {
        const bg = sequences.background;
        if (!bg.canvas || !bg.frames.length) return;

        const index = clamp(bg.current, 0, bg.frames.length - 1);
        drawCover(bg.canvas, bg.frames[Math.round(index)], bg.maxDpr);

        // A small parallax drift makes the soft background respond visibly to scroll.
        const shift = (state.scroll - 0.5) * 36;
        if (pageBackground) pageBackground.style.setProperty('--bg-shift', `${shift.toFixed(2)}px`);
    }

    function drawSequences() {
        drawBackground();

        const fg = sequences.foreground;
        if (!fg.canvas) return;

        if (!fg.frames.length) {
            updateHud(0, state.scroll);
            return;
        }

        const index = clamp(fg.current, 0, fg.frames.length - 1);
        drawCover(fg.canvas, fg.frames[Math.round(index)], fg.maxDpr);
        updateHud(index, state.scroll);
    }

    /* Page scroll drives both sequences: 0% at page top, 100% at page bottom. */
    function updateTarget() {
        const doc = document.documentElement;
        const max = Math.max(0, doc.scrollHeight - window.innerHeight);
        const top = window.scrollY || doc.scrollTop || 0;
        state.scroll = max > 0 ? clamp(top / max, 0, 1) : 0;
        requestTick();
    }

    let ticking = false;

    function requestTick() {
        if (ticking) return;
        ticking = true;

        const step = () => {
            const eased = reducedMotion.matches ? 1 : 0.18;
            let moving = false;

            [sequences.foreground, sequences.background].forEach((seq) => {
                if (!seq.frames.length) return;

                const goal = state.scroll * (seq.frames.length - 1);
                const diff = goal - seq.current;

                seq.current += diff * eased;
                if (Math.abs(diff) < 0.01) seq.current = goal;

                if (Math.abs(goal - seq.current) > 0.001) {
                    moving = true;
                } else {
                    seq.current = goal;
                }
            });

            drawSequences();

            if (moving) {
                window.requestAnimationFrame(step);
            } else {
                ticking = false;
            }
        };

        window.requestAnimationFrame(step);
    }

    /* ------------------------------------------------------------
       Frame detection and loading
       ------------------------------------------------------------ */

    function findFirstExtension(config) {
        const probe = new Image();
        const candidates = config.extensions.map((ext) => frameUrl(config, config.start, ext));
        const tryNext = (i) => {
            if (i >= candidates.length) return Promise.resolve(null);
            return new Promise((resolve) => {
                probe.onload = () => resolve(config.extensions[i]);
                probe.onerror = () => resolve(tryNext(i + 1));
                probe.src = candidates[i];
            });
        };
        return tryNext(0);
    }

    async function detectCount(config, extension) {
        const start = config.start;
        const maxIndex = start + config.max - 1;
        const exists = async (index) => {
            try {
                await loadImage(frameUrl(config, index, extension));
                return true;
            } catch {
                return false;
            }
        };

        if (!(await exists(start))) return 0;

        // Exponential search for the first missing frame, then binary search
        // the gap. Only a handful of probes are needed for ~40 frames.
        let good = start;
        let bad = null;

        for (let step = 1; step <= config.max; step *= 2) {
            const index = start + step;
            if (index > maxIndex) {
                bad = maxIndex + 1;
                break;
            }
            if (await exists(index)) {
                good = index;
            } else {
                bad = index;
                break;
            }
        }

        if (bad === null) bad = maxIndex + 1;

        while (good + 1 < bad) {
            const mid = Math.floor((good + bad) / 2);
            if (await exists(mid)) good = mid;
            else bad = mid;
        }

        return good - start + 1;
    }

    async function loadSequence(seq, kind) {
        const extension = await findFirstExtension(seq.config);

        if (!extension) {
            if (kind === 'foreground') {
                setStatus('Vizualna serija uskoro');
                updateHud(0, state.scroll);
            }
            return;
        }

        let count = seq.config.count;
        if (!count) {
            count = await detectCount(seq.config, extension);
        }

        const loaded = await Promise.allSettled(
            Array.from({ length: count }, (_, i) => loadImage(frameUrl(seq.config, seq.config.start + i, extension)))
        );
        seq.frames = loaded.filter((r) => r.status === 'fulfilled').map((r) => r.value);

        if (!seq.frames.length) {
            if (kind === 'foreground') setStatus('Vizualna serija uskoro');
            return;
        }

        if (kind === 'foreground') {
            setStatus('Pomaknite se kroz CV');
            updateHud(seq.current, state.scroll);
        } else if (pageBackground) {
            pageBackground.classList.add('has-sequence');
        }
    }

    async function initFrames() {
        if (!sequenceRoot || !sequenceCanvas) return;

        const fg = sequences.foreground;
        fg.config = readConfig(sequenceRoot, 'frames', 'assets/frames/turing_pattern');

        const bg = sequences.background;
        if (bg.canvas && pageBackground) {
            bg.config = readConfig(pageBackground, 'bgFrames', 'assets/frames/petri_sim');
        }

        setStatus('Učitavanje kadrova…');
        drawPlaceholder(sequenceCanvas);
        updateTarget();

        const jobs = [loadSequence(fg, 'foreground')];
        if (bg.config) jobs.push(loadSequence(bg, 'background'));

        await Promise.all(jobs);

        drawSequences();
        updateTarget();
    }

    /* ------------------------------------------------------------
       Interactions
       ------------------------------------------------------------ */

    function initPrint() {
        $$('[data-print]').forEach((btn) => {
            btn.addEventListener('click', () => window.print());
        });
    }

    function initYear() {
        const year = $('#year');
        if (year) year.textContent = String(new Date().getFullYear());
    }

    function initEvents() {
        window.addEventListener('scroll', updateTarget, { passive: true });
        window.addEventListener('resize', () => {
            updateTarget();
            if (sequences.foreground.frames.length || sequences.background.frames.length) {
                drawSequences();
            } else if (sequenceCanvas) {
                drawPlaceholder(sequenceCanvas);
            }
        });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(updateTarget);
        }
    }

    function init() {
        initPrint();
        initYear();
        initEvents();
        initFrames();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
