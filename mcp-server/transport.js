/**
 * MCP Transport Layer
 * 
 * Handles both stdio (JSON-RPC 2.0) and HTTP transports.
 * Routes all MCP protocol messages to the tool handler.
 */

import { handleToolCall, handleInitialize, handleListTools, handleListResources } from './handler.js';

// Parse CLI args
function parseArgs() {
    const args = process.argv.slice(2);
    const config = { transport: 'stdio', port: 3456 };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--transport' && args[i + 1]) config.transport = args[++i];
        if (args[i] === '--port' && args[i + 1]) config.port = parseInt(args[++i], 10);
    }
    return config;
}

export function createServer() {
    const config = parseArgs();

    return {
        config,
        start() {
            if (config.transport === 'stdio') {
                startStdio();
            } else if (config.transport === 'http') {
                startHttp(config.port);
            } else {
                console.error(`Unknown transport: ${config.transport}. Use 'stdio' or 'http'.`);
                process.exit(1);
            }
        }
    };
}

// ============================================================
// Stdio Transport (JSON-RPC 2.0 over stdin/stdout)
// ============================================================

function startStdio() {
    let buffer = '';

    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
        buffer += chunk;
        processBuffer();
    });

    process.stdin.on('end', () => {
        process.exit(0);
    });

    function processBuffer() {
        // JSON-RPC messages are separated by newlines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
                const message = JSON.parse(trimmed);
                handleStdioMessage(message).catch(err => {
                    sendStdioError(message.id, -32603, err.message);
                });
            } catch (parseErr) {
                // Not valid JSON, skip
            }
        }
    }

    async function handleStdioMessage(message) {
        const { id, method, params } = message;

        if (method === 'initialize') {
            const result = handleInitialize(params);
            sendStdioResponse(id, result);
            return;
        }

        if (method === 'notifications/initialized') {
            // Client acknowledged initialization, no response needed
            return;
        }

        if (method === 'tools/list') {
            const result = handleListTools(params);
            sendStdioResponse(id, result);
            return;
        }

        if (method === 'tools/call') {
            const result = await handleToolCall(params.name, params.arguments || {});
            sendStdioResponse(id, result);
            return;
        }

        if (method === 'resources/list') {
            const result = handleListResources(params);
            sendStdioResponse(id, result);
            return;
        }

        if (method === 'ping') {
            sendStdioResponse(id, {});
            return;
        }

        sendStdioError(id, -32601, `Method not found: ${method}`);
    }

    function sendStdioResponse(id, result) {
        const response = {
            jsonrpc: '2.0',
            id,
            result
        };
        process.stdout.write(JSON.stringify(response) + '\n');
    }

    function sendStdioError(id, code, message) {
        const response = {
            jsonrpc: '2.0',
            id,
            error: { code, message }
        };
        process.stderr.write(`[MCP Error] ${code}: ${message}\n`);
        process.stdout.write(JSON.stringify(response) + '\n');
    }
}

// ============================================================
// HTTP Transport (for non-stdio clients like browser, Trae HTTP mode)
// ============================================================

function startHttp(port) {
    // Dynamic import to avoid requiring express when using stdio
    import('express').then(({ default: express }) => {
        import('cors').then(({ default: cors }) => {
            const app = express();
            app.use(cors());
            app.use(express.json({ limit: '50mb' }));

            // MCP-style endpoint
            app.post('/mcp', async (req, res) => {
                const { id, method, params } = req.body;
                try {
                    let result;
                    if (method === 'initialize') {
                        result = handleInitialize(params);
                    } else if (method === 'tools/list') {
                        result = handleListTools(params);
                    } else if (method === 'tools/call') {
                        result = await handleToolCall(params.name, params.arguments || {});
                    } else if (method === 'resources/list') {
                        result = handleListResources(params);
                    } else {
                        res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
                        return;
                    }
                    res.json({ jsonrpc: '2.0', id, result });
                } catch (err) {
                    res.json({ jsonrpc: '2.0', id, error: { code: -32603, message: err.message } });
                }
            });

            // Legacy REST endpoints (backward compatible)
            app.post('/mcp/tools/call', async (req, res) => {
                try {
                    const result = await handleToolCall(req.body.tool, req.body.arguments || {});
                    res.json({ success: true, result });
                } catch (err) {
                    res.json({ success: false, error: err.message });
                }
            });

            app.get('/mcp/tools', (req, res) => {
                res.json({ tools: handleListTools().tools });
            });

            app.get('/mcp/health', (req, res) => {
                res.json({ status: 'ok', timestamp: new Date().toISOString() });
            });

            app.listen(port, () => {
                console.error(`ChromaMatch MCP Server (HTTP) running on port ${port}`);
            });
        });
    });
}
