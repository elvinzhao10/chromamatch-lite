# ChromaMatch Lite

ChromaMatch Lite is a browser-first color matching and grading workspace.

Instead of treating the app as one temporary source/reference pair, the current version is session-based:

- each session can hold multiple source images
- each session can hold multiple references
- each session can save multiple looks
- looks can be pinned for compare
- processed matches are remembered for restore and review
- exports and LUTs are tied to the current session workflow

It is intentionally framework-free. You can open it directly from `index.html`, though a tiny local static server usually behaves better than `file://`.

## Current Product Model

### Session-first workflow

The app opens around a session library, not a one-off upload screen.

Each session stores:

- sources
- references
- saved looks
- remembered processed matches
- workspace layout state

Inside a session, the main workflow is:

1. choose a source from the source library
2. choose or search for a reference
3. transfer colors
4. fine-tune the grade
5. save a look
6. pin looks for compare or restore a remembered match
7. export stills or LUTs

### Looks vs remembered matches

There are two related but different objects:

- `Looks`: saved grading variants for the current session
- `Match Memory`: remembered processed source/reference pair states for quick restore

They are shown together in the combined `Look Library` workbench:

- `Saved Looks` are intentional grading variants that can be renamed, applied, pinned, or exported as LUTs.
- `Compare & Match Memory` is for side-by-side review and quick restoration of recent source/reference processing states.
- the top-right `Look Library` button opens the full look/recipe panel for session looks and built-in starter recipes.

## Core Features

### Color transfer engine

- `hybrid-lab` default path for balanced matching
- linear-light float transfer buffers before final display encoding
- soft gamut and highlight compression to reduce hard clipping
- Reinhard LAB transfer
- LAB histogram matching
- RGB mean/std matching
- auto method selection with performance-aware behavior

### Fine grading controls

- temperature
- tint
- exposure
- contrast
- highlights
- shadows
- whites
- blacks
- saturation
- transfer strength
- curves
- shadow / midtone / highlight color wheels

### Workspace and compare

- session library and session workspace flow
- built-in demo session from the home screen
- source library and reference library per session
- saved looks per session
- renameable looks
- compare board for pinned looks
- remembered match restore
- three-up display
- original vs result slider
- reference vs result slider
- analysis panel
- docked split-pane workspace and layout presets

### Reference workflows

- upload a reference image
- browse references with intent-based search modes
- fuzzy cinematic/photo search
- AI-assisted search query generation
- AI reference generation and tuning
- reference memory and search context carry-forward

### Analysis and export

- match analysis and summary cards
- RGB / LAB analysis views
- vectors and distribution views
- quick export
- full export
- LUT export

## AI Provider Support

The app includes a unified provider/session layer for:

- `OpenAI`
- `Gemini`
- `DeerAPI`
- `Custom` OpenAI-compatible providers

The orchestration layer is the source of truth. Providers do not share hidden memory, so the app stores session context, summaries, style memory, and reference context locally in the browser.

### Provider setup

Open `Settings` and use the provider manager:

1. add or edit a provider
2. enter the API key
3. choose chat and image models
4. optionally override base URL or custom model IDs
5. save the provider

Search-source keys are configured in the same settings area:

- TMDB
- Unsplash
- Pexels

## Themes and style modes

The app currently supports:

- light mode
- dark mode
- clean style
- ASCII style

The ASCII style is a deliberate alternate visual mode with mono typography, terminal/TUI-style borders, bracketed controls, phosphor green scanlines, squared surfaces, and grid-heavy presentation.

## Privacy Notes

- provider API keys are stored in browser `localStorage`
- search-source keys are stored in browser `localStorage`
- session state, looks, and remembered matches are stored in browser `localStorage`
- keys are masked in the provider table UI
- nothing in normal app usage writes your keys into tracked repo files

This is convenient for a local tool, but it is still browser storage, so treat the machine and browser profile as trusted.

## Project Structure

- `index.html` - app structure, workspace layout, modals, settings UI
- `styles.css` - themes, layout, workspace, compare, and modal styling
- `src/ui/app.js` - session state, UI orchestration, interactions, settings, search flow, compare flow
- `src/ai/unified-session.js` - provider abstraction and local AI session state
- `src/search/reference-discovery.js` - reference search providers, ranking, and AI-assisted query generation
- `src/engine/transfer/color-transfer.js` - transfer algorithms and method selection
- `src/engine/adjustments/image-adjustments.js` - grading adjustments, curves, and wheel logic
- `src/engine/matching/smart-matcher.js` - matching heuristics
- `src/analysis/color-analysis.js` - analytics and match scoring
- `src/export/export-manager.js` - export workflows
- `src/export/lut-export.js` - LUT generation
- `src/presets/` - built-in recipes and look/preset helpers

## Running Locally

### Simplest path

Open `index.html` in a modern browser.

### Recommended path

Run a tiny local static server:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

This tends to be more reliable than `file://` for local browser behavior.

## Typical Session Workflow

1. create or open a session
   - or click `Open Demo` for a populated local demo session
2. add one or more sources
3. add or search for one or more references
4. select the active source/reference pair
5. click `Transfer Colors`
6. refine with grading controls
7. save a look
8. pin looks into compare
9. restore remembered matches if needed
10. export a still or LUT

## Performance Notes

- `Fast`, `Balanced`, and `Quality` modes change processing density
- large images are resized for interactive processing
- adjustment previews are throttled during scrubbing
- analysis updates are deferred to keep interaction smoother
- the current workspace uses docked split panes with persisted divider ratios

## Known Practical Limits

- providers do not share latent image state or hidden conversation state
- some remote image URLs may fail because of CORS or provider restrictions
- search quality improves a lot when TMDB, Unsplash, or Pexels keys are configured
- browser-only persistence means clearing storage can remove sessions and keys

## Recommended Next Architecture Step

The current branch has moved toward a stricter docked split-pane workspace. The next durable step would be extracting the session/look store and workspace layout manager into smaller modules so UI code, persistence, and grading operations are easier to test independently.

## Reference

Color transfer ideas are based in part on:

Reinhard, E., Adhikhmin, M., Gooch, B., & Shirley, P. (2001).
Color transfer between images. IEEE Computer Graphics and Applications, 21(5), 34-41.
