import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { setupMinimalResource } from "./minimal/resource.js";
import { setupMinimalTool } from "./minimal/tool.js";
import { setupMinimalPrompt } from "./minimal/prompt.js";
/**
 * Creates and configures the Robinhood Portfolio Analysis MCP server instance
 */
export function createMCPServer() {
    const serverName = "robinhood-portfolio-mcp";
    const serverVersion = "1.0.0";
    console.error(`🔧 Creating MCP server: ${serverName} v${serverVersion}`);
    // Create the MCP server instance
    const server = new McpServer({
        name: serverName,
        version: serverVersion
    });
    console.error("📦 Registering minimal MCP capabilities...");
    // Register resources
    setupMinimalResource(server);
    console.error("✅ Resource registered: server-info");
    // Register tools  
    setupMinimalTool(server);
    console.error("✅ Tool registered: echo");
    // Register prompts
    setupMinimalPrompt(server);
    console.error("✅ Prompt registered: greeting");
    console.error("🎉 Minimal MCP server configuration completed");
    return server;
}
