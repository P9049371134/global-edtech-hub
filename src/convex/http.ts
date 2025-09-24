// Add Node runtime directive required for httpAction + crypto usage
/* Node runtime is implied for httpAction; directive not allowed here */
/** Using Node APIs (crypto) inside httpAction handlers is supported without a directive */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import * as crypto from "node:crypto";

const http = httpRouter();

// Build OAuth URL
function buildGoogleAuthUrl(userId: string) {
  const base = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams();
  params.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  params.set("redirect_uri", process.env.GOOGLE_REDIRECT_URI || "");
  params.set("response_type", "code");
  params.set(
    "scope",
    [
      "https://www.googleapis.com/auth/classroom.courses.readonly",
      "https://www.googleapis.com/auth/classroom.rosters.readonly",
      "https://www.googleapis.com/auth/classroom.coursework.me",
      "https://www.googleapis.com/auth/calendar.events",
      "openid",
      "email",
      "profile",
    ].join(" ")
  );
  params.set("access_type", "offline");
  params.set("prompt", "consent");
  // simple state includes userId and nonce (no Node-only APIs)
  const nonce = Math.random().toString(36).slice(2);
  const state = encodeURIComponent(JSON.stringify({ userId, nonce, ts: Date.now() }));
  params.set("state", state);
  return `${base}?${params.toString()}`;
}

// GET /api/integrations/google/start?userId=...
http.route({
  path: "/api/integrations/google/start",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return new Response("Missing userId", { status: 400 });
    const redirect = buildGoogleAuthUrl(userId);
    return Response.redirect(redirect, 302);
  }),
});

// GET /api/integrations/google/oauth/callback
http.route({
  path: "/api/integrations/google/oauth/callback",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return new Response("Missing params", { status: 400 });
    try {
      await ctx.runAction(internal.googleHttpActions.exchangeCodeAndStore, {
        code,
        state,
      });
      return Response.redirect("/dashboard?integration=google_connected", 302);
    } catch (e: any) {
      return new Response(`OAuth error: ${e?.message ?? "unknown"}`, { status: 500 });
    }
  }),
});

// Helper to ensure access token (refresh if needed)
async function ensureAccessToken(
  ctx: any,
  tokenRow: any
): Promise<{ access: string; tokenId: string }> {
  // Inline helpers to avoid cross-file deps
  function getKey() {
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
  function decryptStr(token: string): string {
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
  function encryptStr(text: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
  }

  const now = Date.now();
  if (tokenRow.expiresAt - now > 60_000 && tokenRow.accessTokenEncrypted) {
    // Decrypt still-valid access token
    return { access: decryptStr(tokenRow.accessTokenEncrypted), tokenId: tokenRow._id };
  }

  // Refresh using decrypted refresh token
  const refresh = decryptStr(tokenRow.refreshTokenEncrypted);
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
  const newAccessEnc = encryptStr(data.access_token);
  const newExpiresAt = Date.now() + data.expires_in * 1000;

  await ctx.runMutation(internal.googleInternal.updateAccessToken, {
    tokenId: tokenRow._id,
    newAccessTokenEncrypted: newAccessEnc,
    newExpiresAt,
  });

  return { access: data.access_token, tokenId: tokenRow._id };
}

// GET /api/integrations/google/classrooms?userId=...
http.route({
  path: "/api/integrations/google/classrooms",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return new Response("Missing userId", { status: 400 });
    const token = await ctx.runQuery(internal.googleInternal.getGoogleTokenByUser, { userId: userId as any });
    if (!token) return new Response(JSON.stringify({ error: "not connected" }), { status: 403 });
    const { access } = await ensureAccessToken(ctx, token);
    const resp = await fetch("https://classroom.googleapis.com/v1/courses", {
      headers: { Authorization: `Bearer ${access}` },
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  }),
});

// POST /api/integrations/google/classrooms/import  body: { userId, providerCourseId, title, description }
http.route({
  path: "/api/integrations/google/classrooms/import",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const { userId, providerCourseId, title, description } = await req.json();
    if (!userId || !providerCourseId || !title)
      return new Response("Missing fields", { status: 400 });
    await ctx.runMutation(internal.googleInternal.upsertExternalClassroom, {
      provider: "google",
      providerCourseId,
      title,
      description,
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }),
});

// POST /api/integrations/google/schedule-meet  body: { userId, sessionId, title, start, end }
http.route({
  path: "/api/integrations/google/schedule-meet",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const { userId, sessionId, title, start, end } = body || {};
    if (!userId || !sessionId || !title || !start || !end)
      return new Response("Missing fields", { status: 400 });
    const token = await ctx.runQuery(internal.googleInternal.getGoogleTokenByUser, { userId: userId as any });
    if (!token) return new Response(JSON.stringify({ error: "not connected" }), { status: 403 });
    const { access } = await ensureAccessToken(ctx, token);
    const event = {
      summary: title,
      start: { dateTime: start },
      end: { dateTime: end },
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
      return new Response(`Calendar error: ${t}`, { status: 500 });
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
      sessionId: sessionId as any,
      scheduledAt: new Date(start).getTime(),
      createdBy: userId as any,
    });
    return new Response(JSON.stringify({ meetUrl, eventId: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;