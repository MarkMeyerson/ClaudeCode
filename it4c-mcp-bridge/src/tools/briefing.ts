import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { timezone } from "../graph.js";
import { errorResult, jsonResult } from "../trim.js";
import { fetchCalendarView } from "./calendar.js";
import { fetchRecentUnread } from "./mail.js";

function todayInTz(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone() }).format(new Date());
}

export function registerBriefingTools(server: McpServer) {
  server.registerTool(
    "it4c_daily_briefing",
    {
      description:
        "One-call daily planning snapshot for the IT4Causes tenant: the day's calendar " +
        "plus recent unread inbox summaries. Defaults to today in " + timezone() + ".",
      inputSchema: {
        date: z.string().optional().describe("YYYY-MM-DD; defaults to today"),
      },
    },
    async ({ date }) => {
      const day = date || todayInTz();
      try {
        const [events, unread] = await Promise.all([
          fetchCalendarView(day, day, 25),
          fetchRecentUnread(10),
        ]);
        return jsonResult({ date: day, timezone: timezone(), events, unreadEmail: unread });
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
