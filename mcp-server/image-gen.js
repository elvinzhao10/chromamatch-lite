/**
 * Universal Image Generation Adapter
 * 
 * Supports any image generation API via configurable providers.
 * Built-in adapters for OpenAI, Google, Stability, and any OpenAI-compatible endpoint.
 * Custom providers can be added at runtime via MCP tool or config file.
 * 
 * Provider config schema:
 * {
 *   id: string,
 *   name: string,
 *   type: 'openai' | 'google' | 'stability' | 'custom',
 *   baseUrl: string,          // e.g. "https://api.openai.com/v1"
 *   apiKeyEnvVar: string,    // e.g. "OPENAI_API_KEY"
 *   endpoint: string,        // e.g. "/images/generations"
 *   model: string,           // e.g. "dall-e-3"
 *   defaultSize: string,     // e.g. "1024x1024"
 *   supportedSizes: string[],
 *   headers: object,         // extra headers
 *   requestBodyTemplate: object,  // custom request body shape
 *   responseExtractor: string     // jsonpath-like extractor for image URL/base64
 * }
 */

import { getApiKey, setApiKey, hasApiKey } from '../config/keys.js';

// ============================================================
// Built-in Provider Definitions
// ============================================================

const BUILTIN_PROVIDERS = {
    openai: {
        id: 'openai',
        name: 'OpenAI (DALL-E)',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        endpoint: '/images/generations',
        model: 'dall-e-3',
        defaultSize: '1024x1024',
        supportedSizes: ['1024x1024', '1024x1792', '1792x1024'],
        headers: {},
        requestBodyTemplate: {
            model: '{model}',
            prompt: '{prompt}',
            n: 1,
            size: '{size}',
            quality: 'standard',
            response_format: 'b64_json'
        },
        responseExtractor: 'data[0].b64_json'
    },
    'openai-gpt-image': {
        id: 'openai-gpt-image',
        name: 'OpenAI GPT-Image (gpt-image-1)',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        endpoint: '/images/generations',
        model: 'gpt-image-1',
        defaultSize: '1024x1024',
        supportedSizes: ['1024x1024', '1536x1024', '1024x1536'],
        headers: {},
        requestBodyTemplate: {
            model: '{model}',
            prompt: '{prompt}',
            n: 1,
            size: '{size}',
            quality: 'medium',
            response_format: 'b64_json'
        },
        responseExtractor: 'data[0].b64_json'
    },
    'openai-gpt-image-2': {
        id: 'openai-gpt-image-2',
        name: 'OpenAI GPT-Image 2.0 (gpt-image-2)',
        type: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        endpoint: '/images/generations',
        model: 'gpt-image-2',
        defaultSize: '1024x1024',
        supportedSizes: ['1024x1024', '1536x1024', '1024x1536', '2048x2048'],
        headers: {},
        requestBodyTemplate: {
            model: '{model}',
            prompt: '{prompt}',
            n: 1,
            size: '{size}',
            quality: 'high',
            response_format: 'b64_json'
        },
        responseExtractor: 'data[0].b64_json'
    },
    'nanobanana': {
        id: 'nanobanana',
        name: 'Nanobanana (Standard)',
        type: 'openai',
        baseUrl: 'https://api.nanobanana.com/v1',
        apiKeyEnvVar: 'NANOBANANA_API_KEY',
        endpoint: '/images/generations',
        model: 'flux-schnell',
        defaultSize: '1024x1024',
        supportedSizes: ['512x512', '768x768', '1024x1024'],
        headers: {},
        requestBodyTemplate: {
            model: '{model}',
            prompt: '{prompt}',
            n: 1,
            size: '{size}',
            response_format: 'b64_json'
        },
        responseExtractor: 'data[0].b64_json'
    },
    'nanobanana-pro2': {
        id: 'nanobanana-pro2',
        name: 'Nanobanana Pro 2',
        type: 'openai',
        baseUrl: 'https://api.nanobanana.com/v1',
        apiKeyEnvVar: 'NANOBANANA_API_KEY',
        endpoint: '/images/generations',
        model: 'flux-pro-2',
        defaultSize: '1024x1024',
        supportedSizes: ['512x512', '768x768', '1024x1024', '1536x1536', '2048x2048'],
        headers: {},
        requestBodyTemplate: {
            model: '{model}',
            prompt: '{prompt}',
            n: 1,
            size: '{size}',
            quality: 'high',
            response_format: 'b64_json'
        },
        responseExtractor: 'data[0].b64_json'
    },
    google: {
        id: 'google',
        name: 'Google Imagen',
        type: 'google',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKeyEnvVar: 'GOOGLE_AI_KEY',
        endpoint: '/models/imagen-3.0-generate-002:predict',
        model: 'imagen-3.0-generate-002',
        defaultSize: '1024x1024',
        supportedSizes: ['256x256', '512x512', '1024x1024'],
        headers: {},
        requestBodyTemplate: {
            instances: [{ prompt: '{prompt}' }],
            parameters: { sampleCount: 1 }
        },
        responseExtractor: 'predictions[0].bytesBase64Encoded'
    },
    stability: {
        id: 'stability',
        name: 'Stability AI',
        type: 'stability',
        baseUrl: 'https://api.stability.ai/v2beta',
        apiKeyEnvVar: 'STABILITY_API_KEY',
        endpoint: '/stable-image/generate/sd3',
        model: 'stable-diffusion-3',
        defaultSize: '1024x1024',
        supportedSizes: ['1024x1024', '1344x768', '768x1344'],
        headers: { 'Accept': 'image/*' },
        requestBodyTemplate: {
            prompt: '{prompt}',
            model: '{model}',
            output_format: 'png'
        },
        responseExtractor: '_raw_binary'
    },
    replicate: {
        id: 'replicate',
        name: 'Replicate',
        type: 'openai',
        baseUrl: 'https://api.replicate.com/v1',
        apiKeyEnvVar: 'REPLICATE_API_TOKEN',
        endpoint: '/models/black-forest-labs/flux-schnell/predictions',
        model: 'flux-schnell',
        defaultSize: '1024x1024',
        supportedSizes: ['256x256', '512x512', '768x768', '1024x1024'],
        headers: {},
        requestBodyTemplate: {
            input: {
                prompt: '{prompt}',
                width: '{width}',
                height: '{height}',
                num_outputs: 1
            }
        },
        responseExtractor: 'output[0]'
    }
};

// Runtime-registered custom providers
const customProviders = new Map();

/**
 * Get all available providers (built-in + custom)
 */
export function getAllProviders() {
    const builtIn = Object.values(BUILTIN_PROVIDERS);
    const custom = Array.from(customProviders.values());
    return [...builtIn, ...custom];
}

/**
 * Get a provider by ID
 */
export function getProvider(providerId) {
    if (BUILTIN_PROVIDERS[providerId]) return BUILTIN_PROVIDERS[providerId];
    if (customProviders.has(providerId)) return customProviders.get(providerId);
    return null;
}

/**
 * Register a custom provider at runtime
 */
export function registerProvider(config) {
    if (!config.id || !config.baseUrl || !config.endpoint) {
        throw new Error('Provider config must include id, baseUrl, and endpoint');
    }

    const provider = {
        id: config.id,
        name: config.name || config.id,
        type: config.type || 'openai',
        baseUrl: config.baseUrl.replace(/\/+$/, ''),
        apiKeyEnvVar: config.apiKeyEnvVar || `${config.id.toUpperCase()}_API_KEY`,
        endpoint: config.endpoint.startsWith('/') ? config.endpoint : `/${config.endpoint}`,
        model: config.model || 'default',
        defaultSize: config.defaultSize || '1024x1024',
        supportedSizes: config.supportedSizes || ['1024x1024'],
        headers: config.headers || {},
        requestBodyTemplate: config.requestBodyTemplate || {
            model: '{model}',
            prompt: '{prompt}',
            n: 1,
            size: '{size}',
            response_format: 'b64_json'
        },
        responseExtractor: config.responseExtractor || 'data[0].b64_json'
    };

    customProviders.set(config.id, provider);

    // Auto-register the API key env var in the key registry
    if (config.apiKey) {
        setApiKey(config.id, config.apiKey);
    }

    return provider;
}

/**
 * Remove a custom provider
 */
export function unregisterProvider(providerId) {
    return customProviders.delete(providerId);
}

// ============================================================
// Response Extractors
// ============================================================

/**
 * Extract image data from provider response using a simple path expression
 * Supports: data[0].b64_json, predictions[0].bytesBase64Encoded, output[0], _raw_binary
 */
function extractResponse(responseBody, extractor, responseBuffer) {
    if (extractor === '_raw_binary') {
        // Raw binary response (e.g., Stability API returns image directly)
        return { type: 'binary', data: responseBuffer };
    }

    // Navigate JSON path like "data[0].b64_json"
    const parts = extractor.replace(/\[(\d+)\]/g, '.$1').split('.');
    let current = responseBody;

    for (const part of parts) {
        if (current == null) return null;
        current = current[part];
    }

    if (current == null) return null;

    // Determine if it's base64 or URL
    if (typeof current === 'string') {
        if (current.startsWith('http://') || current.startsWith('https://')) {
            return { type: 'url', data: current };
        }
        // Assume base64
        return { type: 'base64', data: current };
    }

    return { type: 'raw', data: current };
}

// ============================================================
// Request Body Builder
// ============================================================

/**
 * Build request body from template, replacing placeholders
 */
function buildRequestBody(template, vars) {
    const body = JSON.parse(JSON.stringify(template));

    function replacePlaceholders(obj) {
        if (typeof obj === 'string') {
            return obj.replace(/\{(\w+)\}/g, (_, key) => vars[key] !== undefined ? vars[key] : '');
        }
        if (Array.isArray(obj)) {
            return obj.map(item => replacePlaceholders(item));
        }
        if (obj && typeof obj === 'object') {
            const result = {};
            for (const [k, v] of Object.entries(obj)) {
                result[k] = replacePlaceholders(v);
            }
            return result;
        }
        return obj;
    }

    return replacePlaceholders(body);
}

// ============================================================
// Size Parser
// ============================================================

function parseSize(sizeStr) {
    const parts = sizeStr.split('x').map(Number);
    return { width: parts[0] || 1024, height: parts[1] || 1024 };
}

// ============================================================
// Main Generate Function
// ============================================================

/**
 * Generate an image using the specified provider
 * 
 * @param {Object} options
 * @param {string} options.provider - Provider ID (e.g., 'openai', 'google', or custom ID)
 * @param {string} options.prompt - Text prompt for image generation
 * @param {string} [options.model] - Override model name
 * @param {string} [options.size] - Image size (e.g., '1024x1024')
 * @param {string} [options.quality] - Quality setting
 * @param {number} [options.n] - Number of images
 * @param {object} [options.extraParams] - Additional parameters merged into request body
 * @param {string} [options.apiKey] - Override API key (runtime injection)
 * @param {string} [options.baseUrl] - Override base URL
 * @returns {Promise<{success: boolean, image?: string, url?: string, provider: string, model: string, revisedPrompt?: string, error?: string}>}
 */
export async function generateImage(options) {
    const {
        provider: providerId,
        prompt,
        model: modelOverride,
        size: sizeOverride,
        quality,
        n = 1,
        extraParams = {},
        apiKey: apiKeyOverride,
        baseUrl: baseUrlOverride
    } = options;

    // Resolve provider
    const provider = getProvider(providerId);
    if (!provider) {
        return {
            success: false,
            error: `Unknown provider: ${providerId}. Available: ${getAllProviders().map(p => p.id).join(', ')}`
        };
    }

    // Resolve API key
    const apiKey = apiKeyOverride || getApiKey(providerId);
    if (!apiKey) {
        return {
            success: false,
            error: `No API key for ${provider.name}. Set via env var ${provider.apiKeyEnvVar} or use chromamatch_set_api_key.`
        };
    }

    // Resolve model and size
    const model = modelOverride || provider.model;
    const size = sizeOverride || provider.defaultSize;
    const { width, height } = parseSize(size);

    // Build URL
    const baseUrl = (baseUrlOverride || provider.baseUrl).replace(/\/+$/, '');
    const endpoint = provider.endpoint.startsWith('/') ? provider.endpoint : `/${provider.endpoint}`;
    const url = provider.type === 'google'
        ? `${baseUrl}${endpoint}?key=${apiKey}`
        : `${baseUrl}${endpoint}`;

    // Build request body
    const bodyVars = { model, prompt, size, width: String(width), height: String(height), quality: quality || 'standard' };
    let requestBody = buildRequestBody(provider.requestBodyTemplate, bodyVars);

    // Merge extra params
    requestBody = deepMerge(requestBody, extraParams);

    // Build headers
    const headers = {
        'Content-Type': 'application/json',
        ...provider.headers
    };

    if (provider.type === 'google') {
        // Google uses query param for key, no auth header needed
    } else if (provider.type === 'stability') {
        headers['Authorization'] = `Bearer ${apiKey}`;
    } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMsg = `API error: ${response.status}`;
            try {
                const errBody = await response.json();
                errorMsg = errBody.error?.message || errBody.message || errorMsg;
            } catch { /* use default error */ }
            return { success: false, error: errorMsg, provider: providerId, model };
        }

        // Handle raw binary response
        if (provider.responseExtractor === '_raw_binary') {
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            return {
                success: true,
                image: `data:image/png;base64,${base64}`,
                provider: providerId,
                model,
                size,
                revisedPrompt: prompt
            };
        }

        // Handle JSON response
        const responseBody = await response.json();
        const extracted = extractResponse(responseBody, provider.responseExtractor);

        if (!extracted) {
            return {
                success: false,
                error: `Could not extract image from response using path: ${provider.responseExtractor}`,
                provider: providerId,
                model
            };
        }

        if (extracted.type === 'url') {
            // Download the image from URL and convert to base64
            try {
                const imgResponse = await fetch(extracted.data);
                if (!imgResponse.ok) throw new Error(`Failed to download image: ${imgResponse.status}`);
                const buffer = await imgResponse.arrayBuffer();
                const base64 = Buffer.from(buffer).toString('base64');
                return {
                    success: true,
                    image: `data:image/png;base64,${base64}`,
                    url: extracted.data,
                    provider: providerId,
                    model,
                    size,
                    revisedPrompt: responseBody.data?.[0]?.revised_prompt
                };
            } catch (dlError) {
                // Return URL directly if download fails
                return {
                    success: true,
                    image: null,
                    url: extracted.data,
                    provider: providerId,
                    model,
                    size,
                    revisedPrompt: responseBody.data?.[0]?.revised_prompt
                };
            }
        }

        if (extracted.type === 'base64') {
            return {
                success: true,
                image: `data:image/png;base64,${extracted.data}`,
                provider: providerId,
                model,
                size,
                revisedPrompt: responseBody.data?.[0]?.revised_prompt
            };
        }

        return {
            success: true,
            image: extracted.data,
            provider: providerId,
            model,
            size
        };

    } catch (error) {
        return {
            success: false,
            error: error.message,
            provider: providerId,
            model
        };
    }
}

/**
 * List all available providers with their configuration status
 */
export function listProviders() {
    return getAllProviders().map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        model: p.model,
        defaultSize: p.defaultSize,
        supportedSizes: p.supportedSizes,
        hasApiKey: hasApiKey(p.id),
        isCustom: customProviders.has(p.id)
    }));
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object') {
            result[key] = deepMerge(target[key], value);
        } else {
            result[key] = value;
        }
    }
    return result;
}
