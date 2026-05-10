# ChromaMatch Lite

ChromaMatch Lite is a browser-first color transfer and grading tool for matching a source image to a visual reference, then refining the result with fast adjustment controls, analysis views, presets, LUT export, and AI-assisted reference finding.

It is intentionally framework-free: open the app directly in a browser, or run a tiny static server for smoother local file handling.

## What It Does

- Transfers color characteristics from a reference image onto a source image
- Lets you fine-tune the result with grading controls
- Compares original, reference, and result in multiple display modes
- Analyzes the match with histograms, vectors, and score summaries
- Finds reference imagery with fuzzy cinematic search and optional AI assistance
- Saves and reuses visual presets
- Exports stills and LUTs

## Core Features

- Color transfer engine
  - `hybrid-lab` default path for balanced color matching
  - Reinhard LAB transfer
  - LAB histogram matching
  - RGB mean/std matching
  - Auto selection with performance-aware behavior

- Fine adjustments
  - Temperature
  - Tint
  - Exposure
  - Contrast
  - Highlights
  - Shadows
  - Whites
  - Blacks
  - Saturation
  - Transfer strength

- Reference workflows
  - Upload a reference image
  - Browse references with intent-based modes
  - AI-assisted search query expansion
  - AI image generation and reference tuning
  - Session/reference memory to keep search intent more consistent

- Analysis and export
  - Histogram and color analysis views
  - Comparison slider views
  - Quick export
  - Full-quality export
  - LUT export

## AI Provider Support

The app uses a unified session layer for:

- `OpenAI`
- `Gemini`
- `DeerAPI`
- `Custom` OpenAI-compatible providers

Provider routing is handled in-app, and session memory is preserved locally in the browser. Providers do not share hidden state, so the app stores the conversation, summaries, style memory, and reference context itself.

### Provider Setup

Open **Settings** and use the provider manager:

1. Click `Add Provider`
2. Choose a preset
3. Add the required API key
4. Choose chat and image models
5. Save the provider

Optional:

- override base URL
- override custom model IDs
- refresh provider model choices from the upstream API when supported

The provider table is the main source of truth. Search-source keys are configured separately in the same settings modal:

- TMDB
- Unsplash
- Pexels

All keys are stored locally in browser storage.

## Search Modes

The reference finder is designed around visual intent rather than raw source selection:

- `AI Assisted`
- `Cinema Frames`
- `Photo References`
- `Archive / Documentary`

The search layer uses:

- film-title matching
- fuzzy token matching
- visual taxonomy extraction
- source-aware ranking
- penalties for irrelevant poster/illustration-style results

## Project Structure

- `index.html` - app layout and controls
- `styles.css` - dashboard, modal, theme, and responsive styling
- `src/ui/app.js` - orchestration, state, events, settings, and reference workflows
- `src/ai/unified-session.js` - provider abstraction and session memory
- `src/search/reference-discovery.js` - reference search providers, ranking, and AI-assisted query generation
- `src/engine/transfer/color-transfer.js` - transfer algorithms and method selection
- `src/engine/adjustments/image-adjustments.js` - grading adjustments
- `src/engine/matching/smart-matcher.js` - matching logic and transfer heuristics
- `src/analysis/color-analysis.js` - visual analytics and match scoring
- `src/export/export-manager.js` - export workflows
- `src/export/lut-export.js` - LUT generation
- `src/presets/` - built-in and saved preset support

## Running Locally

You can open the app directly:

1. Open `index.html` in a modern browser
2. Load source and reference images
3. Click `Transfer Colors`

For more reliable local behavior, use a static server:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Typical Workflow

1. Load a source image
2. Add or find a reference image
3. Transfer colors
4. Fine-tune the result
5. Review analysis
6. Save a preset or export the result

## Notes on Performance

- `Fast`, `Balanced`, and `Quality` modes change processing density
- Large images are resized for interactive processing
- Adjustment previews are throttled to reduce UI lag
- Analysis updates are deferred to keep slider interaction smoother

## Practical Limitations

- Providers do not share latent image or hidden conversation state
- Some reference-image URLs may fail to load due to remote CORS restrictions
- Search quality improves noticeably when TMDB, Unsplash, or Pexels keys are configured

## Reference

Color transfer ideas are based in part on:

Reinhard, E., Adhikhmin, M., Gooch, B., & Shirley, P. (2001).  
Color transfer between images. IEEE Computer Graphics and Applications, 21(5), 34-41.
