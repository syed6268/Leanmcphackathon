# Minimal MCP Server

This is the minimal MCP (Model Context Protocol) server implementation with Streamable HTTP transport.

# Deployment

You can deploy this server on Leanmcp.com.
If you are generating the code, on the the platform just go ahead and click test and deploy button and this should deploy the MCP server on leanmcp.com.

The endpoint will look like this:
`https://3001-...deployment id...-6532622b.e2b.dev/`
or 
`https://3001-...deployment id...-6532622b.serverlessmcps.link/`


## Features

- **One Resource**: `server-info` - Provides JSON information about the server
- **One Tool**: `echo` - Echoes back messages with metadata
- **One Prompt**: `greeting` - Generates personalized greeting prompts
- **Streamable HTTP Transport**: Modern MCP transport protocol
- **TypeScript**: Full type safety with ES modules

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

## Deployment

**To build and deploy this MCP server, click the "Test and Deploy" button in the UI.**

This button will:
1. Build your MCP server with all dependencies
2. Deploy it to a live endpoint

## API Endpoints

Once you've clicked "Test and Deploy" and your server is deployed, the following API endpoints will be available:

**An example server would look like this with the e2b.dev endpoint:**
`https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/`

**Available endpoints:**
- **MCP Endpoint**: `POST /mcp`
- **Health Check**: `GET /health`
- **Server Info**: `GET /`
- **AI Playground**: `GET /ai`
- **MCP Playground**: `GET /mcp`

**Example full URLs:**
- MCP Endpoint: `https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/mcp`
- Health Check: `https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/health`
- AI Playground: `https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/ai`


## Environment Variables

Copy `.env.example` to `.env` and configure:


## MCP Capabilities

### Resource: `server-info`
- **URI**: `info://server`
- **Description**: Returns server information and metadata

### Tool: `echo`
- **Input**: `{ message: string }`
- **Description**: Echoes back the message with timestamp and metadata

### Prompt: `greeting`
- **Arguments**: `{ name: string, style?: "formal" | "casual" | "friendly" }`
- **Description**: Generates personalized greeting prompts

## Usage with MCP Clients

Connect your MCP client to your deployed MCP endpoint using the Streamable HTTP transport.

**Example MCP client connection:**
```
https://3001-i2ioj8ir4wgd6eh867twi-6532622b.e2b.dev/mcp
```

Replace the example URL with your actual deployed server URL provided after clicking "Test and Deploy".

## Architecture

```
src/
├── server.ts          # Express server with Streamable HTTP transport
├── mcp-server.ts      # MCP server configuration
└── minimal/
    ├── resource.ts    # Single resource implementation
    ├── tool.ts        # Single tool implementation
    └── prompt.ts      # Single prompt implementation