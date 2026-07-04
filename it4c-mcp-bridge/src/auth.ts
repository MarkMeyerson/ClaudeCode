import fs from "node:fs";
import path from "node:path";
import {
  ConfidentialClientApplication,
  PublicClientApplication,
  type Configuration,
  type ICachePlugin,
  type TokenCacheContext,
} from "@azure/msal-node";

export const DELEGATED_SCOPES = [
  "User.Read",
  "Mail.Read",
  "Calendars.Read",
  "Chat.Read",
  "Sites.Read.All",
  "Files.Read.All",
];

const APP_SCOPES = ["https://graph.microsoft.com/.default"];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env (or export the variable) — see SETUP.md.`
    );
  }
  return value;
}

function cacheFilePath(): string {
  return path.resolve(process.env.IT4C_TOKEN_CACHE || ".it4c-token-cache.json");
}

function fileCachePlugin(): ICachePlugin {
  const file = cacheFilePath();
  return {
    async beforeCacheAccess(context: TokenCacheContext) {
      if (fs.existsSync(file)) {
        context.tokenCache.deserialize(fs.readFileSync(file, "utf-8"));
      }
    },
    async afterCacheAccess(context: TokenCacheContext) {
      if (context.cacheHasChanged) {
        fs.writeFileSync(file, context.tokenCache.serialize(), { mode: 0o600 });
      }
    },
  };
}

function baseConfig(): Configuration {
  return {
    auth: {
      clientId: requireEnv("IT4C_CLIENT_ID"),
      authority: `https://login.microsoftonline.com/${requireEnv("IT4C_TENANT_ID")}`,
    },
    cache: { cachePlugin: fileCachePlugin() },
  };
}

export function publicClient(): PublicClientApplication {
  return new PublicClientApplication(baseConfig());
}

/**
 * Acquire a Graph access token.
 * - delegated mode (default): silent acquisition from the persisted cache;
 *   the refresh token there comes from a prior `npm run login` device-code sign-in.
 * - app mode: client credentials (requires IT4C_CLIENT_SECRET and application permissions).
 */
export async function getAccessToken(): Promise<string> {
  const mode = (process.env.IT4C_AUTH_MODE || "delegated").toLowerCase();

  if (mode === "app") {
    const config = baseConfig();
    config.auth.clientSecret = requireEnv("IT4C_CLIENT_SECRET");
    const cca = new ConfidentialClientApplication(config);
    const result = await cca.acquireTokenByClientCredential({ scopes: APP_SCOPES });
    if (!result?.accessToken) throw new Error("Client-credential token acquisition failed.");
    return result.accessToken;
  }

  const pca = publicClient();
  const accounts = await pca.getTokenCache().getAllAccounts();
  if (accounts.length === 0) {
    throw new Error(
      `No signed-in account in token cache (${cacheFilePath()}). ` +
        `Run \`npm run login\` once to sign in with the device-code flow.`
    );
  }
  const result = await pca.acquireTokenSilent({
    account: accounts[0],
    scopes: DELEGATED_SCOPES,
  });
  if (!result?.accessToken) {
    throw new Error("Silent token acquisition failed — run `npm run login` again.");
  }
  return result.accessToken;
}
