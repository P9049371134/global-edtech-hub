import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Build OAuth URL (no Node-only imports here)
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
  // simple state includes userId and a nonce
  const state = Buffer.from(
    JSON.stringify({ userId, nonce: Math.random().toString(36).slice(2), ts: Date.now() }),
    "utf8"
  ).toString("base64");
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
    return new Response(null, { status: 302, headers: { Location: redirect } });
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
      await ctx.runAction(internal.googleHttpActions.exchangeCodeAndStore, { code, state });
      return new Response(null, {
        status: 302,
        headers: { Location: "/dashboard?integration=google_connected" },
      });
    } catch (e: any) {
      return new Response(`OAuth error: ${e?.message ?? "unknown"}`, { status: 500 });
    }
  }),
});

// GET /api/integrations/google/classrooms?userId=...
http.route({
  path: "/api/integrations/google/classrooms",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return new Response("Missing userId", { status: 400 });
    const data = await ctx.runAction(internal.googleHttpActions.listCourses, { userId: userId as any });
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
    try {
      const res = await ctx.runAction(internal.googleHttpActions.scheduleMeet, {
        userId,
        sessionId,
        title,
        start,
        end,
      });
      return new Response(JSON.stringify(res), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
      return new Response(e?.message ?? "error", { status: 500 });
    }
  }),
});

export default http;