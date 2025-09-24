import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Schema-side types (kept minimal here)
// chunks: { ts: number; text: string; translated?: string }

export const getLiveForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const live = await ctx.db
      .query("transcripts")
      .withIndex("by_session_and_live", (q) =>
        q.eq("sessionId", args.sessionId).eq("isLive", true)
      )
      .unique()
      .catch(() => null);
    return live ?? null;
  },
});

export const getById = query({
  args: { transcriptId: v.id("transcripts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.transcriptId);
  },
});

export const listForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcripts")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .collect();
  },
});

export const start = mutation({
  args: {
    sessionId: v.id("sessions"),
    sourceLanguage: v.string(),
    targetLanguage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Must be authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const isTeacher = (session as any)?.teacherId === me._id;
    const isAdmin = me.role === "admin";
    if (!isTeacher && !isAdmin) throw new Error("Only teacher or admin can start transcript");

    // If already live, return it
    const existing = await ctx.db
      .query("transcripts")
      .withIndex("by_session_and_live", (q) =>
        q.eq("sessionId", args.sessionId).eq("isLive", true)
      )
      .unique()
      .catch(() => null);
    if (existing) return existing._id;

    const id = await ctx.db.insert("transcripts", {
      sessionId: args.sessionId,
      createdBy: me._id,
      sourceLanguage: args.sourceLanguage,
      targetLanguage: args.targetLanguage,
      isLive: true,
      chunks: [],
      createdAt: Date.now(),
      // endedAt omitted
    } as any);
    return id;
  },
});

export const appendChunk = mutation({
  args: {
    transcriptId: v.id("transcripts"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Must be authenticated");
    const doc: any = await ctx.db.get(args.transcriptId);
    if (!doc) throw new Error("Transcript not found");
    if (!doc.isLive) return;

    // Optional "mock" translation display: prefix only, no external API calls.
    const translated =
      (doc.targetLanguage && doc.targetLanguage !== doc.sourceLanguage)
        ? `[${doc.targetLanguage}] ${args.text}`
        : undefined;

    const nextChunks = Array.isArray(doc.chunks) ? doc.chunks.slice() : [];
    nextChunks.push({ ts: Date.now(), text: args.text, ...(translated ? { translated } : {}) });

    await ctx.db.patch(args.transcriptId, { chunks: nextChunks });
  },
});

export const setTargetLanguage = mutation({
  args: {
    transcriptId: v.id("transcripts"),
    targetLanguage: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Must be authenticated");
    const doc: any = await ctx.db.get(args.transcriptId);
    if (!doc) throw new Error("Transcript not found");

    // Only transcript owner, teacher of session, or admin can change
    const session = await ctx.db.get(doc.sessionId);
    const isOwner = doc.createdBy === me._id;
    const isTeacher = session?.teacherId === me._id;
    const isAdmin = me.role === "admin";
    if (!isOwner && !isTeacher && !isAdmin) throw new Error("Unauthorized");

    await ctx.db.patch(args.transcriptId, {
      targetLanguage: args.targetLanguage ?? undefined,
    });
  },
});

export const stop = mutation({
  args: { transcriptId: v.id("transcripts") },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) throw new Error("Must be authenticated");
    const doc: any = await ctx.db.get(args.transcriptId);
    if (!doc) throw new Error("Transcript not found");
    if (!doc.isLive) return;

    const session = await ctx.db.get(doc.sessionId);
    const isOwner = doc.createdBy === me._id;
    const isTeacher = (session as any)?.teacherId === me._id;
    const isAdmin = me.role === "admin";
    if (!isOwner && !isTeacher && !isAdmin) throw new Error("Unauthorized");

    await ctx.db.patch(args.transcriptId, {
      isLive: false,
      endedAt: Date.now(),
    });
  },
});