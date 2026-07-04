import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { graph } from "../graph.js";
import { clampTop, errorResult, jsonResult, snippet, stripHtml } from "../trim.js";

export function registerSharePointTools(server: McpServer) {
  server.registerTool(
    "it4c_search_sharepoint",
    {
      description:
        "Search files across IT4Causes SharePoint/OneDrive (Microsoft Search over driveItems). " +
        "Returns names, links, and hit-highlighted snippets.",
      inputSchema: {
        query: z.string().describe("Search terms (KQL supported, e.g. 'budget filetype:xlsx')"),
        top: z.number().int().optional().describe("Max results (default 10, cap 25)"),
      },
    },
    async ({ query, top }) => {
      try {
        const data = await graph<any>("/search/query", {
          method: "POST",
          body: {
            requests: [
              {
                entityTypes: ["driveItem"],
                query: { queryString: query },
                from: 0,
                size: clampTop(top, 10),
              },
            ],
          },
        });
        const hits = data.value?.[0]?.hitsContainers?.[0]?.hits || [];
        return jsonResult(
          hits.map((hit: any) => ({
            name: hit.resource?.name,
            url: hit.resource?.webUrl,
            lastModified: hit.resource?.lastModifiedDateTime,
            summary: snippet(stripHtml(hit.summary)),
          }))
        );
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}
