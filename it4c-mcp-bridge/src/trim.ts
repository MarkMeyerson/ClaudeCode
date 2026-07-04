/**
 * Helpers to keep tool responses well under the ~25k-token MCP response cap:
 * search-style tools return snippets; get-*-body tools return capped full text.
 */

export const SNIPPET_CHARS = 280;
export const BODY_CHARS = 20_000;
export const MAX_ITEMS = 25;

export function clampTop(top: number | undefined, fallback: number): number {
  if (!top || top < 1) return fallback;
  return Math.min(top, MAX_ITEMS);
}

export function snippet(text: string | undefined | null, max = SNIPPET_CHARS): string {
  if (!text) return "";
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.length <= max ? collapsed : collapsed.slice(0, max) + "…";
}

export function capBody(text: string | undefined | null, max = BODY_CHARS): string {
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max) + `\n\n[…truncated at ${max} chars]`;
}

/** Crude HTML → text for Teams/Outlook HTML bodies. */
export function stripHtml(html: string | undefined | null): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function jsonResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 1) }] };
}

export function errorResult(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true as const };
}
