import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createMCPServer } from "./mcp-server.js";

import type { Request, Response } from "express";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware - CORS configuration for MCP browser clients
app.use(cors({
  origin: [
    // Local development (Vite dev servers)
    "*"
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'mcp-session-id', 
    'mcp-protocol-version', 
    'Authorization'
  ],
  exposedHeaders: ['mcp-session-id'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Transport storage for session management
const transports: Record<string, StreamableHTTPServerTransport> = {};

console.log(" Starting Minimal MCP Server...");

// MCP endpoint handler function
const handleMCPRequest = async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  try {
    if (sessionId && transports[sessionId]) {
      // Reuse existing transport for the session
      transport = transports[sessionId];
      console.log(`🔄 Reusing session: ${sessionId}`);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Create new transport for initialization request
      console.log("🆕 Creating new MCP session...");
      
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          // Store the transport by session ID
          transports[newSessionId] = transport;
          console.log(`✅ Session initialized: ${newSessionId}`);
        }
      });

      // Cleanup on transport close
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          console.log(`🧹 Session cleaned up: ${transport.sessionId}`);
        }
      };

      // Create and connect MCP server
      const server = createMCPServer();
      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided or not an initialization request',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('❌ Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
};

// MCP endpoint handlers - both root and /mcp serve the same functionality
app.post('/', handleMCPRequest);
app.post('/mcp', handleMCPRequest);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    server: 'minimal-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// S3 Dashboard URL
const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://s3-dashboard-build.s3.us-west-2.amazonaws.com/out/index.html';

// Cache for the dashboard HTML (optional optimization)
let cachedDashboard: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to fetch dashboard from S3
async function fetchDashboard(): Promise<string> {
  const now = Date.now();
  
  // Return cached version if still valid
  if (cachedDashboard && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedDashboard;
  }
  
  try {
    const response = await fetch(DASHBOARD_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Update cache
    cachedDashboard = html;
    cacheTimestamp = now;
    
    return html;
  } catch (error) {
    console.error('❌ Error fetching dashboard from S3:', error);
    throw error;
  }
}

// Root endpoint - Dynamic MCP Dashboard from S3
app.get('/', async (req: Request, res: Response) => {
  try {
    const html = await fetchDashboard();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).send('<h1>Dashboard temporarily unavailable</h1><p>Please try again later.</p>');
  }
});

app.get('/mcp', async (req: Request, res: Response) => {
  try {
    const html = await fetchDashboard();
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    res.status(500).send('<h1>Dashboard temporarily unavailable</h1><p>Please try again later.</p>');
  }
});

// Start the server
app.listen(PORT, () => {
      console.log(`Server running`);
});
