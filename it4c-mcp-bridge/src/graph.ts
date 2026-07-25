import { getAccessToken } from "./auth.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export function timezone(): string {
  return process.env.IT4C_TIMEZONE || "America/New_York";
}

export interface GraphOptions {
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
}

export async function graph<T = any>(pathAndQuery: string, options: GraphOptions = {}): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${GRAPH_BASE}${pathAndQuery}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: `outlook.timezone="${timezone()}"`,
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Graph ${options.method || "GET"} ${pathAndQuery} → ${response.status}: ${detail.slice(0, 500)}`);
  }
  return (await response.json()) as T;
}
