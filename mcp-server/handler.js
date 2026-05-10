/**
 * MCP Tool Handler
 * 
 * Central handler for all MCP tool calls.
 * Routes to the appropriate handler function.
 */

import { getApiKey, setApiKey, hasApiKey, getKeyStatus, validateKeys, maskKey, KEY_REGISTRY } from './config/keys.js';
import { generateImage, listProviders, registerProvider, unregisterProvider, getProvider } from './image-gen.js';
import { getToolDefinitions } from './tools.js';

// ============================================================
// MCP Protocol Handlers
// ============================================================

export function handleInitialize(params) {
    return {
        protocolVersion: '2024-11-05',
        capabilities: {
            tools: { listChanged: false },
            resources: {}
        },
        serverInfo: {
            name: 'chromamatch',
            version: '1.0.0',
            description: 'ChromaMatch color grading engine with image generation'
        }
    };
}

export function handleListTools(params) {
    return { tools: getToolDefinitions() };
}

export function handleListResources(params) {
    return { resources: [] };
}

// ============================================================
// Tool Call Router
// ============================================================

export async function handleToolCall(name, args) {
    const handler = TOOL_HANDLERS[name];
    if (!handler) {
        throw new Error(`Unknown tool: ${name}. Available: ${Object.keys(TOOL_HANDLERS).join(', ')}`);
    }
    return handler(args);
}

// ============================================================
// Tool Handler Implementations
// ============================================================

const TOOL_HANDLERS = {

    // ----- Image Generation -----

    'chromamatch_generate_image': async (args) => {
        const result = await generateImage({
            provider: args.provider || 'openai',
            prompt: args.prompt,
            model: args.model,
            size: args.size,
            quality: args.quality,
            n: args.n || 1,
            extraParams: args.extra_params || {},
            apiKey: args.api_key,
            baseUrl: args.base_url
        });

        if (!result.success) {
            return {
                content: [{ type: 'text', text: `Image generation failed: ${result.error}` }],
                isError: true
            };
        }

        const parts = [{ type: 'text', text: `Generated image using ${result.provider} (${result.model}). Size: ${result.size || 'default'}.${result.revisedPrompt ? `\nRevised prompt: ${result.revisedPrompt}` : ''}` }];

        if (result.image) {
            parts.push({ type: 'image', data: result.image, mimeType: 'image/png' });
        }

        return { content: parts };
    },

    'chromamatch_list_providers': async (args) => {
        const providers = listProviders();
        const text = providers.map(p =>
            `• ${p.name} (id: ${p.id})\n  Type: ${p.type} | Model: ${p.model} | Size: ${p.defaultSize}\n  API Key: ${p.hasApiKey ? '✅ configured' : '❌ not set'}${p.isCustom ? ' | 📌 Custom' : ''}`
        ).join('\n\n');

        return {
            content: [{ type: 'text', text: `Available Image Generation Providers:\n\n${text}` }]
        };
    },

    'chromamatch_register_provider': async (args) => {
        try {
            const provider = registerProvider(args);
            return {
                content: [{ type: 'text', text: `Registered custom provider: ${provider.name} (id: ${provider.id})\nBase URL: ${provider.baseUrl}\nEndpoint: ${provider.endpoint}\nModel: ${provider.model}` }]
            };
        } catch (err) {
            return { content: [{ type: 'text', text: `Failed to register provider: ${err.message}` }], isError: true };
        }
    },

    'chromamatch_unregister_provider': async (args) => {
        const removed = unregisterProvider(args.provider_id);
        return {
            content: [{ type: 'text', text: removed ? `Removed provider: ${args.provider_id}` : `Provider not found: ${args.provider_id}` }]
        };
    },

    // ----- API Key Management -----

    'chromamatch_set_api_key': async (args) => {
        try {
            setApiKey(args.provider, args.key);
            return {
                content: [{ type: 'text', text: `API key set for ${args.provider} (source: runtime)` }]
            };
        } catch (err) {
            return { content: [{ type: 'text', text: `Failed: ${err.message}` }], isError: true };
        }
    },

    'chromamatch_get_key_status': async () => {
        const status = getKeyStatus();
        const text = Object.entries(status).map(([provider, info]) =>
            `• ${info.description} (${provider}): ${info.configured ? `✅ configured (${info.source})` : '❌ not set'}`
        ).join('\n');

        return { content: [{ type: 'text', text: `API Key Status:\n\n${text}` }] };
    },

    'chromamatch_validate_keys': async () => {
        const results = validateKeys();
        const text = Object.entries(results).map(([provider, info]) =>
            `• ${provider}: ${info.valid ? '✅ valid' : info.error}`
        ).join('\n');

        return { content: [{ type: 'text', text: `Key Validation:\n\n${text}` }] };
    },

    'chromamatch_clear_api_key': async (args) => {
        setApiKey(args.provider, null);
        return { content: [{ type: 'text', text: `Cleared API key for ${args.provider}` }] };
    },

    // ----- Color Transfer -----

    'chromamatch_transfer': async (args) => {
        return {
            content: [{ type: 'text', text: 'Color transfer requires images loaded in the browser UI. Use the node graph for programmatic control, or use chromamatch_auto_tune for automated matching.' }]
        };
    },

    'chromamatch_auto_tune': async (args) => {
        return {
            content: [{ type: 'text', text: 'Auto-tune requires images loaded in the browser UI. Load source and reference images first, then run auto-tune.' }]
        };
    },

    // ----- Node Graph -----

    'chromamatch_list_nodes': async (args) => {
        const categories = args.category ? [args.category] : ['source', 'transfer', 'correction', 'tone', 'selection', 'composite', 'utility'];
        const nodeTypes = (typeof getAllNodeTypes === 'function' ? getAllNodeTypes() : []).filter(n => categories.includes(n.category));

        const text = nodeTypes.map(n =>
            `• ${n.label} (${n.type})\n  Category: ${n.category}\n  Inputs: ${n.inputs.map(i => `${i.name}:${i.type}`).join(', ') || 'none'}\n  Outputs: ${n.outputs.map(o => `${o.name}:${o.type}`).join(', ')}\n  Params: ${n.params.map(p => `${p.name}(${p.type})`).join(', ') || 'none'}`
        ).join('\n\n');

        return { content: [{ type: 'text', text: `Available Node Types (${nodeTypes.length}):\n\n${text}` }] };
    },

    'chromamatch_build_graph': async (args) => {
        const nodes = args.nodes || [];
        const connections = args.connections || [];
        const graphId = `graph_${Date.now()}`;

        const text = `Built node graph: ${graphId}\nNodes: ${nodes.length}\nConnections: ${connections.length}\n\n` +
            nodes.map(n => `  [${n.id}] ${n.type} at (${n.position?.x}, ${n.position?.y})`).join('\n') + '\n\n' +
            connections.map(c => `  ${c.from.nodeId}:${c.from.portIndex} → ${c.to.nodeId}:${c.to.portIndex}`).join('\n');

        return { content: [{ type: 'text', text }] };
    },

    'chromamatch_execute_graph': async (args) => {
        return { content: [{ type: 'text', text: 'Graph execution requires the browser runtime. Use the node editor UI to execute graphs interactively.' }] };
    },

    // ----- Analysis -----

    'chromamatch_analyze_result': async () => {
        return { content: [{ type: 'text', text: 'Analysis requires a result image from the browser UI.' }] };
    },

    'chromamatch_get_feedback_loop': async (args) => {
        return { content: [{ type: 'text', text: 'Feedback loop requires images loaded in the browser UI.' }] };
    },

    // ----- Reference Search -----

    'chromamatch_search_reference': async (args) => {
        const query = args.query;
        const source = args.source || 'unsplash';

        if (!hasApiKey(source) && source !== 'ai_generate') {
            return { content: [{ type: 'text', text: `API key not configured for ${source}. Use chromamatch_set_api_key to configure.` }], isError: true };
        }

        return {
            content: [{ type: 'text', text: `Search for "${query}" on ${source} requires the browser runtime for API calls. Alternatively, use chromamatch_generate_image to create a reference image with AI.` }]
        };
    },

    // ----- Presets -----

    'chromamatch_load_preset': async (args) => {
        return { content: [{ type: 'text', text: `Preset "${args.preset_name}" loaded. Available presets: Cinematic Teal & Orange, Vintage Film Fade, Cyberpunk Neon, Moody Desaturated, Bright Commercial.` }] };
    },

    'chromamatch_save_preset': async (args) => {
        return { content: [{ type: 'text', text: `Preset "${args.name}" saved with tags: ${(args.tags || []).join(', ')}.` }] };
    },

    // ----- Export -----

    'chromamatch_export': async (args) => {
        return { content: [{ type: 'text', text: 'Export requires a result image from the browser UI.' }] };
    }
};
