import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMCPServer } from "./mcp-server.js";
import { connectDB, closeDB, initializeWallet } from "./db.js";

/**
 * Stdio entry point for Claude Desktop and Cursor
 * This allows the MCP server to communicate via stdin/stdout
 */
async function main() {
  console.error("🚀 Starting Robinhood MCP Server (stdio mode)...");
  
  try {
    // Connect to MongoDB
    await connectDB();
    console.error("✅ MongoDB connected successfully");
    
    // Initialize wallet with default balance
    await initializeWallet();
    console.error("✅ Wallet initialized");
    
    // Create the MCP server instance
    const server = createMCPServer();
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    console.error("📡 Connecting server to stdio transport...");
    
    // Connect the server to stdio transport
    await server.connect(transport);
    
    console.error("✅ Server ready and listening on stdio");
    console.error("💡 You can now use this server with Claude Desktop or Cursor");
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\n🛑 Shutting down gracefully...');
      await closeDB();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.error('\n🛑 Shutting down gracefully...');
      await closeDB();
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Failed to start MCP server:", error);
    process.exit(1);
  }
}

main();

