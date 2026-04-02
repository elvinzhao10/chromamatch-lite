# ChromaMatch Lite

ChromaMatch Lite is a browser-based lightweight tool for fast, accurate color matching.
It maps color characteristics from a reference image onto a source image, then lets you fine-tune and analyze the result in real time.

## Why this name

- ChromaMatch describes the core goal: matching color mood and distribution.
- Lite emphasizes speed, simplicity, and low-friction usage in the browser.

## Key Features

- Lightweight workflow:
	- No framework build step
	- Runs directly in the browser
	- Fast slider-driven live updates

- Multi-method transfer engine:
	- Reinhard LAB
	- LAB histogram matching
	- RGB mean/std matching
	- Auto method selection
- Transfer strength control with live re-apply
- Professional adjustment stack:
	- Exposure, contrast, highlights, shadows, whites, blacks
	- Temperature, tint, saturation
- Windowed dashboard views:
	- Three-Up (Original / Reference / Result)
	- Original vs Result comparison slider
	- Reference vs Result comparison slider
- Granular analysis module:
	- RGB and LAB histograms
	- A*B* vectorgrams
	- Live match analysis with overlap and percentile deltas
	- Statistical comparison tables
- Export tools:
	- Quick export
	- Full-quality export options
	- LUT export

## Project Structure

- `index.html`: app layout and controls
- `styles.css`: dashboard, theme, and visualization styling
- `src/ui/app.js`: app orchestration and event wiring
- `src/engine/transfer/color-transfer.js`: transfer algorithms and method selection
- `src/engine/adjustments/image-adjustments.js`: grading adjustments
- `src/analysis/color-analysis.js`: visual analytics and match scoring
- `src/export/export-manager.js`: export workflows
- `src/export/lut-export.js`: LUT generation

## Run Locally

This project is framework-free and intentionally lightweight.
It runs directly in the browser.

1. Open `index.html` in a modern browser.
2. Upload source and reference images.
3. Click Transfer Colors.
4. Fine-tune in the right panel and inspect live analysis.

Optional local server (recommended for consistent file handling):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Workflow

1. Load source and reference images
2. Choose transfer method and strength
3. Refine color/tone sliders
4. Validate with Match Analysis and Statistics tabs
5. Export image or LUT

## Reference

Based on:
Reinhard, E., Adhikhmin, M., Gooch, B., & Shirley, P. (2001).
Color transfer between images. IEEE Computer Graphics and Applications, 21(5), 34-41.