# 🔌 MCP Server — Agent Setup Guide

## Supported Agents

| Agent | Transport | Status |
|-------|-----------|--------|
| **Claude Desktop** | stdio | ✅ Full support |
| **Codex CLI** | stdio | ✅ Full support |
| **Trae Solo** | stdio / HTTP | ✅ Full support |
| **Cursor** | stdio | ✅ Full support |
| **Windsurf** | stdio | ✅ Full support |
| **VS Code Copilot** | stdio | ✅ Full support |
| **Continue.dev** | stdio | ✅ Full support |
| **Any MCP client** | stdio / HTTP | ✅ Full support |

## Supported Image Providers

| Provider | Model | Status |
|----------|-------|--------|
| **OpenAI DALL-E** | dall-e-3 | ✅ |
| **OpenAI GPT-Image** | gpt-image-1 | ✅ |
| **OpenAI GPT-Image 2.0** | gpt-image-2 | ✅ |
| **Nanobanana** | flux-schnell | ✅ |
| **Nanobanana Pro 2** | flux-pro-2 | ✅ |
| **Google Imagen** | imagen-3.0 | ✅ |
| **Stability AI** | sd3 | ✅ |
| **Replicate** | flux-schnell | ✅ |

---

## Quick Start (All Agents)

```bash
# 1. Clone and setup
cd chromamatch-lite
cp .env.example .env
# Edit .env with your API keys

# 2. Install MCP server dependencies
cd mcp-server && npm install

# 3. The server is ready — configure your agent below
```

---

## Claude Desktop

**Config file location:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "chromamatch": {
      "command": "node",
      "args": ["/absolute/path/to/chromamatch-lite/mcp-server/server.js"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here",
        "UNSPLASH_ACCESS_KEY": "your-key-here"
      }
    }
  }
}
```

**Or use .env file (recommended):**
```json
{
  "mcpServers": {
    "chromamatch": {
      "command": "node",
      "args": ["/absolute/path/to/chromamatch-lite/mcp-server/server.js"]
    }
  }
}
```

---

## Codex CLI (OpenAI)

**Config file:** `~/.codex/config.json` or project `.codex/config.json`

```json
{
  "mcpServers": {
    "chromamatch": {
      "command": "node",
      "args": ["/absolute/path/to/chromamatch-lite/mcp-server/server.js"]
    }
  }
}
```

**Or via CLI:**
```bash
codex --mcp-server chromamatch="node /path/to/chromamatch-lite/mcp-server/server.js"
```

---

## Trae Solo

**Option A: stdio transport (recommended)**

In Trae settings → MCP Servers → Add:
- Name: `chromamatch`
- Command: `node`
- Args: `/absolute/path/to/chromamatch-lite/mcp-server/server.js`

**Option B: HTTP transport**

```bash
# Start server in HTTP mode
cd mcp-server && npm run http
```

In Trae settings → MCP Servers → Add:
- Name: `chromamatch`
- URL: `http://localhost:3456/mcp`
- Transport: HTTP

---

## Cursor

**Config file:** `.cursor/mcp.json` (project root) or global settings

```json
{
  "mcpServers": {
    "chromamatch": {
      "command": "node",
      "args": ["/absolute/path/to/chromamatch-lite/mcp-server/server.js"]
    }
  }
}
```

---

## Windsurf

**Config file:** `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "chromamatch": {
      "command": "node",
      "args": ["/absolute/path/to/chromamatch-lite/mcp-server/server.js"]
    }
  }
}
```

---

## VS Code Copilot

Install the "Copilot Chat" extension with MCP support, then add to settings:

```json
{
  "github.copilot.chat.mcpServers": {
    "chromamatch": {
      "command": "node",
      "args": ["/absolute/path/to/chromamatch-lite/mcp-server/server.js"]
    }
  }
}
```

---

## Continue.dev

**Config file:** `~/.continue/config.yaml`

```yaml
mcpServers:
  - name: chromamatch
    command: node
    args:
      - /absolute/path/to/chromamatch-lite/mcp-server/server.js
```

---

## Custom Provider Examples

### Self-hosted Stable Diffusion (via ComfyUI/A1111 API)

```
Agent: "Register a custom image generation provider pointing to my local Stable Diffusion server"
→ chromamatch_register_provider({
    id: "local-sd",
    name: "Local Stable Diffusion",
    type: "openai",
    base_url: "http://localhost:7860/v1",
    endpoint: "/images/generations",
    model: "sd-xl",
    request_body_template: {
      model: "{model}",
      prompt: "{prompt}",
      n: 1,
      size: "{size}",
      response_format: "b64_json"
    },
    response_extractor: "data[0].b64_json"
  })
```

### Midjourney Proxy

```
Agent: "Register my Midjourney proxy as a provider"
→ chromamatch_register_provider({
    id: "midjourney-proxy",
    name: "Midjourney via Proxy",
    type: "openai",
    base_url: "https://my-mj-proxy.com/v1",
    endpoint: "/images/generations",
    model: "midjourney",
    request_body_template: {
      model: "{model}",
      prompt: "{prompt}",
      n: 1
    },
    response_extractor: "data[0].url"
  })
```

### Groq / Together AI / Fireworks (OpenAI-compatible)

```
Agent: "Use Together AI for image generation"
→ chromamatch_generate_image({
    provider: "openai",
    prompt: "cinematic teal and orange color grading reference",
    base_url: "https://api.together.xyz/v1",
    model: "black-forest-labs/FLUX.1-schnell-Free",
    api_key: "your-together-key"
  })
```

### Nanobanana (Built-in Provider)

```
Agent: "Generate a reference image using Nanobanana Standard"
→ chromamatch_generate_image({
    provider: "nanobanana",
    prompt: "warm golden hour portrait reference",
    size: "1024x1024"
  })

Agent: "Generate a high-quality reference using Nanobanana Pro 2"
→ chromamatch_generate_image({
    provider: "nanobanana-pro2",
    prompt: "cinematic teal and orange color grading reference",
    size: "2048x2048"
  })
```

### OpenAI GPT-Image 2.0 (Latest)

```
Agent: "Generate a reference using OpenAI's latest GPT-Image 2.0"
→ chromamatch_generate_image({
    provider: "openai-gpt-image-2",
    prompt: "cinematic moody portrait with warm highlights and teal shadows",
    size: "2048x2048",
    quality: "high"
  })
```

---

## Available MCP Tools (20 tools)

### Image Generation
| Tool | Description |
|------|-------------|
| `chromamatch_generate_image` | Generate reference images with any AI provider |
| `chromamatch_list_providers` | List all available image generation providers |
| `chromamatch_register_provider` | Add a custom image generation endpoint |
| `chromamatch_unregister_provider` | Remove a custom provider |

### API Key Management
| Tool | Description |
|------|-------------|
| `chromamatch_set_api_key` | Set API key at runtime (memory only) |
| `chromamatch_get_key_status` | Check which keys are configured |
| `chromamatch_validate_keys` | Validate key formats |
| `chromamatch_clear_api_key` | Clear a runtime key |

### Color Grading
| Tool | Description |
|------|-------------|
| `chromamatch_transfer` | Apply color transfer |
| `chromamatch_auto_tune` | Auto-optimize color match |
| `chromamatch_analyze_result` | Analyze match quality |
| `chromamatch_get_feedback_loop` | Iterative refinement loop |

### Node Graph
| Tool | Description |
|------|-------------|
| `chromamatch_list_nodes` | List available node types |
| `chromamatch_build_graph` | Build a processing graph |
| `chromamatch_execute_graph` | Execute the graph |

### Reference & Presets
| Tool | Description |
|------|-------------|
| `chromamatch_search_reference` | Search stock photo APIs |
| `chromamatch_load_preset` | Load a color grading preset |
| `chromamatch_save_preset` | Save current graph as preset |

### Export
| Tool | Description |
|------|-------------|
| `chromamatch_export` | Export image or LUT file |

---

## Example Agent Conversations

**Claude/Codex/Trae:**
```
You: "Generate a cinematic teal and orange reference image"
Agent: [calls chromamatch_generate_image with provider=openai, prompt="..."]
Agent: "Here's the generated reference image. Want me to use it for color matching?"

You: "Register my local ComfyUI server as a provider"
Agent: [calls chromamatch_register_provider with base_url=http://localhost:8188/v1]
Agent: "Done! Your local ComfyUI is now available as provider 'comfyui'."

You: "Generate a reference using my local server with a cyberpunk neon prompt"
Agent: [calls chromamatch_generate_image with provider=comfyui, prompt="cyberpunk neon..."]
```
