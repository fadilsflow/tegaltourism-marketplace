import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [
    adminClient()
  ],
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: process.env.BETTER_AUTH_URL,
  cookiePrefix: "ba_", // match your server config if customized
});
