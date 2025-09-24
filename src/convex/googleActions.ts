"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import * as crypto from "node:crypto";
import { v } from "convex/values";

// Helpers: encryption using TOKEN_ENCRYPTION_KEY (hex or base64, 32 bytes)
function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY || "";
  if (!raw) throw new Error("Missing TOKEN_ENCRYPTION_KEY");
  if (/^[0-9a-fA-F]+$/.test(raw) && raw.length === 64) {
    return Buffer.from(raw, "hex");
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes (hex or base64)");
  }
  return buf;
}
function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
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

// Parse ID token payload.sub
function parseIdTokenSub(id_token: string): string | null {
  try {
    const parts = id_token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf8"));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

// Exchange OAuth code and store encrypted tokens
export const exchangeOAuthCode = internalAction({
  args: { code: v.string(), stateB64: v.string() },
  handler: async (ctx, args) => {
    // add narrow type to parsed state to satisfy TS
    const state = JSON.parse(Buffer.from(args.stateB64, "base64").toString("utf8")) as { userId?: string };
    const userId: string | undefined = state?.userId;
    if (!userId) throw new Error("Missing userId in state");

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
    const tokenResp = (await resp.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      id_token?: string;
    };

    const providerUserId = tokenResp.id_token ? parseIdTokenSub(tokenResp.id_token) : "google-user";
    const accessEnc = encrypt(tokenResp.access_token);
    const refreshEnc = encrypt(tokenResp.refresh_token || "");
    const expiresAt = Date.now() + tokenResp.expires_in * 1000;

    await ctx.runMutation(internal.googleInternal.upsertGoogleToken, {
      userId: userId as any,
      providerUserId: providerUserId || "google-user",
      accessTokenEncrypted: accessEnc,
      refreshTokenEncrypted: refreshEnc,
      expiresAt,
      scopes: [],
    });

    return { ok: true };
  },
});

// Ensure valid access token (refresh if needed)
async function ensureAccessToken(ctx: any, tokenRow: any): Promise<{ access: string; tokenId: string }> {
  const now = Date.now();
  if (tokenRow.expiresAt - now > 60_000) {
    return { access: decrypt(tokenRow.accessTokenEncrypted), tokenId: tokenRow._id };
  }
  const refresh = decrypt(tokenRow.refreshTokenEncrypted);
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
    tokenId: tokenRow._id,
    newAccessTokenEncrypted: newAccessEnc,
    newExpiresAt,
  });
  return { access: data.access_token, tokenId: tokenRow._id };
}

// List Google Classroom courses
export const listClassrooms = internalAction({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.googleInternal.getGoogleTokenByUser, { userId: args.userId as any });
    if (!token) return { error: "not connected" };

    const { access } = await ensureAccessToken(ctx, token);
    const resp = await fetch("https://classroom.googleapis.com/v1/courses", {
      headers: { Authorization: `Bearer ${access}` },
    });
    const data = await resp.json();
    return data;
  },
});

// Schedule Google Meet (Calendar event)
export const scheduleMeet = internalAction({
  args: {
    userId: v.string(),
    sessionId: v.string(),
    title: v.string(),
    start: v.string(),
    end: v.string(),
  },
  handler: async (ctx, args) => {
    const token = await ctx.runQuery(internal.googleInternal.getGoogleTokenByUser, { userId: args.userId as any });
    if (!token) throw new Error("not connected");

    const { access } = await ensureAccessToken(ctx, token);
    const event = {
      summary: args.title,
      start: { dateTime: args.start },
      end: { dateTime: args.end },
      conferenceData: { createRequest: { requestId: `meet-${Date.now()}` } },
    };
    const resp = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`Calendar error: ${t}`);
    }
    const data: any = await resp.json();
    const meetUrl =
      data?.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === "video")?.uri ||
      data?.hangoutLink ||
      "";

    await ctx.runMutation(internal.googleInternal.insertMeeting, {
      provider: "google",
      providerMeetingId: data.id,
      providerMeetingUrl: meetUrl,
      sessionId: args.sessionId as any,
      scheduledAt: new Date(args.start).getTime(),
      createdBy: args.userId as any,
    });

    return { meetUrl, eventId: data.id };
  },
});