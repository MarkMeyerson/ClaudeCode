/**
 * One-time interactive sign-in: `npm run login`
 * Runs the OAuth device-code flow against the IT4Causes tenant and persists
 * the refresh token to IT4C_TOKEN_CACHE so the MCP server can run headless.
 */
import { DELEGATED_SCOPES, publicClient } from "./auth.js";

async function main() {
  const pca = publicClient();
  const result = await pca.acquireTokenByDeviceCode({
    scopes: DELEGATED_SCOPES,
    deviceCodeCallback: (info) => {
      console.log("\n" + info.message + "\n");
    },
  });
  if (!result?.account) {
    console.error("Sign-in did not complete.");
    process.exit(1);
  }
  console.log(`Signed in as ${result.account.username}.`);
  console.log("Token cache saved. The MCP server can now run without prompts.");
}

main().catch((err) => {
  console.error("Login failed:", err?.message || err);
  process.exit(1);
});
