# Path B — Power Automate + n8n fallback

Use only if the Entra role check fails (no Entra "AI Administrator" role, no user consent, GA
won't grant either). Works even in a fully locked-down tenant because Power Automate's
first-party Outlook/Teams/SharePoint connectors are **pre-consented by Microsoft**.

## Architecture

```
Claude (Cowork custom connector — OAuth 2.0)
   ▼
n8n MCP Server Trigger  (n8n Cloud or self-hosted on Modal)
   ▼  HTTPS
Power Automate flows in the IT4Causes tenant (HTTP request trigger)
   ▼  first-party connectors, Mark's own connection
Outlook · Calendar · Teams · SharePoint
```

## Prerequisites

- **Power Automate Premium** license (~$15/user/mo) assigned to Mark in IT4Causes —
  the HTTP request trigger is a premium connector. Mark already holds
  **Power Platform Administrator**, so flow creation itself is not a problem.
- An n8n instance (n8n Cloud is fastest; self-host on Modal if preferred).

## Build order (mirror the Path A tool surface)

One flow per tool, each with an **"When an HTTP request is received"** trigger, auth set to
**"Specific users in my tenant"**:

1. `get_calendar_events` — Office 365 Outlook connector → *Get calendar view of events (V3)*;
   inputs `start_date`, `end_date`; return subject/start/end/organizer/location as JSON.
2. `search_email` — *Get emails (V3)* with Search query parameter; return id + subject + from +
   bodyPreview (first ~280 chars) only.
3. `get_email` — *Get email (V2)* by message id; strip to plain text, cap ~20k chars.
4. `unread_email` — *Get emails (V3)*, filter `isRead eq false`, top 10.
5. Teams chats + SharePoint search — later increments; connector coverage is weaker here, so
   prove the loop with calendar + mail first.

## n8n wiring

1. Add an **MCP Server Trigger** node — n8n handles the OAuth 2.0 handshake Cowork requires
   (Cowork has no static bearer-token option).
2. For each tool, add a tool definition that maps MCP arguments → HTTP call to the matching
   Power Automate endpoint → returns the JSON body.
3. Keep responses under ~25k tokens: snippets in list tools, full bodies only in `get_email`.

## Known gotchas (from the architecture plan)

- Standard M365 connectors throttle at ~300 calls/60s — fine for single-user planning loads.
- The caller's identity is **not** forwarded into the flow; every call runs as Mark's stored
  connection. Fine for single-user, do not multi-tenant this.
- Flow HTTP endpoints contain a SAS-style signature in the URL; treat the URLs as secrets and
  keep them only in n8n credentials.
