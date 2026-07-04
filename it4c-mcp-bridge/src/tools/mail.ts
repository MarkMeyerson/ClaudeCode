import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { graph } from "../graph.js";
import { capBody, clampTop, errorResult, jsonResult, snippet, stripHtml } from "../trim.js";

const MESSAGE_LIST_SELECT = "id,subject,from,receivedDateTime,bodyPreview,isRead,hasAttachments";

function toSummary(message: any) {
  return {
    id: message.id,
    subject: message.subject,
    from: message.from?.emailAddress?.address,
    fromName: message.from?.emailAddress?.name,
    received: message.receivedDateTime,
    unread: message.isRead === false || undefined,
    hasAttachments: message.hasAttachments || undefined,
    preview: snippet(message.bodyPreview),
  };
}

export async function fetchRecentUnread(top: number) {
  const query = new URLSearchParams({
    $filter: "isRead eq false",
    $orderby: "receivedDateTime desc",
    $top: String(top),
    $select: MESSAGE_LIST_SELECT,
  });
  const data = await graph<{ value: any[] }>(`/me/mailFolders/inbox/messages?${query}`);
  return data.value.map(toSummary);
}

export function registerMailTools(server: McpServer) {
  server.registerTool(
    "it4c_search_email",
    {
      description:
        "Search Mark's IT4Causes (M365) mailbox. Returns id + snippet summaries only — " +
        "use it4c_get_email with an id for the full body.",
      inputSchema: {
        query: z
          .string()
          .describe('Search terms (Outlook $search syntax, e.g. "from:jane budget report")'),
        top: z.number().int().optional().describe("Max results (default 10, cap 25)"),
      },
    },
    async ({ query, top }) => {
      try {
        const params = new URLSearchParams({
          $search: `"${query.replace(/"/g, '\\"')}"`,
          $top: String(clampTop(top, 10)),
          $select: MESSAGE_LIST_SELECT,
        });
        const data = await graph<{ value: any[] }>(`/me/messages?${params}`);
        return jsonResult(data.value.map(toSummary));
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "it4c_get_email",
    {
      description: "Fetch one IT4Causes email's full body (plain text, capped) by message id.",
      inputSchema: {
        message_id: z.string().describe("Message id from it4c_search_email"),
      },
    },
    async ({ message_id }) => {
      try {
        const message = await graph<any>(
          `/me/messages/${encodeURIComponent(message_id)}?$select=subject,from,toRecipients,ccRecipients,receivedDateTime,body`,
          { headers: { Prefer: 'outlook.body-content-type="text"' } }
        );
        return jsonResult({
          subject: message.subject,
          from: message.from?.emailAddress?.address,
          to: (message.toRecipients || []).map((r: any) => r.emailAddress?.address),
          cc: (message.ccRecipients || []).map((r: any) => r.emailAddress?.address),
          received: message.receivedDateTime,
          body: capBody(
            message.body?.contentType === "html" ? stripHtml(message.body?.content) : message.body?.content
          ),
        });
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "it4c_unread_email",
    {
      description: "List recent unread messages in the IT4Causes inbox (snippet summaries).",
      inputSchema: {
        top: z.number().int().optional().describe("Max results (default 10, cap 25)"),
      },
    },
    async ({ top }) => {
      try {
        return jsonResult(await fetchRecentUnread(clampTop(top, 10)));
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
