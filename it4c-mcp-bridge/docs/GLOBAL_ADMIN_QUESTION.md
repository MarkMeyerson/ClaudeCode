# Ready-to-send: role clarification for the IT4Causes Global Admin

Send only if the 2-minute self-check in [SETUP.md](../SETUP.md#step-0--the-decisive-check-2-minutes-do-this-first)
is ambiguous, or to request the role if you don't have it.

---

**Subject:** Quick role question — which "AI Administrator" do I have?

Hi [name],

Quick clarification that will save us both a longer conversation later: my account has an
"AI Administrator" assignment, and Microsoft confusingly has two roles by nearly that name.
Which one do I hold?

1. **Microsoft Entra ID directory role — "AI Administrator"**
   (entra.microsoft.com → Identity → Roles & admins). This one can grant admin consent for
   delegated Microsoft Graph permissions on single-tenant apps.

2. **Azure RBAC role — "Azure AI Administrator"**
   (portal.azure.com → subscription or resource group → Access control (IAM)). This one is for
   Azure AI resources and grants nothing in Entra.

**Why I'm asking:** I want read-only, API-based access to *my own* IT4Causes mailbox, calendar,
Teams chats, and files for daily planning — the follow-up to the Claude M365 connector request
you declined. This approach is much narrower than that connector was:

- **Single-tenant app**, visible and revocable by you in Enterprise applications at any time
- **Delegated permissions only** — it acts as me, sees only what I already see, and stops
  working the moment my account is disabled
- **Read-only scopes**: Mail.Read, Calendars.Read, Chat.Read, Sites.Read.All, Files.Read.All
- No application (app-only) permissions, no other users' data, no write access

If I hold role #1, I can set this up myself with zero action needed from you. If it's #2, two
options and I'm happy with either:

- (a) assign me the Entra "AI Administrator" role (or enable user consent for low-risk apps
  under Enterprise applications → Consent and permissions), or
- (b) I'll build it on Power Automate's first-party Microsoft 365 connectors instead — those
  are pre-consented by Microsoft, so it needs no Entra changes at all, just confirmation that
  my Power Automate Premium license is active.

Happy to walk through the app registration with you first if that helps.

Thanks!
Mark
