/** Using Node APIs (crypto) inside httpAction handlers is supported without a directive */
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

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
  // simple state includes userId and nonce
  // Generate a simple random nonce without Node crypto
  const nonce = Math.random().toString(36).slice(2);
  const state = Buffer.from(
    JSON.stringify({ userId, nonce, ts: Date.now() }),
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
    let userId: string | null = null;
    try {
      const { userId: uid } = JSON.parse(Buffer.from(state, "base64").toString("utf8"));
      userId = uid;
    } catch {
      return new Response("Invalid state", { status: 400 });
    }
    try {
      // Exchange code and securely store tokens via Node action
      const tokenResp = await ctx.runAction(internal.googleNode.exchangeOAuthCode, { code });
      await ctx.runAction(internal.googleNode.saveOAuthTokens, {
        userId: userId as any,
        tokenResponse: tokenResp,
      });
      return Response.redirect("/dashboard?integration=google_connected", 302);
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
    const token = await ctx.runQuery(internal.googleInternal.getGoogleTokenByUser, { userId: userId as any });
    if (!token) return new Response(JSON.stringify({ error: "not connected" }), { status: 403 });
    const { access } = await ctx.runAction(internal.googleNode.ensureAccessTokenForUser, { userId: userId as any });
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
    const { access } = await ctx.runAction(internal.googleNode.ensureAccessTokenForUser, { userId: userId as any });
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
      sessionId,
      scheduledAt: new Date(start).getTime(),
      createdBy: userId,
    });
    return new Response(JSON.stringify({ meetUrl, eventId: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;