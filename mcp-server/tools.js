/**
 * MCP Tool Definitions for ChromaMatch
 * 
 * Each tool definition follows the MCP schema format.
 */

const TOOLS = [

    // ============================================================
    // Image Generation
    // ============================================================

    {
        name: 'chromamatch_generate_image',
        description: 'Generate a reference image using AI. Supports OpenAI DALL-E, GPT-Image, Google Imagen, Stability AI, Replicate, or any custom provider with a compatible API. Use this to create reference images for color matching.',
        inputSchema: {
            type: 'object',
            properties: {
                provider: {
                    type: 'string',
                    description: 'Image generation provider ID. Built-in: openai, openai-gpt-image, openai-gpt-image-2, nanobanana, nanobanana-pro2, google, stability, replicate. Or use any custom registered provider ID.',
                    default: 'openai'
                },
                prompt: {
                    type: 'string',
                    description: 'Detailed text prompt describing the desired image. Be specific about colors, mood, lighting, and style for best color matching results.'
                },
                model: {
                    type: 'string',
                    description: 'Override the default model for this provider (e.g., "dall-e-3", "gpt-image-1", "flux-schnell")'
                },
                size: {
                    type: 'string',
                    description: 'Image size in WIDTHxHEIGHT format (e.g., "1024x1024", "1792x1024")',
                    default: '1024x1024'
                },
                quality: {
                    type: 'string',
                    enum: ['standard', 'hd', 'medium', 'high'],
                    description: 'Image quality setting (provider-dependent)'
                },
                base_url: {
                    type: 'string',
                    description: 'Override the API base URL for this provider. Use this to point to a custom endpoint, proxy, or self-hosted model.'
                },
                api_key: {
                    type: 'string',
                    description: 'Override the API key for this request (runtime injection, not persisted)'
                },
                extra_params: {
                    type: 'object',
                    description: 'Additional parameters to merge into the API request body. Provider-specific options can be passed here.'
                }
            },
            required: ['prompt']
        }
    },

    {
        name: 'chromamatch_list_providers',
        description: 'List all available image generation providers (built-in and custom registered), their models, and whether API keys are configured.',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },

    {
        name: 'chromamatch_register_provider',
        description: 'Register a custom image generation provider with a custom API endpoint. Supports any OpenAI-compatible API, or fully custom request/response formats. Use this to add self-hosted models, alternative APIs, or enterprise endpoints.',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    description: 'Unique provider ID (e.g., "my-custom-model")'
                },
                name: {
                    type: 'string',
                    description: 'Human-readable provider name'
                },
                type: {
                    type: 'string',
                    enum: ['openai', 'google', 'stability', 'custom'],
                    description: 'API protocol type. "openai" for OpenAI-compatible endpoints (most common).',
                    default: 'openai'
                },
                base_url: {
                    type: 'string',
                    description: 'API base URL (e.g., "https://my-server.com/v1" or "http://localhost:8080/api")'
                },
                api_key: {
                    type: 'string',
                    description: 'API key for this provider'
                },
                api_key_env_var: {
                    type: 'string',
                    description: 'Environment variable name for the API key (e.g., "MY_MODEL_API_KEY")'
                },
                endpoint: {
                    type: 'string',
                    description: 'API endpoint path (e.g., "/images/generations")'
                },
                model: {
                    type: 'string',
                    description: 'Default model name'
                },
                default_size: {
                    type: 'string',
                    description: 'Default image size',
                    default: '1024x1024'
                },
                supported_sizes: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of supported sizes'
                },
                request_body_template: {
                    type: 'object',
                    description: 'Custom request body template. Use {prompt}, {model}, {size}, {width}, {height}, {quality} as placeholders.'
                },
                response_extractor: {
                    type: 'string',
                    description: 'Path to extract image data from response. Examples: "data[0].b64_json", "data[0].url", "output[0]", "_raw_binary"'
                }
            },
            required: ['id', 'base_url', 'endpoint']
        }
    },

    {
        name: 'chromamatch_unregister_provider',
        description: 'Remove a previously registered custom provider',
        inputSchema: {
            type: 'object',
            properties: {
                provider_id: {
                    type: 'string',
                    description: 'ID of the custom provider to remove'
                }
            },
            required: ['provider_id']
        }
    },

    // ============================================================
    // API Key Management
    // ============================================================

    {
        name: 'chromamatch_set_api_key',
        description: 'Set an API key for a provider at runtime. Keys are stored in memory only (not persisted to disk).',
        inputSchema: {
            type: 'object',
            properties: {
                provider: {
                    type: 'string',
                    description: 'Provider ID (unsplash, pexels, openai, openai-gpt-image, openai-gpt-image-2, nanobanana, nanobanana-pro2, google, stability, replicate, or any custom provider ID)'
                },
                key: {
                    type: 'string',
                    description: 'The API key value'
                }
            },
            required: ['provider', 'key']
        }
    },

    {
        name: 'chromamatch_get_key_status',
        description: 'Get configuration status of all API keys without revealing key values',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },

    {
        name: 'chromamatch_validate_keys',
        description: 'Validate format of all configured API keys',
        inputSchema: {
            type: 'object',
            properties: {}
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
                    description: 'Provider ID'
                }
            },
            required: ['provider']
        }
    },

    // ============================================================
    // Color Transfer & Analysis
    // ============================================================

    {
        name: 'chromamatch_transfer',
        description: 'Transfer colors from a reference image to a source image. Requires images loaded in the browser UI.',
        inputSchema: {
            type: 'object',
            properties: {
                method: {
                    type: 'string',
                    enum: ['reinhard-lab', 'lab-histogram', 'rgb-mean-std', 'auto'],
                    default: 'reinhard-lab',
                    description: 'Transfer algorithm method'
                },
                strength: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    default: 1.0,
                    description: 'Transfer strength (0-1)'
                },
                performance_mode: {
                    type: 'string',
                    enum: ['fast', 'balanced', 'quality'],
                    default: 'balanced',
                    description: 'Performance mode'
                }
            }
        }
    },

    {
        name: 'chromamatch_auto_tune',
        description: 'Automatically tune color transfer parameters for optimal match. Requires images loaded in the browser UI.',
        inputSchema: {
            type: 'object',
            properties: {
                max_iterations: {
                    type: 'number',
                    minimum: 1,
                    maximum: 10,
                    default: 5,
                    description: 'Maximum tuning iterations'
                },
                strategy: {
                    type: 'string',
                    enum: ['auto', 'balanced', 'aggressive', 'perceptual'],
                    default: 'balanced',
                    description: 'Tuning strategy'
                }
            }
        }
    },

    {
        name: 'chromamatch_analyze_result',
        description: 'Analyze the color transfer result and provide match score and improvement suggestions',
        inputSchema: {
            type: 'object',
            properties: {}
        }
    },

    {
        name: 'chromamatch_get_feedback_loop',
        description: 'Run the feedback loop to iteratively auto-adjust color grading',
        inputSchema: {
            type: 'object',
            properties: {
                strategy: {
                    type: 'string',
                    enum: ['auto', 'balanced', 'aggressive', 'perceptual'],
                    default: 'balanced',
                    description: 'Feedback strategy'
                }
            }
        }
    },

    // ============================================================
    // Node Graph
    // ============================================================

    {
        name: 'chromamatch_list_nodes',
        description: 'List all available node types for building color grading graphs',
        inputSchema: {
            type: 'object',
            properties: {
                category: {
                    type: 'string',
                    enum: ['source', 'transfer', 'correction', 'tone', 'selection', 'composite', 'utility'],
                    description: 'Filter by node category'
                }
            }
        }
    },

    {
        name: 'chromamatch_build_graph',
        description: 'Build a node graph for color grading pipeline',
        inputSchema: {
            type: 'object',
            properties: {
                nodes: {
                    type: 'array',
                    description: 'Array of node definitions with id, type, position, params'
                },
                connections: {
                    type: 'array',
                    description: 'Array of connections between nodes'
                }
            },
            required: ['nodes']
        }
    },

    {
        name: 'chromamatch_execute_graph',
        description: 'Execute the node graph and return the result',
        inputSchema: {
            type: 'object',
            properties: {
                graph_id: {
                    type: 'string',
                    description: 'ID of the graph to execute'
                }
            },
            required: ['graph_id']
        }
    },

    // ============================================================
    // Reference & Presets
    // ============================================================

    {
        name: 'chromamatch_search_reference',
        description: 'Search for reference images on Unsplash or Pexels',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Search query'
                },
                source: {
                    type: 'string',
                    enum: ['unsplash', 'pexels', 'ai_generate'],
                    default: 'unsplash',
                    description: 'Image source'
                }
            },
            required: ['query']
        }
    },

    {
        name: 'chromamatch_load_preset',
        description: 'Load a color grading preset',
        inputSchema: {
            type: 'object',
            properties: {
                preset_name: {
                    type: 'string',
                    description: 'Name of the preset (e.g., "Cinematic Teal & Orange", "Vintage Film Fade")'
                }
            },
            required: ['preset_name']
        }
    },

    {
        name: 'chromamatch_save_preset',
        description: 'Save the current graph as a preset',
        inputSchema: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                    description: 'Name for the preset'
                },
                tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tags for the preset'
                }
            },
            required: ['name']
        }
    },

    // ============================================================
    // Export
    // ============================================================

    {
        name: 'chromamatch_export',
        description: 'Export the result image or LUT file',
        inputSchema: {
            type: 'object',
            properties: {
                format: {
                    type: 'string',
                    enum: ['png', 'jpeg', 'webp', 'lut-cube', 'lut-3dl'],
                    default: 'png',
                    description: 'Export format'
                },
                quality: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    default: 0.95,
                    description: 'Quality for lossy formats'
                }
            }
        }
    }
];

function getToolDefinitions() {
    return TOOLS;
}

function getToolByName(name) {
    return TOOLS.find(t => t.name === name) || null;
}

export { TOOLS, getToolDefinitions, getToolByName };
