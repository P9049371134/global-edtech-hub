import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Helper to extract YouTube video ID from common URL formats
function extractYouTubeId(input: string): string | null {
  try {
    const url = new URL(input);
    if (url.hostname.includes("youtube.com")) {
      const vParam = url.searchParams.get("v");
      if (vParam) return vParam;
      // youtu.be embed or /shorts not handled here
    }
    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "");
      return id || null;
    }
    // Fallback: if a bare ID is passed
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    return null;
  } catch {
    // Not a URL, might be a bare ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
    return null;
  }
}

// List videos for a session
export const listForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

// Add: list videos for many sessions in one call to avoid multiple hooks on the client
export const listForSessions = query({
  args: { sessionIds: v.array(v.id("sessions")) },
  handler: async (ctx, args) => {
    const map: Record<string, any[]> = {};
    for (const id of args.sessionIds) {
      const rows = await ctx.db
        .query("videos")
        .withIndex("by_session", (q) => q.eq("sessionId", id))
        .order("desc")
        .collect();
      map[id as any] = rows;
    }
    return map;
  },
});

// Attach a YouTube video to a session (teacher or admin only)
export const addToSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    urlOrId: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Must be authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const isOwner = session.teacherId === me._id;
    const isAdmin = me.role === "admin";
    if (!isOwner && !isAdmin) throw new Error("Unauthorized");

    const videoId = extractYouTubeId(args.urlOrId);
    if (!videoId) throw new Error("Invalid YouTube URL or ID");

    const title = args.title ?? undefined;
    const now = Date.now();

    // Idempotent-ish: avoid duplicates for same session + videoId
    const existing = await ctx.db
      .query("videos")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    if (existing.some((v) => v.videoId === videoId)) {
      return null;
    }

    await ctx.db.insert("videos", {
      provider: "youtube",
      videoId,
      title,
      sessionId: args.sessionId,
      classroomId: undefined,
      addedBy: me._id,
      addedAt: now,
    });

    return null;
  },
});

// Remove a video from a session (teacher or admin only)
export const removeFromSession = mutation({
  args: { videoId: v.id("videos") },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Must be authenticated");

    const vid = await ctx.db.get(args.videoId);
    if (!vid) return;

    // Only videos attached to sessions are handled here
    if (!vid.sessionId) throw new Error("Not a session video");

    const session = await ctx.db.get(vid.sessionId);
    if (!session) throw new Error("Session not found");

    const isOwner = session.teacherId === me._id;
    const isAdmin = me.role === "admin";
    if (!isOwner && !isAdmin) throw new Error("Unauthorized");

    await ctx.db.delete(args.videoId);
  },
});