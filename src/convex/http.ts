// Add Node runtime directive required for httpAction + crypto usage
/* Node runtime is implied for httpAction; directive not allowed here */
/** Using Node APIs (crypto) inside httpAction handlers is supported without a directive */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

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

/* Removed Node crypto usage and token handling from http.ts to avoid Node APIs in http runtime.
   All Google token and API operations are delegated to internal googleHttpActions. */

/* GET /api/integrations/google/classrooms?userId=... */
http.route({
  path: "/api/integrations/google/classrooms",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return new Response("Missing userId", { status: 400 });
    try {
      const data = await ctx.runAction(internal.googleHttpActions.listCourses, { userId: userId as any });
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
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

/* POST /api/integrations/google/schedule-meet  body: { userId, sessionId, title, start, end } */
http.route({
  path: "/api/integrations/google/schedule-meet",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json();
    const { userId, sessionId, title, start, end } = body || {};
    if (!userId || !sessionId || !title || !start || !end) {
      return new Response("Missing fields", { status: 400 });
    }
    try {
      const result = await ctx.runAction(internal.googleHttpActions.scheduleMeet, {
        userId: userId as any,
        sessionId: sessionId as any,
        title,
        start,
        end,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// Add: Transcript export endpoint (download .txt)
http.route({
  path: "/api/transcripts/export",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const transcriptId = url.searchParams.get("transcriptId");
    if (!transcriptId) {
      return new Response("Missing transcriptId", { status: 400 });
    }
    try {
      const doc: any = await ctx.runQuery(api.transcription.getById, {
        transcriptId: transcriptId as any,
      });
      if (!doc) {
        return new Response("Not found", { status: 404 });
      }
      const content =
        Array.isArray(doc.chunks)
          ? (doc.chunks as any[])
              .map((c) => (c.translated ?? c.text))
              .join("\n")
          : "";

      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="transcript_${doc._id}.txt"`,
        },
      });
    } catch (e: any) {
      return new Response(`Error: ${e?.message ?? "unknown"}`, { status: 500 });
    }
  }),
});

export default http;