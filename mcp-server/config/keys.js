/**
 * Secure API Key Loader for MCP Server
 * 
 * Priority order:
 * 1. Runtime injection via MCP tool (memory only)
 * 2. Environment variables (process.env / .env file)
 * 
 * Supports dynamic provider registration — new providers can be added
 * at runtime via registerKeyProvider().
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
        validate: (key) => key && key.length > 20,
        description: 'Unsplash API Access Key'
    },
    pexels: {
        envVar: 'PEXELS_API_KEY',
        validate: (key) => key && key.length > 20,
        description: 'Pexels API Key'
    },
    openai: {
        envVar: 'OPENAI_API_KEY',
        validate: (key) => key && key.startsWith('sk-'),
        description: 'OpenAI API Key'
    },
    'openai-gpt-image': {
        envVar: 'OPENAI_API_KEY',
        validate: (key) => key && key.startsWith('sk-'),
        description: 'OpenAI GPT-Image (shares OPENAI_API_KEY)'
    },
    'openai-gpt-image-2': {
        envVar: 'OPENAI_API_KEY',
        validate: (key) => key && key.startsWith('sk-'),
        description: 'OpenAI GPT-Image 2.0 (shares OPENAI_API_KEY)'
    },
    nanobanana: {
        envVar: 'NANOBANANA_API_KEY',
        validate: (key) => key && key.length > 20,
        description: 'Nanobanana API Key'
    },
    'nanobanana-pro2': {
        envVar: 'NANOBANANA_API_KEY',
        validate: (key) => key && key.length > 20,
        description: 'Nanobanana Pro 2 (shares NANOBANANA_API_KEY)'
    },
    google: {
        envVar: 'GOOGLE_AI_KEY',
        validate: (key) => key && key.length > 20,
        description: 'Google AI API Key'
    },
    stability: {
        envVar: 'STABILITY_API_KEY',
        validate: (key) => key && key.length > 20,
        description: 'Stability AI API Key'
    },
    replicate: {
        envVar: 'REPLICATE_API_TOKEN',
        validate: (key) => key && key.length > 20,
        description: 'Replicate API Token'
    }
};

// Runtime key storage (for keys injected via MCP tool — memory only, never persisted)
const runtimeKeys = new Map();

/**
 * Register a key provider dynamically (for custom image generation providers)
 */
export function registerKeyProvider(providerId, config) {
    KEY_REGISTRY[providerId] = {
        envVar: config.envVar || `${providerId.toUpperCase()}_API_KEY`,
        validate: config.validate || ((key) => key && key.length > 10),
        description: config.description || `Custom provider: ${providerId}`
    };
}

/**
 * Get an API key by provider name
 */
export function getApiKey(provider) {
    const registry = KEY_REGISTRY[provider];
    if (!registry) {
        // Auto-register unknown providers with a default env var
        registerKeyProvider(provider, {});
        return process.env[`${provider.toUpperCase()}_API_KEY`] || null;
    }

    // Priority 1: Runtime injection (memory only)
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
 * Set a runtime API key (used by MCP tool — memory only, not persisted)
 */
export function setApiKey(provider, key) {
    if (key && key.trim()) {
        runtimeKeys.set(provider, key.trim());
    } else {
        runtimeKeys.delete(provider);
    }
}

/**
 * Check if a provider has a configured key
 */
export function hasApiKey(provider) {
    return getApiKey(provider) !== null;
}

/**
 * Get key status for all providers (without revealing key values)
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

/**
 * Mask a key for display
 */
export function maskKey(key) {
    if (!key || key.length < 12) return '****';
    return `${key.slice(0, 4)}${'*'.repeat(8)}${key.slice(-4)}`;
}

export { KEY_REGISTRY };
