/**
 * ChromaMatch MCP Server
 * 
 * Universal MCP server supporting stdio (JSON-RPC 2.0) and HTTP transports.
 * Compatible with Claude Desktop, Codex, Trae Solo, Cursor, Windsurf, and any MCP client.
 * 
 * Usage:
 *   stdio:  node server.js                          (for Claude Desktop, Cursor, etc.)
 *   http:   node server.js --transport http --port 3456
 *   sse:    node server.js --transport sse  --port 3456
 */

import { createServer } from './transport.js';

// Start the MCP server
const server = createServer();
server.start();
