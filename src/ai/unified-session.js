const UNIFIED_SESSION_VERSION = '1.0';

const PROVIDER_CONFIGS = {
    openai: {
        label: 'OpenAI',
        chatBaseUrl: 'https://api.openai.com/v1',
        chatEndpoint: 'chat/completions',
        imgEndpoint: 'images/generations',
        chatModels: [
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (faster)' }
        ],
        imgModels: [
            { value: 'dall-e-3', label: 'DALL-E 3 (best quality)' },
            { value: 'dall-e-2', label: 'DALL-E 2 (faster)' }
        ],
        authHeader: (key) => ({ 'Authorization': `Bearer ${key}` }),
        parseChatReply: (data) => data.choices?.[0]?.message?.content,
        parseImageReply: (data) => data.data?.[0]?.url
    },
    gemini: {
        label: 'Google Gemini',
        chatBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        chatEndpoint: 'models/{model}:generateContent',
        imgEndpoint: 'models/imagen-3.0-generate-001:predict',
        chatModels: [
            { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
            { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
            { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
        ],
        imgModels: [
            { value: 'imagen-3.0-generate-001', label: 'Imagen 3 (nanabanana)' }
        ],
        authHeader: (key) => ({ 'x-goog-api-key': key }),
        parseChatReply: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text,
        parseImageReply: (data) => {
            const b64 = data.predictions?.[0]?.bytesBase64Encoded;
            return b64 ? `data:image/png;base64,${b64}` : null;
        }
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

    /* ─── Persistence ─────────────────────────────────────── */
    save() {
        const data = {
            version: this.version,
            messages: this.messages,
            generatedImages: this.generatedImages.slice(-20),
            summaries: this.summaries.slice(-5),
            styleState: this.styleState,
            characterState: this.characterState,
            activeProvider: this.activeProvider
        };
        try { localStorage.setItem('cm_unified_session', JSON.stringify(data)); } catch {}
    }

    load() {
        try {
            const raw = localStorage.getItem('cm_unified_session');
            if (!raw) return;
            const data = JSON.parse(raw);
            this.messages = data.messages || [];
            this.generatedImages = data.generatedImages || [];
            this.summaries = data.summaries || [];
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

    /* ─── Message Management ──────────────────────────────── */
    addMessage(role, text, images, metadata) {
        const msg = { role, text: text || '', images: images || [], metadata: metadata || {} };
        if (metadata?.provider) msg.provider = metadata.provider;
        this.messages.push(msg);
        this.maybeCompress();
        this.save();
        return msg;
    }

    maybeCompress() {
        if (this.messages.length <= 30) return;
        const old = this.messages.slice(0, this.messages.length - 20);
        const summary = this.summarizeMessages(old);
        this.summaries.push(summary);
        this.messages = this.messages.slice(-20);
    }

    summarizeMessages(msgs) {
        const userTexts = msgs
            .filter(m => m.role === 'user')
            .map(m => m.text)
            .join(' | ');
        return userTexts.substring(0, 500);
    }

    /* ─── Context Assembly ────────────────────────────────── */
    getRelevantContext() {
        const ctx = [];

        if (this.summaries.length > 0) {
            ctx.push({
                role: 'system',
                text: `[Session history summary]: ${this.summaries.slice(-3).join('; ')}`
            });
        }

        if (this.styleState) {
            ctx.push({
                role: 'system',
                text: `[Current visual style]: ${JSON.stringify(this.styleState)}`
            });
        }

        if (this.characterState) {
            ctx.push({
                role: 'system',
                text: `[Current character]: ${JSON.stringify(this.characterState)}`
            });
        }

        const recent = this.messages.slice(-15);
        ctx.push(...recent);

        return ctx;
    }

    /* ─── Style / Character State ─────────────────────────── */
    setStyleState(state) {
        this.styleState = { ...this.styleState, ...state };
        this.save();
    }

    setCharacterState(state) {
        this.characterState = { ...this.characterState, ...state };
        this.save();
    }

    addGeneratedImage(url) {
        this.generatedImages.push(url);
        if (this.generatedImages.length > 20) {
            this.generatedImages = this.generatedImages.slice(-20);
        }
        this.save();
    }

    /* ─── Task Router ──────────────────────────────────────── */
    routeTask(task, userMsg) {
        const lower = (userMsg || task).toLowerCase();

        if (/\b(image.?edit|retouch|enhance|modify|refine|cinematic|photo.?real|nano.?banana)\b/i.test(lower)) {
            return 'gemini';
        }
        if (/\b(code|debug|explain|reason|analyze|plan|structured|json|data|table|logic)\b/i.test(lower)) {
            return 'openai';
        }
        if (/\b(diagram|typography|ui|layout|design|font|graphic|overlay)\b/i.test(lower)) {
            return 'openai';
        }
        if (/\b(fast|quick|rapid|iterate)\b.*\b(image|visual|render)\b/i.test(lower)) {
            return 'gemini';
        }
        if (/\b(generate|create|make|draw|render)\b.*\b(image|picture|scene|visual)\b/i.test(lower)) {
            const style = this.styleState?.visualStyle || '';
            if (/cinematic|film|photorealism|photo|realistic/i.test(style + ' ' + lower)) {
                return 'gemini';
            }
            return 'openai';
        }

        return this.activeProvider || 'openai';
    }

    /* ─── Provider Adapters ───────────────────────────────── */
    toOpenAIFormat(contextMessages, systemPrompt) {
        const messages = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        for (const m of contextMessages) {
            if (m.role === 'system') {
                const existing = messages.find(x => x.role === 'system');
                if (existing) {
                    existing.content += '\n' + m.text;
                } else {
                    messages.push({ role: 'system', content: m.text });
                }
                continue;
            }

            const content = [];
            if (m.text) {
                content.push({ type: 'text', text: m.text });
            }
            if (m.images && m.images.length > 0) {
                for (const img of m.images) {
                    content.push({
                        type: 'image_url',
                        image_url: { url: img }
                    });
                }
            }

            if (content.length === 0 && m.text) {
                content.push({ type: 'text', text: '' });
            }

            messages.push({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: content.length === 1 && content[0].type === 'text' ? content[0].text : content
            });
        }

        return messages;
    }

    toGeminiFormat(contextMessages, systemPrompt) {
        const contents = [];
        let systemParts = [];

        if (systemPrompt) {
            systemParts.push({ text: systemPrompt });
        }

        for (const m of contextMessages) {
            if (m.role === 'system') {
                systemParts.push({ text: m.text });
                continue;
            }

            const parts = [];

            if (m.role === 'user' && systemParts.length > 0) {
                parts.push(...systemParts);
                systemParts = [];
            }

            if (m.text) {
                parts.push({ text: m.text });
            }

            if (m.images && m.images.length > 0) {
                for (const img of m.images) {
                    const b64 = this.extractBase64(img);
                    if (b64) {
                        parts.push({
                            inline_data: {
                                mime_type: 'image/png',
                                data: b64
                            }
                        });
                    }
                }
            }

            if (parts.length > 0) {
                contents.push({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts
                });
            }
        }

        return { contents };
    }

    extractBase64(url) {
        if (!url) return null;
        if (url.startsWith('data:')) {
            const match = url.match(/^data:image\/\w+;base64,(.+)$/);
            return match ? match[1] : null;
        }
        return null;
    }

    /* ─── Chat Execution ──────────────────────────────────── */
    async chat(userText, userImages, config) {
        const {
            provider,
            chatModel,
            baseUrl,
            apiKey,
            systemPrompt,
            metadata
        } = config;

        const cfg = PROVIDER_CONFIGS[provider];
        if (!cfg) throw new Error(`Unknown provider: ${provider}`);

        this.addMessage('user', userText, userImages, { provider, ...metadata });
        if (provider && !this.activeProvider) this.activeProvider = provider;

        const contextMessages = this.getRelevantContext();
        let url, headers, body;

        if (provider === 'gemini') {
            const geminiBody = this.toGeminiFormat(contextMessages, systemPrompt);
            url = `${baseUrl || cfg.chatBaseUrl}/${cfg.chatEndpoint.replace('{model}', chatModel)}?key=${apiKey}`;
            headers = { 'Content-Type': 'application/json' };
            body = geminiBody;
        } else {
            const openaiMessages = this.toOpenAIFormat(contextMessages, systemPrompt);
            url = `${baseUrl || cfg.chatBaseUrl}/${cfg.chatEndpoint}`;
            headers = { 'Content-Type': 'application/json', ...cfg.authHeader(apiKey) };
            body = { model: chatModel, messages: openaiMessages };
        }

        const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData.error?.message || errData.error?.code || `${resp.status}`);
        }

        const data = await resp.json();
        const reply = cfg.parseChatReply(data) || '';

        this.addMessage('assistant', reply, [], { provider });
        this.styleState = this.extractStyleState(reply, userText);
        this.save();

        return reply;
    }

    extractStyleState(assistantReply, userQuery) {
        const combined = (assistantReply + ' ' + userQuery).toLowerCase();
        const style = {};

        const visualRe = /visual\s*style[:\s]*["']?([^"'.]+)/i;
        const lightRe = /lighting[:\s]*["']?([^"'.]+)/i;
        const cameraRe = /camera[:\s]*["']?([^"'.]+)/i;
        const colorRe = /color\s*palette[:\s]*["']?([^"'.]+)/i;

        const vm = combined.match(visualRe);
        const lm = combined.match(lightRe);
        const cm = combined.match(cameraRe);
        const pm = combined.match(colorRe);

        if (vm) style.visualStyle = vm[1].trim();
        if (lm) style.lighting = lm[1].trim();
        if (cm) style.camera = cm[1].trim();
        if (pm) style.colorPalette = pm[1].trim();

        return Object.keys(style).length > 0 ? style : this.styleState;
    }

    /* ─── Image Generation ────────────────────────────────── */
    async generateImage(prompt, config) {
        const {
            provider,
            imgModel,
            baseUrl,
            apiKey
        } = config;

        const cfg = PROVIDER_CONFIGS[provider];
        if (!cfg) throw new Error(`Unknown provider: ${provider}`);

        let url, headers, body;

        if (provider === 'gemini') {
            url = `${baseUrl || cfg.chatBaseUrl}/${cfg.imgEndpoint}?key=${apiKey}`;
            headers = { 'Content-Type': 'application/json' };
            body = { instances: [{ prompt }], parameters: { sampleCount: 1 } };
        } else {
            url = `${baseUrl || cfg.chatBaseUrl}/${cfg.imgEndpoint}`;
            headers = { 'Content-Type': 'application/json', ...cfg.authHeader(apiKey) };
            body = { model: imgModel, prompt, n: 1, size: '1024x1024', quality: 'standard' };
        }

        const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            throw new Error(errData.error?.message || errData.error?.code || `${resp.status}`);
        }

        const data = await resp.json();
        const imageUrl = cfg.parseImageReply(data);
        if (imageUrl) {
            this.addGeneratedImage(imageUrl);
            this.addMessage('assistant', `[Generated image with ${cfg.label}]`, [imageUrl], { provider, type: 'generated_image' });
        }

        return imageUrl;
    }
}

window.UnifiedSession = UnifiedSession;
window.PROVIDER_CONFIGS = PROVIDER_CONFIGS;
