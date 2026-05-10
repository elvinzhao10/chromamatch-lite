# 🎨 ChromaMatch Node System — Architecture Design

## 1. Overview

Replace the current linear slider pipeline with a **node-based graph editor** for color grading, inspired by DaVinci Resolve's node tree. Users visually connect processing nodes to build custom color grading pipelines.

**Core Philosophy:**
- Simple Mode = Current linear sliders (kept for quick edits)
- Advanced Mode = Node graph editor (full creative control)

```
┌────────────────────────────────────────────────────────────────┐
│  CURRENT (Linear Pipeline)         │  PROPOSED (Node Graph)    │
│                                    │                           │
│  Source ─→ Transfer ─→ Adjust ─→  │    [Source]──[Transfer]   │
│   (one-way, fixed order)           │        │          │       │
│                                    │   [Color Key]   [Tone]    │
│                                    │        │          │       │
│                                    │   [Mask]──[Blend]──→[Out] │
│                                    │                           │
└────────────────────────────────────────────────────────────────┘
```

## 2. Node Graph Architecture

### 2.1 Core Concepts

```
Node Graph = Directed Acyclic Graph (DAG) of processing nodes
Each node has:
  ├── Input Ports  (0..N)  ← receive ImageData from upstream
  ├── Output Ports (1..N)  → send processed ImageData downstream
  ├── Parameters            → user-adjustable controls
  └── Preview               → click to see output at this node
```

### 2.2 Graph Evaluation

```
1. Topological sort of all nodes
2. Execute nodes in dependency order
3. Each node: read input ports → process → write to output ports
4. Cache intermediate results (skip unchanged nodes on re-eval)
5. Render final output from the designated Output Node
```

### 2.3 Port System

```javascript
class NodePort {
  constructor(node, name, type, direction) {
    this.node = node;           // parent node
    this.name = name;           // "input", "mask", "reference"
    this.type = type;           // "image" | "mask" | "lut" | "color_palette"
    this.direction = direction; // "input" | "output"
    this.connections = [];      // connected ports
    this.cachedData = null;     // cached result
  }
}
```

## 3. Node Type Catalog

### 3.1 Source Nodes (Green)

| Node | Inputs | Outputs | Description |
|------|--------|---------|-------------|
| **Image Loader** | — | Image (1) | Load image from file/URL |
| **Color Constant** | — | Color (1) | Solid color generator |
| **Gradient** | — | Image (1) | Procedural gradient |
| **Reference Import** | — | Image (1) | Reference from search/AI |

### 3.2 Color Transfer Nodes (Purple)

| Node | Inputs | Outputs | Description |
|------|--------|---------|-------------|
| **Color Transfer** | Source(1), Ref(1) | Image(1) | Apply transfer algorithm |
| **Channel Transfer** | Source(1), Ref(1) | Image(1) | Transfer single channel |
| **Histogram Match** | Source(1), Ref(1) | Image(1) | LAB histogram matching |
| **LUT Apply** | Source(1), LUT(1) | Image(1) | Apply .cube LUT file |

### 3.3 Color Correction Nodes (Orange)

| Node | Inputs | Outputs | Description |
|------|--------|---------|-------------|
| **Temperature/Tint** | Image(1) | Image(1) | White balance |
| **Saturation** | Image(1) | Image(1) | Saturation control |
| **Hue Shift** | Image(1) | Image(1) | HSL rotation |
| **Channel Mixer** | Image(1) | Image(1) | RGB channel remix |
| **Color Balance** | Image(1) | Image(1) | Lift/Gamma/Gain |

### 3.4 Tone Nodes (Blue)

| Node | Inputs | Outputs | Description |
|------|--------|---------|-------------|
| **Exposure** | Image(1) | Image(1) | Exposure adjustment |
| **Contrast** | Image(1) | Image(1) | Contrast with pivot |
| **Curves** | Image(1) | Image(1) | Custom tone curve |
| **Levels** | Image(1) | Image(1) | Input/output/clamp |
| **Shadows/Highlights** | Image(1) | Image(1) | Split-tone control |

### 3.5 Selection Nodes (Yellow)

| Node | Inputs | Outputs | Description |
|------|--------|---------|-------------|
| **Luminance Key** | Image(1) | Mask(1) | Key by brightness |
| **Color Key** | Image(1) | Mask(1) | Key by color range |
| **HSL Key** | Image(1) | Mask(1) | Key by HSL |
| **Edge Mask** | Image(1) | Mask(1) | Sobel edge detection |
| **Gradient Mask** | — | Mask(1) | Linear/radial ramp |

### 3.6 Composite Nodes (Red)

| Node | Inputs | Outputs | Description |
|------|--------|---------|-------------|
| **Blend** | Image(2), Mask(1) | Image(1) | Blend with mask |
| **Mix** | Image(2), Factor(1) | Image(1) | Opacity mix |
| **Layer** | Image(N) | Image(1) | Photoshop-like layers |
| **Split/Combine** | Image(1) / RGB(3) | RGB(3) / Image(1) | Channel ops |

### 3.7 Utility Nodes (Gray)

| Node | Inputs | Outputs | Description |
|------|--------|---------|-------------|
| **Invert** | Image(1) | Image(1) | Invert colors |
| **Blur** | Image(1) | Image(1) | Gaussian blur |
| **Sharpen** | Image(1) | Image(1) | Unsharp mask |
| **Noise** | — | Image(1) | Film grain |
| **Vignette** | Image(1) | Image(1) | Edge darkening |

## 4. Node Graph Data Model

```javascript
class NodeGraph {
  constructor() {
    this.nodes = new Map();       // id → Node
    this.connections = [];        // [{from: {nodeId, portIndex}, to: {nodeId, portIndex}}]
    this.outputNodeId = null;     // designated output node
  }

  // Topological sort for execution order
  getExecutionOrder() {
    // Kahn's algorithm
    const inDegree = {};
    const adj = {};
    
    for (let [id] of this.nodes) {
      inDegree[id] = 0;
      adj[id] = [];
    }
    
    for (let conn of this.connections) {
      adj[conn.from.nodeId].push(conn.to.nodeId);
      inDegree[conn.to.nodeId]++;
    }
    
    const queue = [];
    for (let [id, deg] of Object.entries(inDegree)) {
      if (deg === 0) queue.push(id);
    }
    
    const order = [];
    while (queue.length) {
      const node = queue.shift();
      order.push(node);
      for (let neighbor of adj[node]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) queue.push(neighbor);
      }
    }
    
    return order;
  }

  // Execute entire graph
  async execute() {
    const order = this.getExecutionOrder();
    const results = new Map();
    
    for (let nodeId of order) {
      const node = this.nodes.get(nodeId);
      const inputs = this.collectInputs(nodeId);
      results.set(nodeId, await node.process(inputs));
    }
    
    return results.get(this.outputNodeId);
  }
}
```

## 5. Node Editor UI (Canvas-Based)

### 5.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌────────────────────────────────────────┐   │
│  │ NODE    │  │                                        │   │
│  │ PALETTE │  │         NODE GRAPH CANVAS              │   │
│  │         │  │                                        │   │
│  │ ▸Source │  │   ┌─────────┐    ┌─────────┐          │   │
│  │ ▸Transfer│  │   │ Source  │───→│ Transfer│──┐       │   │
│  │ ▸Color  │  │   └─────────┘    └─────────┘  │       │   │
│  │ ▸Tone   │  │                               ▼       │   │
│  │ ▸Select │  │                          ┌─────────┐  │   │
│  │ ▸Comp   │  │                    ┌─────│  Blend  │  │   │
│  │ ▸Utility│  │                    │     └────┬────┘  │   │
│  │         │  │              ┌─────┴──┐        │       │   │
│  └─────────┘  │              │Exposure│        ▼       │   │
│               │              └────────┘  ┌─────────┐  │   │
│               │                          │ Output   │  │   │
│               │                          └─────────┘  │   │
│               └────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  INSPECTOR PANEL (selected node parameters)          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ Strength: [═══════════●════════] 75%            │  │  │
│  │  │ Method:  [Reinhard LAB ▼]                      │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│            ┌───────────────────┐                           │
│            │   LIVE PREVIEW    │                           │
│            │   (selected node) │                           │
│            └───────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Interaction Model

```
Canvas Controls:
  ├── Scroll wheel → Zoom in/out
  ├── Middle-drag → Pan canvas
  ├── Right-click → Context menu (add nodes)
  ├── Left-drag node → Move node
  ├── Drag from port → Create connection wire
  ├── Click node → Select / show inspector
  ├── Click port → Start/end connection
  ├── Shift-click → Multi-select nodes
  ├── Delete/Backspace → Remove selected
  └── Ctrl+D → Duplicate selected

Node Visual:
  ┌──────────────────────┐
  │ ● Input Port         │
  │ ┌──────────────────┐ │
  │ │    NODE TITLE    │ │
  │ │    ─────────     │ │
  │ │   Mini preview   │ │
  │ │   thumbnail      │ │
  │ └──────────────────┘ │
  │ ● Output Port        │
  └──────────────────────┘
```

## 6. Integration with Existing System

### 6.1 Architecture Evolution

```
┌──────────────────────────────────────────────────────────────┐
│                      APP LAYER                               │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────────────┐│
│  │ Simple Mode│  │ Node Mode  │  │  Reference Discovery    ││
│  │ (existing) │  │  (new)     │  │  (search/AI)            ││
│  └─────┬──────┘  └─────┬──────┘  └───────────┬─────────────┘│
│        │               │                      │              │
│        └───────────────┼──────────────────────┘              │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              PROCESSING ENGINE                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ Transfer     │  │ Adjustments  │  │ Node Graph    │  │ │
│  │  │ Engine       │  │ Engine       │  │ Executor      │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
│                        │                                     │
│                        ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              RENDER & DISPLAY                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ Canvas       │  │ Histogram    │  │ Analysis     │  │ │
│  │  │ Display      │  │ Viz          │  │ Engine       │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Shared Processing Core

```javascript
// New class: NodeProcessor (extends existing logic)
class NodeProcessor {
  static registry = {
    // Existing operations exposed as node-compatible functions
    'color_transfer': (input, params) => colorTransfer.transferColors(...),
    'temperature': (input, params) => imageAdjustments.applyTemperature(...),
    'contrast': (input, params) => imageAdjustments.applyContrast(...),
    'exposure': (input, params) => imageAdjustments.applyExposure(...),
    'saturation': (input, params) => imageAdjustments.applySaturation(...),
    'tint': (input, params) => imageAdjustments.applyTint(...),
    'highlights': (input, params) => imageAdjustments.applyHighlights(...),
    'shadows': (input, params) => imageAdjustments.applyShadows(...),
    
    // New node-only operations
    'curves': (input, params) => NodeProcessor.applyCurves(input, params),
    'levels': (input, params) => NodeProcessor.applyLevels(input, params),
    'blend': (inputs, params) => NodeProcessor.blendImages(inputs, params),
    'luminance_key': (input, params) => NodeProcessor.luminanceKey(input, params),
    'color_key': (input, params) => NodeProcessor.colorKey(input, params),
  };
}
```

### 6.3 Mode Switching

```javascript
// app.js additions
let currentMode = 'simple'; // 'simple' | 'node'

function switchMode(mode) {
  currentMode = mode;
  if (mode === 'simple') {
    // Show existing slider UI, hide node editor
    adjustmentsSection.style.display = 'block';
    nodeEditorContainer.style.display = 'none';
  } else {
    // Hide slider UI, show node editor
    adjustmentsSection.style.display = 'none';
    nodeEditorContainer.style.display = 'block';
    // Convert current adjustments to equivalent node graph
    nodeGraph = convertAdjustmentsToGraph(imageAdjustments.currentAdjustments);
  }
}
```

## 7. Node Preset System

### 7.1 Preset = Serialized Node Graph

```javascript
// Preset format (JSON)
{
  "name": "Cinematic Teal & Orange",
  "version": "1.0",
  "tags": ["cinematic", "warm", "teal"],
  "thumbnail": "data:image/png;base64,...",
  "graph": {
    "nodes": [
      {
        "id": "n1",
        "type": "image_loader",
        "position": { "x": 100, "y": 200 },
        "params": {}
      },
      {
        "id": "n2",
        "type": "color_transfer", 
        "position": { "x": 350, "y": 200 },
        "params": { "method": "reinhard-lab", "strength": 0.85 }
      },
      {
        "id": "n3",
        "type": "curves",
        "position": { "x": 600, "y": 200 },
        "params": { 
          "curve": [[0,0], [64,50], [128,128], [192,206], [255,255]] 
        }
      },
      {
        "id": "n4",
        "type": "output",
        "position": { "x": 850, "y": 200 },
        "params": {}
      }
    ],
    "connections": [
      { "from": { "nodeId": "n1", "portIndex": 0 }, "to": { "nodeId": "n2", "portIndex": 0 } },
      { "from": { "nodeId": "n2", "portIndex": 0 }, "to": { "nodeId": "n3", "portIndex": 0 } },
      { "from": { "nodeId": "n3", "portIndex": 0 }, "to": { "nodeId": "n4", "portIndex": 0 } }
    ]
  }
}
```

### 7.2 Preset Library

```javascript
// src/presets/preset-library.js
const DEFAULT_PRESETS = [
  {
    name: "Cinematic Teal & Orange",
    graph: { /* ... */ }
  },
  {
    name: "Vintage Film Fade",
    graph: { /* ... */ }
  },
  {
    name: "Cyberpunk Neon",
    graph: { /* ... */ }
  },
  {
    name: "Moody Desaturated",
    graph: { /* ... */ }
  },
  {
    name: "Bright Commercial",
    graph: { /* ... */ }
  }
];
```

## 8. File Structure (New)

```
chromamatch-lite/
├── index.html                          # Updated with mode toggle
├── styles.css                          # + node editor styles
├── src/
│   ├── ui/
│   │   ├── app.js                      # Updated with mode management
│   │   └── node-editor.js              # NEW: Canvas-based node editor UI
│   ├── engine/
│   │   ├── transfer/
│   │   │   └── color-transfer.js       # Existing
│   │   ├── adjustments/
│   │   │   └── image-adjustments.js    # Existing
│   │   └── nodes/                      # NEW: Node graph engine
│   │       ├── node-graph.js           # Graph data structure
│   │       ├── node-processor.js       # Node execution engine
│   │       ├── node-types.js           # Node type definitions
│   │       └── curves.js               # NEW: Curves operations
│   ├── analysis/
│   │   └── color-analysis.js           # Existing
│   ├── export/
│   │   ├── export-manager.js           # Existing
│   │   └── lut-export.js               # Existing
│   └── presets/
│       ├── preset-manager.js           # NEW: Preset CRUD
│       └── preset-library.js           # NEW: Default presets
```

## 9. Implementation Plan

### Phase A: Node Graph Engine (Core Logic)

```
Week 1-2: Graph data structure + execution
  ├── src/engine/nodes/node-graph.js
  │   - Node/Port/Connection data classes
  │   - addNode(), removeNode(), connect(), disconnect()
  │   - getExecutionOrder() (topological sort)
  │   - serialize() / deserialize() (JSON)
  │
  ├── src/engine/nodes/node-processor.js
  │   - register node types
  │   - execute single node
  │   - execute entire graph
  │   - cache intermediate results
  │   - dirty propagation (re-eval only changed branches)
  │
  └── src/engine/nodes/node-types.js
      - Define all ~30 node types
      - Each: input ports, output ports, params schema, process()
```

### Phase B: Canvas Editor UI

```
Week 3-4: Interactive node editor
  ├── src/ui/node-editor.js
  │   - Canvas rendering (pan/zoom)
  │   - Node rendering with ports
  │   - Connection wire rendering (curved bezier)
  │   - Drag & drop nodes from palette
  │   - Port connection interaction
  │   - Node selection / multi-select
  │   - Context menu (add/delete/duplicate)
  │
  ├── styles.css additions
  │   - Node appearance
  │   - Wire styling
  │   - Inspector panel
  │
  └── index.html additions
      - Node editor container
      - Inspector panel
      - Palette sidebar
```

### Phase C: Inspector & Parameters

```
Week 5: Node parameter editing
  ├── Auto-generate UI from node param schema
  │   - Slider (number with range)
  │   - Dropdown (enum)
  │   - Color picker (color value)
  │   - Curve editor (spline editor widget)
  │   - Checkbox (boolean)
  │
  └── Real-time preview on parameter change
```

### Phase D: Preset System

```
Week 6: Save/Load/Share node graphs
  ├── src/presets/preset-manager.js
  │   - Save preset (JSON + thumbnail)
  │   - Load preset
  │   - Delete / rename
  │   - LocalStorage persistence
  │   - Export/import .cmgraph files
  │
  └── src/presets/preset-library.js
      - Built-in presets
      - Preset browser UI
```

### Phase E: Integration & Polish

```
Week 7-8:
  ├── Simple/Node mode toggle
  ├── Convert sliders ↔ node graph
  ├── Live preview at any node (alt+click)
  ├── Keyboard shortcuts
  ├── Undo/redo system
  └── Performance optimization
```

## 10. Key Design Decisions

### 10.1 Why Build Custom Instead of Using Rete.js?

```
Custom Canvas Approach:
  ✓ Zero dependencies (match existing philosophy)
  ✓ Full control over rendering (optimized for image preview)
  ✓ Smaller bundle size
  ✓ Easier to integrate with existing ImageData pipeline
  ✓ No framework abstractions to fight

Rete.js Alternative:
  ✓ Faster initial development
  ✗ Adds ~150KB+ dependency
  ✗ Needs adapting for image processing pipeline
  ✗ Less control over node visual (mini previews)
```

### 10.2 Performance Strategy

```javascript
// Smart re-evaluation - only reprocess changed branches
class NodeGraph {
  markDirty(nodeId) {
    // BFS from nodeId through downstream connections
    // Only re-execute nodes that receive data from this node
    const queue = [nodeId];
    const dirty = new Set();
    
    while (queue.length) {
      const current = queue.shift();
      if (dirty.has(current)) continue;
      dirty.add(current);
      
      // Find all downstream nodes
      for (let conn of this.connections) {
        if (conn.from.nodeId === current) {
          queue.push(conn.to.nodeId);
        }
      }
    }
    
    this.dirtyNodes = dirty;
  }
  
  async execute() {
    const order = this.getExecutionOrder();
    for (let nodeId of order) {
      if (!this.dirtyNodes.has(nodeId)) continue; // SKIP
      // ... execute
    }
  }
}
```

### 10.3 Web Worker Compatibility

```javascript
// Heavy processing can be offloaded to Web Workers
class WebWorkerNodeProcessor {
  async executeInWorker(nodeType, inputData, params) {
    const worker = this.getWorker();
    return new Promise((resolve) => {
      worker.postMessage({ nodeType, inputData, params });
      worker.onmessage = (e) => resolve(e.data);
    });
  }
}
```

## 11. UI Wireframes

### 11.1 Node Visual Design

```
┌──────────────────────┐
│ ╭─ Image Loader ───╮ │
│ │ 🖼️ [thumbnail]   │ │
│ │ 800 x 600        │ │
│ ╰──────────────────╯ │
│                   ○──│─── Image
└──────────────────────┘

┌──────────────────────┐
│ ──◎ Source           │
│ ╭─ Color Transfer ─╮ │
│ │ 🎨 [preview]     │ │
│ │ Method: Reinhard │ │
│ ╰──────────────────╯ │
│ ──◎ Reference         │
│                   ○──│─── Image
└──────────────────────┘

┌──────────────────────┐
│ ──◎ Image            │
│ ╭─ Curves ─────────╮ │
│ │    ┌──────────┐  │ │
│ │    │  ▄▄▄▄▄▄  │  │ │
│ │    │ ██      ▄▄│  │ │
│ │    │▄█        │  │ │
│ │    └──────────┘  │ │
│ ╰──────────────────╯ │
│ ──◎ Mask (optional)  │
│                   ○──│─── Image
└──────────────────────┘

┌──────────────────────┐
│ ──◎ Image A          │
│ ──◎ Image B          │
│ ╭─ Blend ──────────╮ │
│ │ Mode: Overlay ▾  │ │
│ │ Opacity: 80%     │ │
│ ╰──────────────────╯ │
│                   ○──│─── Image
└──────────────────────┘
```

## 12. Complete Feature Roadmap

```
PHASE 1 — Foundation (Weeks 1-3)
├── Node Graph data engine
├── Node type system with ~30 types
├── Basic Canvas UI (pan/zoom/render)
└── Simple mode stays functional

PHASE 2 — Editor (Weeks 4-5)
├── Full node editor interaction
├── Inspector panel
├── Connection wires
├── Node palette & drag-and-drop
└── Preview at any node

PHASE 3 — Search Integration (Weeks 6-7)
├── Reference image search (Unsplash/Pexels)
├── AI chat-based search assistant
├── AI image generation (bring-your-own-key)
├── Drag search results into node graph
└── Reference → Source auto-wire

PHASE 4 — Presets & Sessions (Weeks 8-9)
├── Preset save/load/export/import
├── Preset library with thumbnails
├── Session management
├── Undo/redo system
└── Node graph auto-layout

PHASE 5 — Polish (Weeks 10-11)
├── Performance optimization
├── Web Worker offloading
├── Batch processing
├── Community preset sharing
└── Documentation
```

---

*This is a living design document. The node system is the architectural centerpiece that ties together color grading, reference search, and AI features into a cohesive creative workflow.*
