import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { graph, timezone } from "../graph.js";
import { clampTop, errorResult, jsonResult, snippet } from "../trim.js";

function isoDay(date: string, endOfDay = false): string {
  return `${date}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export async function fetchCalendarView(startDate: string, endDate: string, top: number) {
  const query = new URLSearchParams({
    startDateTime: isoDay(startDate),
    endDateTime: isoDay(endDate, true),
    $orderby: "start/dateTime",
    $top: String(top),
    $select: "subject,organizer,start,end,location,isAllDay,isCancelled,onlineMeeting,bodyPreview,attendees",
  });
  const data = await graph<{ value: any[] }>(`/me/calendarView?${query}`);
  return data.value.map((event) => ({
    subject: event.subject,
    start: event.start?.dateTime,
    end: event.end?.dateTime,
    timezone: event.start?.timeZone,
    allDay: event.isAllDay || undefined,
    cancelled: event.isCancelled || undefined,
    organizer: event.organizer?.emailAddress?.name || event.organizer?.emailAddress?.address,
    location: event.location?.displayName || undefined,
    joinUrl: event.onlineMeeting?.joinUrl || undefined,
    attendeeCount: event.attendees?.length ?? 0,
    preview: snippet(event.bodyPreview, 140) || undefined,
  }));
}

export function registerCalendarTools(server: McpServer) {
  server.registerTool(
    "it4c_get_calendar_events",
    {
      description:
        `Read Mark's IT4Causes (M365) calendar between two dates (inclusive), in ${timezone()}. ` +
        "Returns compact event summaries ordered by start time.",
      inputSchema: {
        start_date: z.string().describe("Start date, YYYY-MM-DD"),
        end_date: z.string().describe("End date, YYYY-MM-DD"),
        top: z.number().int().optional().describe("Max events (default 20, cap 25)"),
      },
    },
    async ({ start_date, end_date, top }) => {
      try {
        return jsonResult(await fetchCalendarView(start_date, end_date, clampTop(top, 20)));
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
