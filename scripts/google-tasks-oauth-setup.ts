/**
 * One-time OAuth setup so tasks appear in YOUR Google Tasks app (no domain-wide delegation).
 *
 * 1. Create OAuth Desktop client:
 *    https://console.cloud.google.com/apis/credentials?project=boxwood-magnet-498623-n4
 *    → Create credentials → OAuth client ID → Desktop app
 * 2. Add to .env.local:
 *    GOOGLE_TASKS_OAUTH_CLIENT_ID=...
 *    GOOGLE_TASKS_OAUTH_CLIENT_SECRET=...
 * 3. Run: npm run google-tasks:oauth-setup
 */

import { createServer } from "http";
import { readFileSync, existsSync, appendFileSync } from "fs";
import { resolve } from "path";
import { URL } from "url";

const loadEnvFile = (filename: string) => {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env.local");
loadEnvFile(".env");

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";

const main = async () => {
  const clientId = process.env.GOOGLE_TASKS_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_TASKS_OAUTH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    console.error(
      "Set GOOGLE_TASKS_OAUTH_CLIENT_ID and GOOGLE_TASKS_OAUTH_CLIENT_SECRET in .env.local first."
    );
    console.error(
      "Create a Desktop OAuth client at https://console.cloud.google.com/apis/credentials?project=boxwood-magnet-498623-n4"
    );
    process.exit(1);
  }

  const { OAuth2Client } = await import("google-auth-library");
  const client = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);
  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [TASKS_SCOPE],
  });

  console.log("Open this URL in your browser:\n");
  console.log(authUrl);
  console.log("");

  await new Promise<void>((resolvePromise, reject) => {
    const server = createServer(async (req, res) => {
      try {
        if (!req.url?.startsWith("/oauth2callback")) {
          res.writeHead(404);
          res.end();
          return;
        }

        const url = new URL(req.url, REDIRECT_URI);
        const code = url.searchParams.get("code");
        if (!code) {
          res.writeHead(400);
          res.end("Missing code");
          return;
        }

        const { tokens } = await client.getToken(code);
        if (!tokens.refresh_token) {
          res.writeHead(500);
          res.end("No refresh token — revoke app access and retry with prompt=consent");
          return;
        }

        const envPath = resolve(process.cwd(), ".env.local");
        const lines = [
          "",
          "# Google Tasks OAuth (user-visible tasks at tasks.google.com)",
          "GOOGLE_TASKS_ENABLED=true",
          "GOOGLE_TASKS_AUTH_MODE=oauth",
          `GOOGLE_TASKS_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`,
          "GOOGLE_TASKS_LIST_TITLE=Nesting Place Tasks",
        ];
        appendFileSync(envPath, `${lines.join("\n")}\n`);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Google Tasks connected</h1><p>You can close this tab and run npm run reset:migrate:google-tasks</p>");
        server.close();
        resolvePromise();
      } catch (error) {
        reject(error);
      }
    });

    server.listen(PORT, () => {
      console.log(`Waiting for OAuth callback on ${REDIRECT_URI} ...`);
    });
  });

  console.log("Saved refresh token to .env.local");
  console.log("Next: npm run reset:migrate:google-tasks");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
