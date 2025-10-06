import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Sets up the single minimal prompt
 */
export function setupMinimalPrompt(server: McpServer): void {
  server.registerPrompt(
    "greeting",
    {
      title: "Personal Greeting",
      description: "Generate a personalized greeting message for a given name",
      argsSchema: {
        name: z.string().optional().describe("The name of the person to greet"),
        style: z.enum(["formal", "casual", "friendly"]).optional().describe("The greeting style (optional)")
      }
    },
    ({ name = "User", style = "friendly" }) => {
      const greetingPrompts: Record<string, string> = {
        formal: `Please create a formal, professional greeting for ${name}. Make it respectful and appropriate for business settings.`,
        casual: `Please create a casual, relaxed greeting for ${name}. Make it informal and conversational.`,
        friendly: `Please create a warm, personalized greeting for ${name}. Make it friendly and welcoming.`
      };

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: greetingPrompts[style] || greetingPrompts.friendly
          }
        }]
      };
    }
  );
}
