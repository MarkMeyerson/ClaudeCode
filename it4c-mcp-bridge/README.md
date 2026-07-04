# IT4Causes MCP Bridge

Read-only [MCP](https://modelcontextprotocol.io) server that gives Claude API-based access to the
**IT4Causes** Microsoft 365 tenant — the tenant where the native Claude M365 connector was denied
(the one connector slot is used by SherpaTech.AI). Same speed and zero-screen-takeover experience
as the Gmail/Outlook connectors, because it's all Microsoft Graph API underneath.

Implements **Path A** of the architecture plan
(Notion: *IT4Causes ↔ Claude Cowork — MCP Bridge Architecture Plan*).
Path B (Power Automate + n8n, if the Entra role check fails) is documented in
[docs/PATH_B_POWER_AUTOMATE_N8N.md](docs/PATH_B_POWER_AUTOMATE_N8N.md).

## Tools

| Tool | What it does |
|---|---|
| `it4c_daily_briefing` | Today's calendar + recent unread inbox, one call — built for daily planning |
| `it4c_get_calendar_events` | Calendar between two dates, compact summaries |
| `it4c_search_email` | Mailbox search → id + snippet summaries |
| `it4c_get_email` | Full body of one message (plain text, capped) |
| `it4c_unread_email` | Recent unread inbox messages |
| `it4c_list_chats` / `it4c_get_chat_messages` | Teams 1:1/group chats |
| `it4c_search_sharepoint` | Microsoft Search over SharePoint/OneDrive files |
| `it4c_trello_my_cards` / `it4c_trello_search` | Optional — only when `TRELLO_KEY`+`TRELLO_TOKEN` set |

All tools are read-only and return snippets/IDs first (full bodies via `it4c_get_email`),
keeping responses well under the ~25k-token MCP cap.

## Quick start

Prereq: the app registration in IT4Causes Entra ID — see [SETUP.md](SETUP.md).

```bash
cd it4c-mcp-bridge
npm install
npm run build
cp .env.example .env      # fill in IT4C_TENANT_ID + IT4C_CLIENT_ID
npm run login             # one-time device-code sign-in; persists refresh token
```

Then register with Claude Code (or Claude Desktop `claude_desktop_config.json`):

```bash
claude mcp add it4causes -- node /path/to/it4c-mcp-bridge/dist/index.js
```

The server runs headless after the one-time login — MSAL silently refreshes tokens
from `.it4c-token-cache.json` (git-ignored, chmod 600).

## Auth modes

- **delegated** (default): device-code sign-in as Mark; read-only delegated scopes
  (`Mail.Read`, `Calendars.Read`, `Chat.Read`, `Sites.Read.All`, `Files.Read.All`, `User.Read`).
  Sees exactly what Mark can see, nothing more.
- **app**: client-credentials, only if the Global Admin ever grants application permissions
  (not expected — delegated is the plan).

## Cowork / claude.ai custom connector

The Cowork custom-connector UI requires a **remote MCP server speaking OAuth** — it has no
static-token option. This stdio server is immediately usable from Claude Code and Claude
Desktop; to expose it to Cowork/claude.ai, front it with an OAuth-capable remote layer
(n8n MCP Server Trigger or Modal FastMCP) as described in the architecture plan.
