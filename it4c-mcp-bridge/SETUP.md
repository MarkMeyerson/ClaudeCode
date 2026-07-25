# Setup — from role check to working bridge

Everything is blocked on one question: **which "AI Administrator" role does Mark hold in the
IT4Causes tenant?** This doc gives you (1) the 2-minute self-check, (2) the exact question to
send the Global Admin if the self-check is ambiguous, and (3) the full Path A walkthrough.

---

## Step 0 — The decisive check (2 minutes, do this first)

1. Go to **entra.microsoft.com** signed in with your IT4Causes account.
2. **Identity → Roles & admins → Roles & admins**, then click **"Your roles"** (or search your
   own name under Assignments).
3. Look at what's listed:
   - **"AI Administrator"** appears as an **Entra ID directory role** → ✅ **Path A is open.**
     This role can grant admin consent for delegated Graph scopes on a single-tenant app you
     create. Proceed to Step 1 below.
   - Only **"Power Platform Administrator"**, or an **"Azure AI Administrator"** that lives in
     **portal.azure.com → subscription/resource IAM** (Azure RBAC, not Entra) → ❌ Path A is
     blocked. Use [Path B](docs/PATH_B_POWER_AUTOMATE_N8N.md).
4. Bonus check while you're there: **Identity → Applications → Enterprise applications →
   Consent and permissions → User consent settings**. If user consent is allowed for
   verified apps / low-impact scopes, Path A works even without the role.

### The tell

- Entra directory role = assigned in **entra.microsoft.com → Roles & admins**. Role name is
  exactly **"AI Administrator"**.
- Azure RBAC role = assigned in **portal.azure.com → (subscription or resource group) →
  Access control (IAM)**. Role name is **"Azure AI Administrator"**. This one grants nothing
  in Entra and cannot consent to app permissions.

---

## Step 0b — If you can't tell: the exact question for your Global Admin

Copy/paste (also in [docs/GLOBAL_ADMIN_QUESTION.md](docs/GLOBAL_ADMIN_QUESTION.md) as a
ready-to-send email):

> Quick clarification on my admin roles: is my "AI Administrator" assignment the **Microsoft
> Entra ID directory role** called "AI Administrator" (visible under entra.microsoft.com →
> Identity → Roles & admins), or the **Azure RBAC role** "Azure AI Administrator" (assigned on a
> subscription/resource group under Access control (IAM) in portal.azure.com)?
>
> Context: I'm setting up a read-only integration for **my own account only** (mail, calendar,
> Teams chats, files I already have access to). If I have the Entra directory role, I can
> register a single-tenant app scoped to read-only **delegated** permissions — it acts only as
> me, only when I sign in, touches nobody else's data, and requires nothing from you.
>
> If it's the Azure RBAC one: (a) is user consent for low-risk apps enabled (Entra → Enterprise
> applications → Consent and permissions)? and (b) would you be open to assigning me the Entra
> "AI Administrator" role — or should I build this on Power Automate's Microsoft-pre-consented
> first-party connectors instead?

---

## Step 1 — Register the app (Path A, ~10 minutes)

In **entra.microsoft.com → Identity → Applications → App registrations → New registration**:

1. Name: `IT4C Claude Bridge` (anything works).
2. Supported account types: **Accounts in this organizational directory only** (single tenant).
3. Redirect URI: leave empty (device-code flow doesn't need one).
4. Register, then note the **Application (client) ID** and **Directory (tenant) ID** →
   these become `IT4C_CLIENT_ID` and `IT4C_TENANT_ID` in `.env`.

### Permissions

**API permissions → Add a permission → Microsoft Graph → Delegated permissions**, add:

- `User.Read` (usually present by default)
- `Mail.Read`
- `Calendars.Read`
- `Chat.Read`
- `Sites.Read.All`
- `Files.Read.All`
- `offline_access`

Then **Grant admin consent for IT4Causes** (this is the button the Entra "AI Administrator"
role unlocks). All scopes are read-only and delegated — the app can never see anything Mark
himself can't.

> Teams **channel** messages need `ChannelMessage.Read.All`, which may require
> resource-specific consent. Deliberately deferred — 1:1/group chats via `Chat.Read` cover the
> daily-planning use case. Add later if needed.

### Enable device-code flow

**Authentication → Advanced settings → Allow public client flows → Yes** (device code is a
public-client grant).

## Step 2 — Install, login, run

```bash
cd it4c-mcp-bridge
npm install && npm run build
cp .env.example .env   # paste IT4C_TENANT_ID and IT4C_CLIENT_ID
npm run login          # prints a microsoft.com/devicelogin code; sign in as your IT4C account
```

`npm run login` is one-time: MSAL persists the refresh token to `.it4c-token-cache.json`
(git-ignored) and the server refreshes silently from then on.

## Step 3 — Connect Claude

**Claude Code / Claude Desktop (works today, no extra hosting):**

```bash
claude mcp add it4causes -- node /absolute/path/to/it4c-mcp-bridge/dist/index.js
```

Smoke test: ask Claude to run `it4c_daily_briefing`. You should get today's IT4C calendar and
unread inbox in one shot — same speed as the Gmail connector, no screen takeover.

**Cowork / claude.ai custom connector (later increment):** requires a remote OAuth-speaking MCP
endpoint. Front this server with n8n's MCP Server Trigger or Modal FastMCP per the architecture
plan in Notion.

## Step 4 — Optional Trello

Set `TRELLO_KEY` and `TRELLO_TOKEN` in `.env` (from https://trello.com/power-ups/admin) and the
two Trello tools register automatically. Left off by default — the old standalone Trello MCP was
decommissioned 2026-06-20 and this does not revive it; it's a fresh, optional add-on for when
Trello is wanted in the daily briefing loop.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `AADSTS7000218` / public client error | Authentication → Allow public client flows → Yes |
| `AADSTS65001` consent error on login | Admin consent wasn't granted for a scope — re-check Step 1 permissions |
| `No signed-in account in token cache` | Run `npm run login` (or `IT4C_TOKEN_CACHE` points at the wrong path) |
| `it4c_list_chats` 403 | `Chat.Read` missing or consent not granted |
| SharePoint search empty | `Sites.Read.All`/`Files.Read.All` consent, or the account genuinely lacks access |
