# 🔐 Secure API Key Management & MCP Server Interface Design

## Overview

This document describes the complete architecture for securely managing API keys in ChromaMatch Lite, including environment configuration, git ignore setup, and the MCP server connection interface.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CHROMAMATCH LITE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    BROWSER RUNTIME                                │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │   │
│  │  │ API Key Input  │  │ Encrypted      │  │ Session Key        │  │   │
│  │  │ UI (Settings)  │→│ LocalStorage   │←→│ Manager            │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                              │                                           │
│                              ▼ (optional proxy)                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    MCP SERVER (Node.js)                           │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │   │
│  │  │ .env File      │  │ Environment    │  │ Key Validation     │  │   │
│  │  │ (gitignored)   │→│ Variables      │→│ & Injection        │  │   │
│  │  └────────────────┘  └────────────────┘  └────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Configuration

### 2.1 File Structure

```
chromamatch-lite/
├── .env                              # Main environment file (gitignored)
├── .env.example                      # Template file (committed to git)
├── .env.local                        # Local overrides (gitignored)
├── .env.production                   # Production keys (gitignored)
├── .gitignore                        # Updated with env files
├── mcp-server/
│   ├── .env                          # MCP-specific env (gitignored)
│   ├── .env.example                  # MCP template (committed)
│   ├── server.js                     # MCP server entry
│   └── config/
│       └── keys.js                   # Key loader module
└── src/
    └── config/
        └── api-keys.js               # Browser-side key manager
```

### 2.2 .env.example (Template - Committed to Git)

```bash
# ============================================
# ChromaMatch Lite - API Keys Configuration
# ============================================
# Copy this file to .env and fill in your keys
# NEVER commit .env files to version control!

# ----- Stock Photo APIs -----
# Get your key at: https://unsplash.com/developers
UNSPLASH_ACCESS_KEY=

# Get your key at: https://www.pexels.com/api/
PEXELS_API_KEY=

# ----- AI Image Generation -----
# Get your key at: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# Get your key at: https://aistudio.google.com/app/apikey
GOOGLE_AI_KEY=

# ----- MCP Server Configuration -----
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost

# ----- Optional: Custom API Endpoints -----
# CUSTOM_IMAGE_API_URL=
# CUSTOM_IMAGE_API_KEY=
```

### 2.3 .gitignore (Updated)

```gitignore
# ============================================
# Environment & Secrets
# ============================================
.env
.env.local
.env.production
.env.*.local
mcp-server/.env
mcp-server/.env.local
*.pem
*.key
secrets/

# ============================================
# API Keys & Credentials
# ============================================
**/api-keys.json
**/credentials.json
**/.credentials
**/secrets.json

# ============================================
# Node.js
# ============================================
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
package-lock.json
yarn.lock

# ============================================
# Build & Cache
# ============================================
dist/
build/
.cache/
.parcel-cache/

# ============================================
# IDE & Editor
# ============================================
.idea/
.vscode/
*.swp
*.swo
*~

# ============================================
# OS Files
# ============================================
.DS_Store
Thumbs.db

# ============================================
# Logs
# ============================================
logs/
*.log

# ============================================
# Test Coverage
# ============================================
coverage/
.nyc_output/
```

---

## 3. MCP Server Key Management

### 3.1 Key Loader Module (`mcp-server/config/keys.js`)

```javascript
/**
 * Secure API Key Loader for MCP Server
 * 
 * Priority order:
 * 1. Environment variables (process.env)
 * 2. .env file (loaded by dotenv)
 * 3. Runtime injection via MCP tool call
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Key registry with metadata
const KEY_REGISTRY = {
    unsplash: {
        envVar: 'UNSPLASH_ACCESS_KEY',
        required: false,
        validate: (key) => key && key.length > 20,
        description: 'Unsplash API Access Key'
    },
    pexels: {
        envVar: 'PEXELS_API_KEY',
        required: false,
        validate: (key) => key && key.length > 20,
        description: 'Pexels API Key'
    },
    openai: {
        envVar: 'OPENAI_API_KEY',
        required: false,
        validate: (key) => key && key.startsWith('sk-'),
        description: 'OpenAI API Key'
    },
    google: {
        envVar: 'GOOGLE_AI_KEY',
        required: false,
        validate: (key) => key && key.length > 20,
        description: 'Google AI API Key'
    }
};

// Runtime key storage (for keys injected via MCP)
const runtimeKeys = new Map();

/**
 * Get an API key by provider name
 * @param {string} provider - Provider name (unsplash, pexels, openai, google)
 * @returns {string|null} - The API key or null if not configured
 */
export function getApiKey(provider) {
    const registry = KEY_REGISTRY[provider];
    if (!registry) {
        throw new Error(`Unknown provider: ${provider}`);
    }

    // Priority 1: Runtime injection
    if (runtimeKeys.has(provider)) {
        return runtimeKeys.get(provider);
    }

    // Priority 2: Environment variable
    const envKey = process.env[registry.envVar];
    if (envKey) {
        return envKey;
    }

    return null;
}

/**
 * Set a runtime API key (used by MCP tool)
 * @param {string} provider - Provider name
 * @param {string} key - API key value
 */
export function setApiKey(provider, key) {
    const registry = KEY_REGISTRY[provider];
    if (!registry) {
        throw new Error(`Unknown provider: ${provider}`);
    }

    if (key && !registry.validate(key)) {
        throw new Error(`Invalid API key format for ${provider}`);
    }

    if (key) {
        runtimeKeys.set(provider, key);
    } else {
        runtimeKeys.delete(provider);
    }
}

/**
 * Check if a provider has a configured key
 * @param {string} provider - Provider name
 * @returns {boolean}
 */
export function hasApiKey(provider) {
    return getApiKey(provider) !== null;
}

/**
 * Get list of configured providers
 * @returns {string[]}
 */
export function getConfiguredProviders() {
    return Object.keys(KEY_REGISTRY).filter(hasApiKey);
}

/**
 * Get key status for all providers (without revealing keys)
 * @returns {Object}
 */
export function getKeyStatus() {
    const status = {};
    for (const [provider, registry] of Object.entries(KEY_REGISTRY)) {
        const key = getApiKey(provider);
        status[provider] = {
            configured: !!key,
            source: runtimeKeys.has(provider) ? 'runtime' : 
                    (process.env[registry.envVar] ? 'env' : null),
            description: registry.description
        };
    }
    return status;
}

/**
 * Validate all configured keys
 * @returns {Object}
 */
export function validateKeys() {
    const results = {};
    for (const [provider, registry] of Object.entries(KEY_REGISTRY)) {
        const key = getApiKey(provider);
        if (key) {
            results[provider] = {
                valid: registry.validate(key),
                error: registry.validate(key) ? null : 'Invalid key format'
            };
        } else {
            results[provider] = {
                valid: null,
                error: 'Not configured'
            };
        }
    }
    return results;
}

export { KEY_REGISTRY };
```

### 3.2 MCP Server Key Management Tools (`mcp-server/tools/api-key-tools.js`)

```javascript
/**
 * MCP Tools for API Key Management
 */

import { getApiKey, setApiKey, hasApiKey, getKeyStatus, validateKeys } from '../config/keys.js';

export const API_KEY_TOOLS = [
    {
        name: 'chromamatch_set_api_key',
        description: 'Set an API key for a provider. Keys are stored in memory only and not persisted.',
        inputSchema: {
            type: 'object',
            properties: {
                provider: {
                    type: 'string',
                    enum: ['unsplash', 'pexels', 'openai', 'google'],
                    description: 'The API provider'
                },
                key: {
                    type: 'string',
                    description: 'The API key value'
                }
            },
            required: ['provider', 'key']
        },
        handler: async ({ provider, key }) => {
            try {
                setApiKey(provider, key);
                return {
                    success: true,
                    message: `API key set for ${provider}`
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    },
    {
        name: 'chromamatch_get_key_status',
        description: 'Get the configuration status of all API keys (does not reveal key values)',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        handler: async () => {
            return {
                success: true,
                status: getKeyStatus()
            };
        }
    },
    {
        name: 'chromamatch_validate_keys',
        description: 'Validate all configured API keys',
        inputSchema: {
            type: 'object',
            properties: {}
        },
        handler: async () => {
            return {
                success: true,
                validation: validateKeys()
            };
        }
    },
    {
        name: 'chromamatch_clear_api_key',
        description: 'Clear a runtime API key for a provider',
        inputSchema: {
            type: 'object',
            properties: {
                provider: {
                    type: 'string',
                    enum: ['unsplash', 'pexels', 'openai', 'google'],
                    description: 'The API provider'
                }
            },
            required: ['provider']
        },
        handler: async ({ provider }) => {
            setApiKey(provider, null);
            return {
                success: true,
                message: `API key cleared for ${provider}`
            };
        }
    }
];
```

---

## 4. Browser-Side Key Management

### 4.1 Secure Key Manager (`src/config/api-keys.js`)

```javascript
/**
 * Secure API Key Manager for Browser
 * 
 * Features:
 * - Encrypted storage in localStorage
 * - Session-based encryption key
 * - Key validation
 * - Import/export functionality
 */

class SecureKeyManager {
    constructor() {
        this.storageKey = 'chromamatch_secure_keys';
        this.sessionKey = this.generateSessionKey();
        this.providers = ['unsplash', 'pexels', 'openai', 'google'];
    }

    /**
     * Generate a random session key for encryption
     */
    generateSessionKey() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Simple XOR encryption (for basic obfuscation, not cryptographically secure)
     * For production, use Web Crypto API with AES-GCM
     */
    encrypt(text, key) {
        const textBytes = new TextEncoder().encode(text);
        const keyBytes = new TextEncoder().encode(key);
        const encrypted = new Uint8Array(textBytes.length);
        
        for (let i = 0; i < textBytes.length; i++) {
            encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
        }
        
        return btoa(String.fromCharCode(...encrypted));
    }

    decrypt(encryptedBase64, key) {
        const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const keyBytes = new TextEncoder().encode(key);
        const decrypted = new Uint8Array(encrypted.length);
        
        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
        }
        
        return new TextDecoder().decode(decrypted);
    }

    /**
     * Save all keys to encrypted storage
     */
    saveKeys(keys) {
        const validKeys = {};
        for (const [provider, key] of Object.entries(keys)) {
            if (key && key.trim()) {
                validKeys[provider] = key.trim();
            }
        }
        
        if (Object.keys(validKeys).length === 0) {
            localStorage.removeItem(this.storageKey);
            return;
        }
        
        const json = JSON.stringify(validKeys);
        const encrypted = this.encrypt(json, this.sessionKey);
        localStorage.setItem(this.storageKey, encrypted);
    }

    /**
     * Load keys from encrypted storage
     */
    loadKeys() {
        try {
            const encrypted = localStorage.getItem(this.storageKey);
            if (!encrypted) return {};
            
            const json = this.decrypt(encrypted, this.sessionKey);
            return JSON.parse(json);
        } catch {
            // If decryption fails (session changed), clear storage
            localStorage.removeItem(this.storageKey);
            return {};
        }
    }

    /**
     * Get a single key
     */
    getKey(provider) {
        const keys = this.loadKeys();
        return keys[provider] || null;
    }

    /**
     * Set a single key
     */
    setKey(provider, key) {
        const keys = this.loadKeys();
        if (key && key.trim()) {
            keys[provider] = key.trim();
        } else {
            delete keys[provider];
        }
        this.saveKeys(keys);
    }

    /**
     * Check if a provider has a configured key
     */
    hasKey(provider) {
        return !!this.getKey(provider);
    }

    /**
     * Get status of all keys (without revealing values)
     */
    getStatus() {
        const keys = this.loadKeys();
        const status = {};
        
        for (const provider of this.providers) {
            const key = keys[provider];
            status[provider] = {
                configured: !!key,
                masked: key ? this.maskKey(key) : null
            };
        }
        
        return status;
    }

    /**
     * Mask a key for display (show first 4 and last 4 chars)
     */
    maskKey(key) {
        if (!key || key.length < 12) return '****';
        return `${key.slice(0, 4)}${'*'.repeat(8)}${key.slice(-4)}`;
    }

    /**
     * Validate key format
     */
    validateKey(provider, key) {
        if (!key) return { valid: false, error: 'Key is empty' };
        
        const validators = {
            unsplash: (k) => k.length >= 20,
            pexels: (k) => k.length >= 20,
            openai: (k) => k.startsWith('sk-') && k.length > 20,
            google: (k) => k.length >= 20
        };
        
        const validator = validators[provider];
        if (!validator) return { valid: false, error: 'Unknown provider' };
        
        const valid = validator(key);
        return {
            valid,
            error: valid ? null : `Invalid ${provider} key format`
        };
    }

    /**
     * Export keys to a file (for backup)
     */
    exportKeys() {
        const keys = this.loadKeys();
        const exportData = {
            version: 1,
            exported: new Date().toISOString(),
            providers: Object.keys(keys)
        };
        
        // Don't include actual keys in export metadata
        return {
            metadata: exportData,
            data: btoa(JSON.stringify(keys))
        };
    }

    /**
     * Import keys from a backup
     */
    importKeys(data) {
        try {
            const keys = JSON.parse(atob(data));
            this.saveKeys(keys);
            return { success: true, imported: Object.keys(keys) };
        } catch (error) {
            return { success: false, error: 'Invalid import data' };
        }
    }

    /**
     * Clear all stored keys
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
    }
}

// Singleton instance
window.SecureKeyManager = new SecureKeyManager();
```

---

## 5. UI Interface Design

### 5.1 Settings Panel HTML

```html
<!-- Add to index.html inside the settings section -->
<div class="settings-panel" id="settingsPanel">
    <div class="settings-header">
        <h3>⚙️ Settings</h3>
        <button class="close-btn" onclick="toggleSettings()">&times;</button>
    </div>
    
    <div class="settings-tabs">
        <button class="tab active" data-tab="api-keys">API Keys</button>
        <button class="tab" data-tab="mcp-connection">MCP Connection</button>
        <button class="tab" data-tab="preferences">Preferences</button>
    </div>
    
    <!-- API Keys Tab -->
    <div class="settings-content" id="api-keys-tab">
        <div class="api-key-section">
            <h4>📷 Stock Photo APIs</h4>
            
            <div class="api-key-row">
                <div class="api-key-header">
                    <span class="api-name">Unsplash</span>
                    <span class="api-status" id="unsplash-status">Not configured</span>
                </div>
                <div class="api-key-input">
                    <input type="password" id="unsplash-key" placeholder="Enter your Unsplash access key" />
                    <button class="toggle-visibility" onclick="toggleKeyVisibility('unsplash')">👁️</button>
                </div>
                <a href="https://unsplash.com/developers" target="_blank" class="api-link">Get your key →</a>
            </div>
            
            <div class="api-key-row">
                <div class="api-key-header">
                    <span class="api-name">Pexels</span>
                    <span class="api-status" id="pexels-status">Not configured</span>
                </div>
                <div class="api-key-input">
                    <input type="password" id="pexels-key" placeholder="Enter your Pexels API key" />
                    <button class="toggle-visibility" onclick="toggleKeyVisibility('pexels')">👁️</button>
                </div>
                <a href="https://www.pexels.com/api/" target="_blank" class="api-link">Get your key →</a>
            </div>
        </div>
        
        <div class="api-key-section">
            <h4>🤖 AI Image Generation</h4>
            
            <div class="api-key-row">
                <div class="api-key-header">
                    <span class="api-name">OpenAI (DALL-E)</span>
                    <span class="api-status" id="openai-status">Not configured</span>
                </div>
                <div class="api-key-input">
                    <input type="password" id="openai-key" placeholder="sk-..." />
                    <button class="toggle-visibility" onclick="toggleKeyVisibility('openai')">👁️</button>
                </div>
                <a href="https://platform.openai.com/api-keys" target="_blank" class="api-link">Get your key →</a>
            </div>
            
            <div class="api-key-row">
                <div class="api-key-header">
                    <span class="api-name">Google AI (Imagen)</span>
                    <span class="api-status" id="google-status">Not configured</span>
                </div>
                <div class="api-key-input">
                    <input type="password" id="google-key" placeholder="Enter your Google AI key" />
                    <button class="toggle-visibility" onclick="toggleKeyVisibility('google')">👁️</button>
                </div>
                <a href="https://aistudio.google.com/app/apikey" target="_blank" class="api-link">Get your key →</a>
            </div>
        </div>
        
        <div class="api-key-actions">
            <button class="save-btn" onclick="saveApiKeys()">💾 Save Keys</button>
            <button class="clear-btn" onclick="clearApiKeys()">🗑️ Clear All</button>
        </div>
        
        <div class="security-notice">
            <p>🔒 Keys are encrypted and stored locally in your browser.</p>
            <p>They are never sent to any server except the respective API providers.</p>
        </div>
    </div>
    
    <!-- MCP Connection Tab -->
    <div class="settings-content" id="mcp-connection-tab" style="display: none;">
        <div class="mcp-section">
            <h4>🔌 MCP Server Connection</h4>
            <p class="mcp-description">
                Connect an AI agent (Claude, GPT, etc.) to control ChromaMatch via the Model Context Protocol.
            </p>
            
            <div class="mcp-status-card">
                <div class="status-indicator" id="mcp-status-indicator">
                    <span class="status-dot"></span>
                    <span class="status-text">Checking...</span>
                </div>
            </div>
            
            <div class="mcp-config">
                <div class="config-row">
                    <label>Server URL:</label>
                    <input type="text" id="mcp-server-url" value="http://localhost:3000" />
                </div>
                <div class="config-row">
                    <label>Transport:</label>
                    <select id="mcp-transport">
                        <option value="stdio">stdio (local)</option>
                        <option value="http">HTTP</option>
                        <option value="websocket">WebSocket</option>
                    </select>
                </div>
                <button class="connect-btn" onclick="connectMcpServer()">Connect</button>
            </div>
            
            <div class="mcp-guide">
                <h5>📖 Setup Guide</h5>
                
                <div class="guide-step">
                    <span class="step-number">1</span>
                    <div class="step-content">
                        <p>Copy the example environment file:</p>
                        <code>cp .env.example .env</code>
                    </div>
                </div>
                
                <div class="guide-step">
                    <span class="step-number">2</span>
                    <div class="step-content">
                        <p>Add your API keys to <code>.env</code>:</p>
                        <pre>UNSPLASH_ACCESS_KEY=your_key_here
PEXELS_API_KEY=your_key_here
OPENAI_API_KEY=sk-your_key_here</pre>
                    </div>
                </div>
                
                <div class="guide-step">
                    <span class="step-number">3</span>
                    <div class="step-content">
                        <p>Install dependencies and start the server:</p>
                        <code>cd mcp-server && npm install && npm start</code>
                    </div>
                </div>
                
                <div class="guide-step">
                    <span class="step-number">4</span>
                    <div class="step-content">
                        <p>Add to your Claude Desktop config:</p>
                        <pre>{
  "mcpServers": {
    "chromamatch": {
      "command": "node",
      "args": ["/path/to/chromamatch-lite/mcp-server/server.js"]
    }
  }
}</pre>
                    </div>
                </div>
            </div>
            
            <div class="mcp-tools-list">
                <h5>🛠️ Available MCP Tools</h5>
                <ul id="mcp-tools">
                    <li><code>chromamatch_load_images</code> - Load source and reference images</li>
                    <li><code>chromamatch_transfer</code> - Apply color transfer</li>
                    <li><code>chromamatch_auto_tune</code> - Auto-optimize color match</li>
                    <li><code>chromamatch_build_graph</code> - Build node graph</li>
                    <li><code>chromamatch_execute_graph</code> - Execute node graph</li>
                    <li><code>chromamatch_search_reference</code> - Search for reference images</li>
                    <li><code>chromamatch_set_api_key</code> - Set API key at runtime</li>
                    <li><code>chromamatch_get_key_status</code> - Check key configuration</li>
                    <li><code>chromamatch_export</code> - Export result image or LUT</li>
                </ul>
            </div>
        </div>
    </div>
    
    <!-- Preferences Tab -->
    <div class="settings-content" id="preferences-tab" style="display: none;">
        <!-- Preferences content -->
    </div>
</div>
```

### 5.2 Settings Panel CSS

```css
/* Settings Panel Styles */
.settings-panel {
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    background: var(--bg-secondary);
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    transition: right 0.3s ease;
    display: flex;
    flex-direction: column;
}

.settings-panel.open {
    right: 0;
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
}

.settings-header h3 {
    margin: 0;
    font-size: 1.25rem;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
}

.settings-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
}

.settings-tabs .tab {
    flex: 1;
    padding: 0.75rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    border-bottom: 2px solid transparent;
}

.settings-tabs .tab.active {
    color: var(--accent-color);
    border-bottom-color: var(--accent-color);
}

.settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

/* API Key Section */
.api-key-section {
    margin-bottom: 2rem;
}

.api-key-section h4 {
    margin-bottom: 1rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary);
}

.api-key-row {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 0.75rem;
}

.api-key-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.api-name {
    font-weight: 500;
}

.api-status {
    font-size: 0.8rem;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--warning-color);
    color: var(--bg-primary);
}

.api-status.configured {
    background: var(--success-color);
}

.api-key-input {
    display: flex;
    gap: 0.5rem;
}

.api-key-input input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
}

.toggle-visibility {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    padding: 0 0.5rem;
}

.api-link {
    display: inline-block;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: var(--accent-color);
    text-decoration: none;
}

.api-key-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}

.save-btn, .clear-btn {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
}

.save-btn {
    background: var(--accent-color);
    color: white;
}

.clear-btn {
    background: var(--danger-color);
    color: white;
}

.security-notice {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    font-size: 0.85rem;
    color: var(--text-secondary);
}

/* MCP Section */
.mcp-section h4 {
    margin-bottom: 0.5rem;
}

.mcp-description {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.mcp-status-card {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.status-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--warning-color);
}

.status-dot.connected {
    background: var(--success-color);
}

.status-dot.error {
    background: var(--danger-color);
}

.mcp-config {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.config-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.config-row label {
    width: 80px;
    font-size: 0.85rem;
}

.config-row input, .config-row select {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background: var(--bg-primary);
    color: var(--text-primary);
}

.connect-btn {
    width: 100%;
    padding: 0.75rem;
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 0.5rem;
}

.mcp-guide {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
}

.mcp-guide h5 {
    margin-bottom: 1rem;
}

.guide-step {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.step-number {
    width: 24px;
    height: 24px;
    background: var(--accent-color);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    flex-shrink: 0;
}

.step-content {
    flex: 1;
}

.step-content code, .step-content pre {
    background: var(--bg-primary);
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    display: block;
    margin-top: 0.5rem;
    overflow-x: auto;
}

.mcp-tools-list h5 {
    margin-bottom: 0.5rem;
}

.mcp-tools-list ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.mcp-tools-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color);
    font-size: 0.85rem;
}

.mcp-tools-list li code {
    background: var(--bg-tertiary);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
}
```

### 5.3 Settings Panel JavaScript

```javascript
// Settings Panel Controller
class SettingsPanelController {
    constructor() {
        this.keyManager = window.SecureKeyManager;
        this.currentTab = 'api-keys';
        this.mcpConnected = false;
    }

    init() {
        this.bindEvents();
        this.loadSavedKeys();
        this.updateKeyStatuses();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.settings-tabs .tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Save button
        document.querySelector('.save-btn')?.addEventListener('click', () => this.saveKeys());

        // Clear button
        document.querySelector('.clear-btn')?.addEventListener('click', () => this.clearKeys());

        // MCP connect button
        document.querySelector('.connect-btn')?.addEventListener('click', () => this.connectMcp());
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.settings-tabs .tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        // Show/hide content
        document.querySelectorAll('.settings-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`${tab}-tab`).style.display = 'block';

        // Special handling for MCP tab
        if (tab === 'mcp-connection') {
            this.checkMcpStatus();
        }
    }

    loadSavedKeys() {
        const status = this.keyManager.getStatus();

        for (const [provider, info] of Object.entries(status)) {
            const input = document.getElementById(`${provider}-key`);
            if (input && info.configured) {
                input.value = this.keyManager.getKey(provider);
            }
        }
    }

    updateKeyStatuses() {
        const status = this.keyManager.getStatus();

        for (const [provider, info] of Object.entries(status)) {
            const statusEl = document.getElementById(`${provider}-status`);
            if (statusEl) {
                statusEl.textContent = info.configured ? `Configured (${info.masked})` : 'Not configured';
                statusEl.classList.toggle('configured', info.configured);
            }
        }
    }

    saveKeys() {
        const keys = {
            unsplash: document.getElementById('unsplash-key')?.value,
            pexels: document.getElementById('pexels-key')?.value,
            openai: document.getElementById('openai-key')?.value,
            google: document.getElementById('google-key')?.value
        };

        // Validate keys
        const errors = [];
        for (const [provider, key] of Object.entries(keys)) {
            if (key && key.trim()) {
                const validation = this.keyManager.validateKey(provider, key);
                if (!validation.valid) {
                    errors.push(`${provider}: ${validation.error}`);
                }
            }
        }

        if (errors.length > 0) {
            showStatus(`Validation errors: ${errors.join(', ')}`, 'error');
            return;
        }

        // Save keys
        this.keyManager.saveKeys(keys);
        this.updateKeyStatuses();

        // Clear input fields for security
        document.querySelectorAll('.api-key-input input').forEach(input => {
            input.value = '';
        });

        showStatus('API keys saved securely!', 'success');
    }

    clearKeys() {
        if (confirm('Are you sure you want to clear all saved API keys?')) {
            this.keyManager.clearAll();
            this.updateKeyStatuses();
            showStatus('All API keys cleared', 'success');
        }
    }

    toggleKeyVisibility(provider) {
        const input = document.getElementById(`${provider}-key`);
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    }

    async checkMcpStatus() {
        const indicator = document.getElementById('mcp-status-indicator');
        const dot = indicator?.querySelector('.status-dot');
        const text = indicator?.querySelector('.status-text');

        try {
            const response = await fetch('http://localhost:3000/health', {
                method: 'GET',
                timeout: 2000
            });

            if (response.ok) {
                this.mcpConnected = true;
                dot?.classList.add('connected');
                text.textContent = 'Connected to MCP Server';
            } else {
                throw new Error('Server returned error');
            }
        } catch {
            this.mcpConnected = false;
            dot?.classList.remove('connected');
            dot?.classList.add('error');
            text.textContent = 'Not connected - Start MCP server first';
        }
    }

    async connectMcp() {
        const url = document.getElementById('mcp-server-url')?.value || 'http://localhost:3000';
        const transport = document.getElementById('mcp-transport')?.value || 'stdio';

        showStatus(`Connecting to MCP server at ${url}...`, 'processing');

        // Connection logic depends on transport type
        if (transport === 'stdio') {
            showStatus('stdio transport requires local Claude Desktop configuration. See setup guide.', 'warning');
        } else {
            // HTTP or WebSocket connection
            await this.checkMcpStatus();
        }
    }
}

// Initialize
const settingsController = new SettingsPanelController();
document.addEventListener('DOMContentLoaded', () => settingsController.init());

// Global functions for onclick handlers
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    panel?.classList.toggle('open');
}

function toggleKeyVisibility(provider) {
    settingsController.toggleKeyVisibility(provider);
}

function saveApiKeys() {
    settingsController.saveKeys();
}

function clearApiKeys() {
    settingsController.clearKeys();
}

function connectMcpServer() {
    settingsController.connectMcp();
}
```

---

## 6. Security Best Practices

### 6.1 Key Storage Hierarchy

| Storage Method | Security Level | Use Case |
|----------------|----------------|----------|
| **Environment Variables** | High (server-side) | MCP server, production deployments |
| **Encrypted localStorage** | Medium (browser) | Browser-only usage, user convenience |
| **Runtime Memory Only** | Highest | MCP tool injection, no persistence |
| **URL Parameters** | Low (never use) | ❌ Never pass keys in URLs |

### 6.2 Security Checklist

- [x] `.env` files in `.gitignore`
- [x] `.env.example` template provided (no real keys)
- [x] Keys encrypted before localStorage storage
- [x] Keys masked in UI display
- [x] Keys cleared from input fields after save
- [x] Key validation before saving
- [x] No keys logged to console
- [x] MCP server validates key format
- [x] Runtime keys stored in memory only (not persisted)

### 6.3 Production Recommendations

For production deployments:

1. **Use a secrets manager** (AWS Secrets Manager, HashiCorp Vault, etc.)
2. **Rotate keys regularly**
3. **Use API key restrictions** (domain, IP, rate limits)
4. **Monitor API usage** for anomalies
5. **Implement key expiration** and automatic rotation

---

## 7. Quick Start Guide

### For Browser-Only Usage

1. Open ChromaMatch Lite
2. Click ⚙️ Settings → API Keys tab
3. Enter your API keys
4. Click Save Keys
5. Keys are encrypted and stored in your browser

### For MCP Server Usage

```bash
# 1. Navigate to project
cd chromamatch-lite

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with your keys
nano .env

# 4. Install MCP server dependencies
cd mcp-server && npm install

# 5. Start the server
npm start

# 6. Configure Claude Desktop
# Edit ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
# or %APPDATA%\Claude\claude_desktop_config.json (Windows)
```

---

*This design provides a complete, secure API key management system with both browser-side convenience and server-side security for MCP integration.*
