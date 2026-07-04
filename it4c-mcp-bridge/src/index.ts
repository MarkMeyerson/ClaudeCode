#!/usr/bin/env node
/**
 * IT4Causes MCP bridge — read-only Microsoft Graph access to the IT4Causes
 * tenant (mail, calendar, Teams chats, SharePoint search) over MCP stdio.
 *
 * Prereqs: a single-tenant app registration in IT4Causes Entra ID (SETUP.md,
 * Path A) and a one-time `npm run login` device-code sign-in.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerCalendarTools } from "./tools/calendar.js";
import { registerMailTools } from "./tools/mail.js";
import { registerTeamsTools } from "./tools/teams.js";
import { registerSharePointTools } from "./tools/sharepoint.js";
import { registerBriefingTools } from "./tools/briefing.js";
import { registerTrelloTools } from "./tools/trello.js";

async function main() {
  const server = new McpServer({ name: "it4c-mcp-bridge", version: "0.1.0" });

  registerCalendarTools(server);
  registerMailTools(server);
  registerTeamsTools(server);
  registerSharePointTools(server);
  registerBriefingTools(server);
  registerTrelloTools(server); // no-op unless TRELLO_KEY + TRELLO_TOKEN are set

  await server.connect(new StdioServerTransport());
  console.error("it4c-mcp-bridge running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
