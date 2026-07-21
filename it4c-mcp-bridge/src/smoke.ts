/**
 * End-to-end smoke test: `npm run smoke`
 * Verifies auth + live Graph access after `npm run login`:
 * prints who is signed in, today's calendar, and recent unread inbox.
 */
import { graph, timezone } from "./graph.js";
import { fetchCalendarView } from "./tools/calendar.js";
import { fetchRecentUnread } from "./tools/mail.js";

function todayInTz(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone() }).format(new Date());
}

async function main() {
  const me = await graph<any>("/me?$select=displayName,userPrincipalName");
  console.log(`Signed in as: ${me.displayName} <${me.userPrincipalName}>`);

  const day = todayInTz();
  const events = await fetchCalendarView(day, day, 25);
  console.log(`\nCalendar for ${day} (${timezone()}): ${events.length} event(s)`);
  for (const event of events) {
    console.log(`  - ${event.start}  ${event.subject}${event.organizer ? ` (${event.organizer})` : ""}`);
  }

  const unread = await fetchRecentUnread(10);
  console.log(`\nUnread inbox: ${unread.length} message(s)`);
  for (const message of unread) {
    console.log(`  - ${message.received}  ${message.fromName || message.from}: ${message.subject}`);
  }

  console.log("\nSmoke test passed — the IT4Causes bridge is live.");
}

main().catch((err) => {
  console.error("Smoke test failed:", err?.message || err);
  process.exit(1);
});
