const UNIFIED_SESSION_VERSION = '2.0';

function trimTrailingSlash(value) {
    return (value || '').replace(/\/+$/, '');
}

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

function joinDefined(parts, separator = '\n') {
    return parts.filter(Boolean).join(separator).trim();
}

function parseOpenAIText(data) {
    if (typeof data?.output_text === 'string' && data.output_text) {
        return data.output_text;
    }

    const output = ensureArray(data?.output);
    const chunks = [];

    for (const item of output) {
        for (const content of ensureArray(item?.content)) {
            if (content?.type === 'output_text' && content.text) {
                chunks.push(content.text);
            }
        }
    }

    if (chunks.length) {
        return chunks.join('\n').trim();
    }

    return data?.choices?.[0]?.message?.content || '';
}

function parseGeminiText(data) {
    const parts = ensureArray(data?.candidates?.[0]?.content?.parts);
    return parts
        .map((part) => part?.text)
        .filter(Boolean)
        .join('\n')
        .trim();
}

function parseGeminiImage(data) {
    const parts = ensureArray(data?.candidates?.[0]?.content?.parts);
    const imagePart = parts.find((part) => part?.inlineData?.data || part?.inline_data?.data);
    const inlineData = imagePart?.inlineData || imagePart?.inline_data;

    if (!inlineData?.data) {
        return null;
    }

    return `data:${inlineData.mimeType || inlineData.mime_type || 'image/png'};base64,${inlineData.data}`;
}

const PROVIDER_CONFIGS = {
    openai: {
        id: 'openai',
        label: 'GPT',
        docsUrl: 'https://platform.openai.com/docs/models',
        setupBlurb: 'Best for reasoning, planning, coding, and structured help.',
        chatBaseUrl: 'https://api.openai.com/v1',
        chatEndpoint: 'chat/completions',
        imageBaseUrl: 'https://api.openai.com/v1',
        imageGenerateEndpoint: 'images/generations',
        imageEditEndpoint: 'images/edits',
        chatModels: [
            { value: 'gpt-5.5', label: 'GPT-5.5' },
            { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini' },
            { value: 'gpt-5.4-nano', label: 'GPT-5.4 Nano' },
            { value: 'gpt-4.1', label: 'GPT-4.1' }
        ],
        imgModels: [
            { value: 'gpt-image-2', label: 'GPT Image 2' },
            { value: 'gpt-image-1.5', label: 'GPT Image 1.5' },
            { value: 'gpt-image-1', label: 'GPT Image 1' },
            { value: 'gpt-image-1-mini', label: 'GPT Image 1 Mini' }
        ],
        authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
        parseChatReply: parseOpenAIText
    },
    gemini: {
        id: 'gemini',
        label: 'Gemini',
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models',
        setupBlurb: 'Best for multimodal generation, image tuning, and cinematic visual workflows.',
        chatBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        chatEndpoint: 'models/{model}:generateContent',
        imageBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        imageGenerateEndpoint: 'models/{model}:generateContent',
        imageEditEndpoint: 'models/{model}:generateContent',
        chatModels: [
            { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
            { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
            { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' }
        ],
        imgModels: [
            { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image Preview' },
            { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
            { value: 'gemini-2.0-flash-preview-image-generation', label: 'Gemini Image Preview' }
        ],
        parseChatReply: parseGeminiText
    },
    deerapi: {
        id: 'deerapi',
        label: 'DeerAPI',
        docsUrl: 'https://apidoc.deerapi.com/',
        setupBlurb: 'OpenAI-compatible gateway when you want one endpoint that can proxy multiple model families.',
        chatBaseUrl: 'https://api.deerapi.com/v1',
        chatEndpoint: 'chat/completions',
        imageBaseUrl: 'https://api.deerapi.com/v1',
        imageGenerateEndpoint: 'images/generations',
        imageEditEndpoint: 'images/edits',
        chatModels: [
            { value: 'gpt-5.5', label: 'GPT-5.5 via DeerAPI' },
            { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini via DeerAPI' },
            { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash via DeerAPI' },
            { value: 'claude-sonnet-4', label: 'Claude Sonnet 4 via DeerAPI' }
        ],
        imgModels: [
            { value: 'gpt-image-2', label: 'GPT Image 2 via DeerAPI' },
            { value: 'gpt-image-1.5', label: 'GPT Image 1.5 via DeerAPI' },
            { value: 'gpt-image-1', label: 'GPT Image 1 via DeerAPI' }
        ],
        authHeaders: (apiKey) => ({ Authorization: `Bearer ${apiKey}` }),
        parseChatReply: parseOpenAIText
    },
    custom: {
        id: 'custom',
        label: 'Custom',
        docsUrl: '',
        setupBlurb: 'For any OpenAI-compatible endpoint with your own base URL and model IDs.',
        chatBaseUrl: '',
        chatEndpoint: 'chat/completions',
        imageBaseUrl: '',
        imageGenerateEndpoint: 'images/generations',
        imageEditEndpoint: 'images/edits',
        chatModels: [
            { value: 'custom-chat-model', label: 'Custom Chat Model' }
        ],
        imgModels: [
            { value: 'custom-image-model', label: 'Custom Image Model' }
        ],
        authHeaders: (apiKey) => apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        parseChatReply: parseOpenAIText
    }
};

class UnifiedSession {
    constructor() {
        this.version = UNIFIED_SESSION_VERSION;
        this.messages = [];
        this.generatedImages = [];
        this.summaries = [];
        this.styleState = null;
        this.characterState = null;
        this.activeProvider = null;
        this.load();
    }

    save() {
        const data = {
            version: this.version,
            messages: this.messages.slice(-40),
            generatedImages: this.generatedImages.slice(-20),
            summaries: this.summaries.slice(-6),
            styleState: this.styleState,
            characterState: this.characterState,
            activeProvider: this.activeProvider
        };

        try {
            localStorage.setItem('cm_unified_session', JSON.stringify(data));
        } catch {}
    }

    load() {
        try {
            const raw = localStorage.getItem('cm_unified_session');
            if (!raw) return;

            const data = JSON.parse(raw);
            this.messages = ensureArray(data.messages);
            this.generatedImages = ensureArray(data.generatedImages);
            this.summaries = ensureArray(data.summaries);
            this.styleState = data.styleState || null;
            this.characterState = data.characterState || null;
            this.activeProvider = data.activeProvider || null;
        } catch {}
    }

    clear() {
        this.messages = [];
        this.generatedImages = [];
        this.summaries = [];
        this.styleState = null;
        this.characterState = null;
        this.activeProvider = null;
        this.save();
    }

    addMessage(role, text = '', images = [], metadata = {}) {
        const message = {
            role,
            text,
            images: ensureArray(images),
            metadata
        };

        if (metadata.provider) {
            message.provider = metadata.provider;
        }

        this.messages.push(message);
        this.maybeCompress();
        this.save();
        return message;
    }

    maybeCompress() {
        if (this.messages.length <= 32) return;

        const oldMessages = this.messages.slice(0, this.messages.length - 18);
        const summary = this.summarizeMessages(oldMessages);
        if (summary) {
            this.summaries.push(summary);
        }
        this.messages = this.messages.slice(-18);
    }

    summarizeMessages(messages) {
        const transcript = messages
            .map((message) => `${message.role}: ${(message.text || '').trim()}`)
            .filter((line) => line !== 'assistant:' && line !== 'user:' && line !== 'system:')
            .join(' | ');

        return transcript.slice(0, 900);
    }

    getRelevantContext() {
        const context = [];

        if (this.summaries.length > 0) {
            context.push({
                role: 'system',
                text: `Session summary: ${this.summaries.slice(-3).join(' || ')}`
            });
        }

        if (this.styleState) {
            context.push({
                role: 'system',
                text: `Style state: ${JSON.stringify(this.styleState)}`
            });
        }

        if (this.characterState) {
            context.push({
                role: 'system',
                text: `Character state: ${JSON.stringify(this.characterState)}`
            });
        }

        context.push(...this.messages.slice(-12));
        return context;
    }

    setStyleState(nextState) {
        this.styleState = { ...(this.styleState || {}), ...nextState };
        this.save();
    }

    setCharacterState(nextState) {
        this.characterState = { ...(this.characterState || {}), ...nextState };
        this.save();
    }

    addGeneratedImage(url) {
        if (!url) return;
        this.generatedImages.push(url);
        this.generatedImages = this.generatedImages.slice(-20);
        this.save();
    }

    routeTask(task, userMessage = '') {
        const lower = `${task || ''} ${userMessage || ''}`.toLowerCase();

        if (/\b(edit|tune|refine|variant|upscale|retouch|photoreal|cinematic)\b/.test(lower)) {
            return 'gemini';
        }

        if (/\b(code|reason|plan|analy[sz]e|table|json|structure|compare)\b/.test(lower)) {
            return 'openai';
        }

        if (/\b(generate|render|draw|illustrate|image)\b/.test(lower)) {
            return /\b(ui|overlay|type|typography|diagram)\b/.test(lower) ? 'openai' : 'gemini';
        }

        return this.activeProvider || 'openai';
    }

    toOpenAIFormat(contextMessages, systemPrompt) {
        const messages = [];
        const systemLines = [];

        if (systemPrompt) {
            systemLines.push(systemPrompt);
        }

        for (const message of contextMessages) {
            if (message.role === 'system') {
                if (message.text) {
                    systemLines.push(message.text);
                }
                continue;
            }

            const content = [];
            if (message.text) {
                content.push({ type: 'text', text: message.text });
            }

            for (const image of ensureArray(message.images)) {
                content.push({
                    type: 'image_url',
                    image_url: { url: image }
                });
            }

            if (content.length === 0) {
                content.push({ type: 'text', text: '' });
            }

            messages.push({
                role: message.role === 'assistant' ? 'assistant' : 'user',
                content
            });
        }

        if (systemLines.length) {
            messages.unshift({
                role: 'system',
                content: systemLines.join('\n')
            });
        }

        return messages.map((message) => {
            if (typeof message.content === 'string') {
                return message;
            }

            if (message.content.length === 1 && message.content[0].type === 'text') {
                return { role: message.role, content: message.content[0].text };
            }

            return message;
        });
    }

    toGeminiFormat(contextMessages, systemPrompt) {
        const contents = [];
        const systemInstructionParts = [];

        if (systemPrompt) {
            systemInstructionParts.push({ text: systemPrompt });
        }

        for (const message of contextMessages) {
            if (message.role === 'system') {
                if (message.text) {
                    systemInstructionParts.push({ text: message.text });
                }
                continue;
            }

            const parts = [];
            if (message.text) {
                parts.push({ text: message.text });
            }

            for (const image of ensureArray(message.images)) {
                const imagePart = this.toGeminiImagePart(image);
                if (imagePart) {
                    parts.push(imagePart);
                }
            }

            if (parts.length) {
                contents.push({
                    role: message.role === 'assistant' ? 'model' : 'user',
                    parts
                });
            }
        }

        const body = { contents };
        if (systemInstructionParts.length) {
            body.system_instruction = { parts: systemInstructionParts };
        }
        return body;
    }

    toGeminiImagePart(imageUrl) {
        if (!imageUrl || !imageUrl.startsWith('data:')) {
            return null;
        }

        const match = imageUrl.match(/^data:(image\/[\w.+-]+);base64,(.+)$/);
        if (!match) {
            return null;
        }

        return {
            inline_data: {
                mime_type: match[1],
                data: match[2]
            }
        };
    }

    resolveProviderConfig(provider) {
        const config = PROVIDER_CONFIGS[provider];
        if (!config) {
            throw new Error(`Unknown provider: ${provider}`);
        }
        return config;
    }

    buildChatRequest(provider, config, contextMessages, systemPrompt) {
        const cfg = this.resolveProviderConfig(provider);
        const baseUrl = trimTrailingSlash(config.baseUrl || cfg.chatBaseUrl);

        if (!baseUrl) {
            throw new Error(`Missing base URL for ${cfg.label}`);
        }

        if (provider === 'gemini') {
            return {
                url: `${baseUrl}/${cfg.chatEndpoint.replace('{model}', config.chatModel)}?key=${encodeURIComponent(config.apiKey)}`,
                headers: { 'Content-Type': 'application/json' },
                body: this.toGeminiFormat(contextMessages, systemPrompt)
            };
        }

        return {
            url: `${baseUrl}/${cfg.chatEndpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...(cfg.authHeaders ? cfg.authHeaders(config.apiKey) : {})
            },
            body: {
                model: config.chatModel,
                messages: this.toOpenAIFormat(contextMessages, systemPrompt)
            }
        };
    }

    async chat(userText, userImages = [], config) {
        const provider = config.provider;
        const cfg = this.resolveProviderConfig(provider);

        this.addMessage('user', userText, userImages, {
            ...(config.metadata || {}),
            provider
        });
        this.activeProvider = provider;

        const contextMessages = this.getRelevantContext();
        const request = this.buildChatRequest(provider, config, contextMessages, config.systemPrompt);

        const response = await fetch(request.url, {
            method: 'POST',
            headers: request.headers,
            body: JSON.stringify(request.body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData?.error?.message ||
                errorData?.error?.code ||
                errorData?.message ||
                `${response.status}`
            );
        }

        const data = await response.json();
        const reply = cfg.parseChatReply(data) || '';

        this.addMessage('assistant', reply, [], { provider });

        const nextStyleState = this.extractStyleState(reply, userText);
        if (nextStyleState) {
            this.styleState = nextStyleState;
        }
        this.save();

        return reply;
    }

    extractStyleState(assistantReply, userQuery) {
        const combined = `${assistantReply || ''} ${userQuery || ''}`.toLowerCase();
        const style = {};
        const styleHints = [
            ['visualStyle', /(?:visual style|look|style)[:\s-]+([^.\n]+)/i],
            ['lighting', /lighting[:\s-]+([^.\n]+)/i],
            ['camera', /camera[:\s-]+([^.\n]+)/i],
            ['colorPalette', /(?:palette|color palette|colors)[:\s-]+([^.\n]+)/i]
        ];

        for (const [key, regex] of styleHints) {
            const match = combined.match(regex);
            if (match?.[1]) {
                style[key] = match[1].trim();
            }
        }

        return Object.keys(style).length ? { ...(this.styleState || {}), ...style } : this.styleState;
    }

    async generateImage(prompt, config) {
        const provider = config.provider;
        const cfg = this.resolveProviderConfig(provider);
        const baseUrl = trimTrailingSlash(config.baseUrl || cfg.imageBaseUrl || cfg.chatBaseUrl);
        const referenceImages = ensureArray(config.referenceImages);
        const hasReferenceImage = referenceImages.length > 0;

        if (!baseUrl) {
            throw new Error(`Missing base URL for ${cfg.label}`);
        }

        let request;

        if (provider === 'gemini') {
            request = this.buildGeminiImageRequest(baseUrl, config.imgModel, config.apiKey, prompt, referenceImages);
        } else {
            request = this.buildOpenAIImageRequest(baseUrl, cfg, config.imgModel, config.apiKey, prompt, referenceImages);
        }

        const response = await fetch(request.url, {
            method: 'POST',
            headers: request.headers,
            body: JSON.stringify(request.body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData?.error?.message ||
                errorData?.error?.code ||
                errorData?.message ||
                `${response.status}`
            );
        }

        const data = await response.json();
        const imageUrl = provider === 'gemini' ? parseGeminiImage(data) : this.parseOpenAIImageReply(data);

        if (imageUrl) {
            this.addGeneratedImage(imageUrl);
            this.addMessage(
                'assistant',
                hasReferenceImage ? `[Edited image with ${cfg.label}]` : `[Generated image with ${cfg.label}]`,
                [imageUrl],
                { provider, type: hasReferenceImage ? 'edited_image' : 'generated_image' }
            );
        }

        return imageUrl;
    }

    buildOpenAIImageRequest(baseUrl, cfg, model, apiKey, prompt, referenceImages) {
        const headers = {
            'Content-Type': 'application/json',
            ...(cfg.authHeaders ? cfg.authHeaders(apiKey) : {})
        };

        if (referenceImages.length > 0) {
            return {
                url: `${baseUrl}/${cfg.imageEditEndpoint}`,
                headers,
                body: {
                    model,
                    prompt,
                    size: '1024x1024',
                    images: referenceImages.map((imageUrl) => ({ image_url: imageUrl }))
                }
            };
        }

        return {
            url: `${baseUrl}/${cfg.imageGenerateEndpoint}`,
            headers,
            body: {
                model,
                prompt,
                size: '1024x1024'
            }
        };
    }

    buildGeminiImageRequest(baseUrl, model, apiKey, prompt, referenceImages) {
        const parts = [{ text: prompt }];
        for (const imageUrl of referenceImages) {
            const imagePart = this.toGeminiImagePart(imageUrl);
            if (imagePart) {
                parts.push(imagePart);
            }
        }

        return {
            url: `${baseUrl}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
            headers: { 'Content-Type': 'application/json' },
            body: {
                contents: [{ role: 'user', parts }],
                generationConfig: {
                    responseModalities: ['TEXT', 'IMAGE']
                }
            }
        };
    }

    parseOpenAIImageReply(data) {
        const item = ensureArray(data?.data)[0];
        if (!item) {
            return null;
        }

        if (item.url) {
            return item.url;
        }

        if (item.b64_json) {
            return `data:image/png;base64,${item.b64_json}`;
        }

        return null;
    }
}

window.UnifiedSession = UnifiedSession;
window.PROVIDER_CONFIGS = PROVIDER_CONFIGS;
