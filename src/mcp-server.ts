import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { setupMinimalResource } from "./minimal/resource.js";
import { setupMinimalTool } from "./minimal/tool.js";
import { setupMinimalPrompt } from "./minimal/prompt.js";

/**
 * Creates and configures the Robinhood Portfolio Analysis MCP server instance
 */
export function createMCPServer(): McpServer {
  const serverName = "robinhood-portfolio-mcp";
  const serverVersion = "1.0.0";
  
  console.log(`🔧 Creating MCP server: ${serverName} v${serverVersion}`);
  
  // Create the MCP server instance
  const server = new McpServer({
    name: serverName,
    version: serverVersion
  });

  console.log("📦 Registering minimal MCP capabilities...");
  
  // Register resources
  setupMinimalResource(server);
  console.log("✅ Resource registered: server-info");
  
  // Register tools  
  setupMinimalTool(server);
  console.log("✅ Tool registered: echo");
  
  // Register prompts
  setupMinimalPrompt(server);
  console.log("✅ Prompt registered: greeting");
  
  console.log("🎉 Minimal MCP server configuration completed");
  
  return server;
}
