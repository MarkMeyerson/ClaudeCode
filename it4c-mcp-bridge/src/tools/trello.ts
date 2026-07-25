/**
 * Optional Trello tools — registered only when TRELLO_KEY and TRELLO_TOKEN are set.
 *
 * Note: the previous standalone "custom Trello MCP" was decommissioned on
 * 2026-06-20 and is intentionally not being revived. These are lightweight,
 * additive read-only tools inside this bridge, disabled by default.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { clampTop, errorResult, jsonResult, snippet } from "../trim.js";

const TRELLO_BASE = "https://api.trello.com/1";

function trelloEnabled(): boolean {
  return Boolean(process.env.TRELLO_KEY && process.env.TRELLO_TOKEN);
}

async function trello<T = any>(pathAndQuery: string): Promise<T> {
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  const url =
    `${TRELLO_BASE}${pathAndQuery}${separator}` +
    `key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Trello ${pathAndQuery} → ${response.status}: ${await response.text().then((t) => t.slice(0, 300))}`);
  }
  return (await response.json()) as T;
}

export function registerTrelloTools(server: McpServer) {
  if (!trelloEnabled()) return;

  server.registerTool(
    "it4c_trello_my_cards",
    {
      description: "List Trello cards assigned to Mark (name, due date, board, link).",
      inputSchema: {
        top: z.number().int().optional().describe("Max cards (default 20, cap 25)"),
      },
    },
    async ({ top }) => {
      try {
        const cards = await trello<any[]>("/members/me/cards?fields=name,due,dateLastActivity,shortUrl,idBoard");
        return jsonResult(
          cards.slice(0, clampTop(top, 20)).map((card) => ({
            name: card.name,
            due: card.due || undefined,
            lastActivity: card.dateLastActivity,
            url: card.shortUrl,
          }))
        );
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "it4c_trello_search",
    {
      description: "Search Trello cards and boards by keyword.",
      inputSchema: {
        query: z.string().describe("Search terms"),
        top: z.number().int().optional().describe("Max results (default 10, cap 25)"),
      },
    },
    async ({ query, top }) => {
      try {
        const size = clampTop(top, 10);
        const data = await trello<any>(
          `/search?query=${encodeURIComponent(query)}&modelTypes=cards,boards&cards_limit=${size}&boards_limit=${size}&card_fields=name,due,shortUrl,desc&board_fields=name,shortUrl`
        );
        return jsonResult({
          cards: (data.cards || []).map((card: any) => ({
            name: card.name,
            due: card.due || undefined,
            url: card.shortUrl,
            desc: snippet(card.desc) || undefined,
          })),
          boards: (data.boards || []).map((board: any) => ({ name: board.name, url: board.shortUrl })),
        });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
