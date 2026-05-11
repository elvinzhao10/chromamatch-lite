# 🎨 ChromaMatch — Refined Implementation Plan

> **Vision**: A smart, node-based color grading engine that an AI agent can drive via MCP, with closed-loop feedback between analysis, transfer, and adjustment.

---

## 0. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          AI AGENT (Claude / GPT)                          │
│                         "match this to reference"                         │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ MCP Protocol (stdio / HTTP)
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       CHROMAMATCH MCP SERVER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ load_image   │  │ search_ref   │  │ build_graph  │  │ auto_tune    │ │
│  │ transfer     │  │ analyze      │  │ get_sugg     │  │ apply_sugg   │ │
│  │ export       │  │ get_preset   │  │ save_preset  │  │ list_nodes   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                              │                                           │
│  ┌───────────────────────────┴───────────────────────────────────────┐  │
│  │                    PROCESSING ORCHESTRATOR                          │  │
│  │  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐   │  │
│  │  │ Node Graph   │   │ Smart Matcher│   │ Analysis Pipeline    │   │  │
│  │  │ Executor     │──→│ (auto-tune)  │──→│ (score + suggestions)│   │  │
│  │  └──────────────┘   └──────────────┘   └──────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        BROWSER UI (Canvas + DOM)                          │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌──────────────────┐ │
│  │ Node Graph Editor   │  │ Live Preview        │  │ Analysis Panel   │ │
│  │ (pan/zoom/connect)  │  │ (at any node)       │  │ (histograms+etc) │ │
│  └─────────────────────┘  └─────────────────────┘  └──────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Step-by-Step Implementation Plan

### STEP 0 — Smart Color Matching Core (1-2 days)
**File**: `src/engine/matching/smart-matcher.js`

Enhance the existing `ColorTransfer` with research-backed improvements:

```javascript
// SmartMatcher extends the basic transfer with:
class SmartMatcher {
  // 1. ADAPTIVE STRENGTH
  //   - Analyze source/ref color distance
  //   - Auto-compute optimal strength per channel
  //   - Prevent over-transfer on already-matching areas
  
  // 2. PERCEPTUAL DIFFERENCE (ΔE2000)
  //   - Replace simple euclidean with CIEDE2000 formula
  //   - Perceptually uniform color difference
  //   - Better match quality metric
  
  // 3. REGION-AWARE TRANSFER
  //   - Detect luminance zones (shadows/midtones/highlights)
  //   - Apply different transfer per zone
  //   - Preserve local contrast
  
  // 4. MULTI-SCALE APPROACH
  //   - Build image pyramids (1x, 0.5x, 0.25x)
  //   - Coarse match on small scales
  //   - Refine on full resolution
  //   - Much faster on large images
  
  // 5. AUTO-CALIBRATION
  //   - Run quick transfer → analyze → auto-adjust → re-transfer
  //   - Max 5 iterations or convergence (Δ < threshold)
  //   - Returns optimal params + final result
}
```

**Algorithm Improvements**:

| Improvement | Method | Benefit |
|------------|--------|---------|
| ΔE2000 distance | CIEDE2000 formula | Perceptually accurate matching |
| Adaptive strength | Per-channel auto-weighting | No manual slider needed |
| Zone transfer | Luminance-based regions | Preserves shadows/highlights |
| Multi-scale | Image pyramid | ~8x faster on 4K images |
| Auto-calibrate | Iterative refinement | Optimal result automatically |

### STEP 1 — Node Graph Engine Core (2-3 days)
**Files**: `src/engine/nodes/node-graph.js`, `src/engine/nodes/node-types.js`

Build the DAG execution engine. Key features:
- Node/Port/Connection data model
- Topological sort (Kahn's algorithm)
- Dirty propagation (BFS downstream marking)
- Graph serialization (to/from JSON)
- Execution caching (skip unchanged branches)
- Validator (no cycles, port-type compatibility)

### STEP 2 — Node Processor Registry (1-2 days)
**File**: `src/engine/nodes/node-processor.js`

Register all ~30 node types into the engine. Each node is a pure function:
```javascript
process(inputImageData, params) → outputImageData
```

Node categories mapped to existing code:
- Transfer nodes → `color-transfer.js`
- Adjustment nodes → `image-adjustments.js`
- Analysis nodes → `color-analysis.js`
- NEW: Composite, Selection, Utility nodes

### STEP 3 — MCP Server Interface (2-3 days)
**File**: `mcp-server/server.js`

Chromamatch as an MCP tool server. The AI agent can:
```
Tool: chromamatch_load_images
  Input:  { source: base64|url|path, reference: base64|url|path }
  Output: { images_loaded: true, dimensions: {...} }

Tool: chromamatch_transfer
  Input:  { method, strength, performance_mode }
  Output: { result: base64, match_score: 0-100, stats: {...} }

Tool: chromamatch_build_graph
  Input:  { nodes: [...], connections: [...] }
  Output: { graph_id, node_count }

Tool: chromamatch_execute_graph
  Input:  { graph_id }
  Output: { result: base64, per_node_previews: {...} }

Tool: chromamatch_analyze_result
  Input:  {  }
  Output: { match_score, channel_overlaps, suggestions: [...] }

Tool: chromamatch_auto_tune
  Input:  { max_iterations }
  Output: { result: base64, final_score, iterations_used, params: {...} }

Tool: chromamatch_search_reference
  Input:  { query, source: "unsplash"|"pexels"|"ai_generate" }
  Output: { images: [{url, thumbnail, palette}] }

Tool: chromamatch_load_preset
  Input:  { preset_name }
  Output: { graph: {...}, preview: base64 }

Tool: chromamatch_get_feedback_loop
  Input:  { strategy: "auto"|"balanced"|"perceptual" }
  Output: { cycle_count, final_score, adjustment_log: [...] }
```

### STEP 4 — Feedback Loop System (1-2 days)
**File**: `src/engine/feedback/feedback-controller.js`

The core loop that makes the system "smart":

```
┌──────────────────────────────────────────────────────┐
│                 FEEDBACK LOOP                         │
│                                                      │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐   │
│   │ TRANSFER │────→│ ANALYZE  │────→│ SUGGEST  │   │
│   │ (apply)  │     │ (score)  │     │ (deltas) │   │
│   └──────────┘     └──────────┘     └────┬─────┘   │
│        ↑                                  │         │
│        │         ┌──────────┐             │         │
│        └─────────│ ADJUST   │←────────────┘         │
│                  │ (params) │                        │
│                  └──────────┘                        │
│                                                      │
│   Convergence criteria:                              │
│   - match_score >= target_threshold (default 90)     │
│   - score improvement < min_improvement (0.5%)       │
│   - max_iterations reached (default 5)               │
│                                                      │
│   Strategies:                                        │
│   - "auto"      → let AI pick adjustments            │
│   - "balanced"  → gentle adjustments, avoid clipping │
│   - "aggressive"→ faster convergence, may clip       │
│   - "perceptual"→ prioritize visual harmony          │
└──────────────────────────────────────────────────────┘
```

### STEP 5 — Canvas Node Editor UI (3-4 days)
**File**: `src/ui/node-editor.js`

Interactive canvas-based node graph editor:
- Infinite canvas with pan/zoom (mouse wheel + middle drag)
- Drag-and-drop nodes from category palette
- Connection drawing between ports
- Node selection → Inspector panel shows parameters
- Mini preview thumbnail inside each node
- Keyboard shortcuts (Delete, Ctrl+D duplicate, Ctrl+Z undo)
- Right-click context menu

### STEP 6 — Smart UI with AI Hints (1-2 days)
Extend the editor with AI-driven intelligence:

```
┌─────────────────────────────────────────────┐
│  🤖 AI Assistant                            │
│  ┌─────────────────────────────────────────┐│
│  │ "Source is ~15% darker than reference.  ││
│  │  Consider:                              ││
│  │  • Add Exposure node (+0.3)             ││
│  │  • Or adjust Curves midpoint up          ││
│  │  • Auto-fix? [Apply] [Show Diff]"       ││
│  └─────────────────────────────────────────┘│
│                                             │
│  Node suggestions glow orange when AI       │
│  recommends adjustment:                     │
│                                             │
│  ┌──────────┐                               │
│  │ Exposure │ ← pulsing orange border       │
│  │   +0.3   │                               │
│  └──────────┘                               │
└─────────────────────────────────────────────┘
```

### STEP 7 — Integration & End-to-End Flow (1-2 days)

Wire everything together:
1. Browser UI ↔ Node Engine ↔ MCP Server
2. AI Agent discovers MCP tools → drives the pipeline
3. Preset system (save/load node graphs as JSON)
4. Export pipeline (image + LUT + preset)

---

## 2. File Structure (Final)

```
chromamatch-lite/
├── index.html
├── styles.css
├── REFINED_PLAN.md                      # This document
├── NODE_SYSTEM_DESIGN.md               # Original node design
│
├── mcp-server/                          # MCP Interface
│   ├── server.js                        # MCP stdio server
│   ├── tools.js                         # Tool definitions
│   └── package.json
│
├── src/
│   ├── ui/
│   │   ├── app.js                       # Updated: mode switching
│   │   ├── node-editor.js               # NEW: Canvas editor
│   │   └── inspector.js                 # NEW: Parameter inspector
│   │
│   ├── engine/
│   │   ├── transfer/
│   │   │   └── color-transfer.js        # Existing (kept)
│   │   ├── adjustments/
│   │   │   └── image-adjustments.js     # Existing (kept)
│   │   ├── matching/
│   │   │   └── smart-matcher.js         # NEW: Enhanced matching
│   │   └── nodes/
│   │       ├── node-graph.js            # NEW: Graph data + DAG
│   │       ├── node-processor.js        # NEW: Execution engine
│   │       └── node-types.js            # NEW: ~30 node definitions
│   │
│   ├── analysis/
│   │   └── color-analysis.js            # Existing (kept)
│   │
│   ├── feedback/
│   │   └── feedback-controller.js       # NEW: Auto-tune loop
│   │
│   ├── export/
│   │   ├── export-manager.js            # Existing (kept)
│   │   └── lut-export.js               # Existing (kept)
│   │
│   └── presets/
│       ├── preset-manager.js            # NEW: Save/load graphs
│       └── preset-library.js            # NEW: Built-in presets
```

---

## 3. Implementation Order (What to Build When)

```
DAY 1-2:  SmartMatcher core          ← makes existing color matching smarter
DAY 3-5:  Node graph engine          ← DAG, nodes, execution
DAY 6-8:  MCP server                 ← AI agent can now drive it
DAY 9-10: Feedback loop controller   ← auto-tune, iterative refinement
DAY 11-14: Canvas node editor UI     ← visual graph building
DAY 15-16: Smart UI + AI hints       ← inline suggestions, visual guides
DAY 17-18: Integration + presets     ← end-to-end flow, save/load
```

## 4. Success Metrics

The system is "done" when:

1. ✅ An AI agent can: load images → search references → build node graph → auto-tune → export — all via MCP tools
2. ✅ SmartMatcher produces better match scores than the original Reinhard transfer for 80%+ of test pairs
3. ✅ Feedback loop converges to score ≥85 in ≤5 iterations for 90%+ of test pairs
4. ✅ Node editor supports drag-connect-inspect workflow without lag on images up to 4K
5. ✅ Presets can be saved, shared, and loaded (single JSON file)

---

*Version: 1.0 — Refined from original NODE_SYSTEM_DESIGN.md with MCP integration, feedback loops, and smarter algorithms.*
