"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import * as crypto from "node:crypto";

// Encryption helpers (AES-256-GCM) using TOKEN_ENCRYPTION_KEY (hex/base64, 32 bytes)
function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY || "";
  if (!raw) throw new Error("Missing TOKEN_ENCRYPTION_KEY");
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length === 64) return Buffer.from(raw, "hex");
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes (hex or base64)");
  return buf;
}
function encrypt(plain: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}
function decrypt(token: string): string {
  const [ivB64, tagB64, dataB64] = token.split(".");
  const key = getKey();
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

function parseIdTokenSub(id_token?: string | null): string | null {
  if (!id_token) return null;
  try {
    const parts = id_token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// Action: exchange OAuth code for tokens
export const exchangeOAuthCode = internalAction({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const body = new URLSearchParams();
    body.set("code", args.code);
    body.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
    body.set("client_secret", process.env.GOOGLE_CLIENT_SECRET || "");
    body.set("redirect_uri", process.env.GOOGLE_REDIRECT_URI || "");
    body.set("grant_type", "authorization_code");
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`token exchange failed: ${resp.status} ${t}`);
    }
    const data = (await resp.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      id_token?: string;
    };
    return data;
  },
});

// Action: save tokens securely (encrypt + upsert via mutation)
export const saveOAuthTokens = internalAction({
  args: {
    userId: v.id("users"),
    tokenResponse: v.object({
      access_token: v.string(),
      refresh_token: v.optional(v.string()),
      expires_in: v.number(),
      id_token: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, tokenResponse } = args;
    const providerUserId = parseIdTokenSub(tokenResponse.id_token) || "google-user";
    const accessEnc = encrypt(tokenResponse.access_token);
    const refreshEnc = encrypt(tokenResponse.refresh_token || "");
    const expiresAt = Date.now() + tokenResponse.expires_in * 1000;

    await ctx.runMutation(internal.googleInternal.upsertGoogleToken, {
      userId,
      providerUserId,
      accessTokenEncrypted: accessEnc,
      refreshTokenEncrypted: refreshEnc,
      expiresAt,
      scopes: [],
    });
    return { ok: true };
  },
});

// Action: ensure valid access token for a user (refresh if needed)
export const ensureAccessTokenForUser = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.googleInternal.getGoogleTokenByUser, { userId: args.userId });
    if (!token) {
      return { access: "", ok: false as const };
    }
    const now = Date.now();
    if (token.expiresAt - now > 60_000) {
      return { access: decrypt(token.accessTokenEncrypted), ok: true as const };
    }
    const refresh = decrypt(token.refreshTokenEncrypted);
    const body = new URLSearchParams();
    body.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
    body.set("client_secret", process.env.GOOGLE_CLIENT_SECRET || "");
    body.set("refresh_token", refresh);
    body.set("grant_type", "refresh_token");
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`refresh failed: ${resp.status} ${t}`);
    }
    const data = (await resp.json()) as { access_token: string; expires_in: number };
    const newAccessEnc = encrypt(data.access_token);
    const newExpiresAt = Date.now() + data.expires_in * 1000;
    await ctx.runMutation(internal.googleInternal.updateAccessToken, {
      tokenId: token._id,
      newAccessTokenEncrypted: newAccessEnc,
      newExpiresAt,
    });
    return { access: data.access_token, ok: true as const };
  },
});
