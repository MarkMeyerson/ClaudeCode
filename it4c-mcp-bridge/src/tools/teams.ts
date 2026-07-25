import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { graph } from "../graph.js";
import { clampTop, errorResult, jsonResult, snippet, stripHtml } from "../trim.js";

export function registerTeamsTools(server: McpServer) {
  server.registerTool(
    "it4c_list_chats",
    {
      description:
        "List Mark's IT4Causes Teams chats (1:1 and group), most recent first. " +
        "Returns chat ids for it4c_get_chat_messages. Uses the delegated Chat.Read scope; " +
        "channel messages need ChannelMessage.Read.All and are not covered yet.",
      inputSchema: {
        top: z.number().int().optional().describe("Max chats (default 15, cap 25)"),
      },
    },
    async ({ top }) => {
      try {
        const params = new URLSearchParams({
          $top: String(clampTop(top, 15)),
          $orderby: "lastMessagePreview/createdDateTime desc",
          $expand: "members($select=displayName)",
        });
        const data = await graph<{ value: any[] }>(`/me/chats?${params}`);
        return jsonResult(
          data.value.map((chat) => ({
            id: chat.id,
            topic: chat.topic || undefined,
            type: chat.chatType,
            members: (chat.members || []).map((m: any) => m.displayName).filter(Boolean),
            lastActivity: chat.lastUpdatedDateTime,
          }))
        );
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  server.registerTool(
    "it4c_get_chat_messages",
    {
      description: "Read recent messages from one IT4Causes Teams chat (newest first, text only).",
      inputSchema: {
        chat_id: z.string().describe("Chat id from it4c_list_chats"),
        top: z.number().int().optional().describe("Max messages (default 15, cap 25)"),
      },
    },
    async ({ chat_id, top }) => {
      try {
        const params = new URLSearchParams({ $top: String(clampTop(top, 15)) });
        const data = await graph<{ value: any[] }>(
          `/me/chats/${encodeURIComponent(chat_id)}/messages?${params}`
        );
        return jsonResult(
          data.value
            .filter((m) => m.messageType === "message")
            .map((m) => ({
              from: m.from?.user?.displayName || "(app/system)",
              sent: m.createdDateTime,
              text: snippet(stripHtml(m.body?.content), 500),
            }))
        );
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
