// Add Node runtime directive required for httpAction + crypto usage
/* Node runtime is implied for httpAction; directive not allowed here */
/** Using Node APIs (crypto) inside httpAction handlers is supported without a directive */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

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
      await ctx.runAction(internal.googleActions.exchangeOAuthCode, {
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
  const now = Date.now();
  if (tokenRow.expiresAt - now > 60_000) {
    return { access: tokenRow.accessTokenEncrypted, tokenId: tokenRow._id };
  }
  // refresh
  const refresh = tokenRow.refreshTokenEncrypted;
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
  const newAccess = data.access_token;
  const newExpiresAt = Date.now() + data.expires_in * 1000;
  await ctx.runMutation(internal.googleInternal.updateAccessToken, {
    tokenId: tokenRow._id,
    newAccessTokenEncrypted: newAccess,
    newExpiresAt,
  });
  return { access: newAccess, tokenId: tokenRow._id };
}

 // GET /api/integrations/google/classrooms?userId=...
http.route({
  path: "/api/integrations/google/classrooms",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return new Response("Missing userId", { status: 400 });
    const data = await ctx.runAction(internal.googleActions.listClassrooms, { userId });
    const status = (data as any)?.error ? 403 : 200;
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
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

    try {
      const result = await ctx.runAction(internal.googleActions.scheduleMeet, {
        userId,
        sessionId,
        title,
        start,
        end,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(`Calendar error: ${e?.message ?? "unknown"}`, { status: 500 });
    }
  }),
});

 // ADD: Transcript TXT export route
http.route({
  path: "/api/transcripts/:id.txt",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) return new Response("Missing id", { status: 400 });

    try {
      const result: any = await ctx.runQuery(api.transcription.getById, {
        transcriptId: id as any,
      });

      if (!result) return new Response("Not found", { status: 404 });

      const lines = (Array.isArray(result.chunks) ? result.chunks : []) as Array<any>;
      const joinTxt = lines
        .map((c: any) => {
          const time = new Date(c.ts).toISOString();
          const base = `[${time}] ${c.text}`;
          if (c.translated) return `${base}\n[translated] ${c.translated}`;
          return base;
        })
        .join("\n");

      return new Response(joinTxt, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch (e: any) {
      return new Response(`Error: ${e?.message ?? "unknown"}`, { status: 500 });
    }
  }),
});

export default http;