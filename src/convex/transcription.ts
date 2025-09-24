import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Schema-side types (kept minimal here)
// chunks: { ts: number; text: string; translated?: string }

// Public: return null so UI falls back to client-side transcript
export const getLiveForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    // Intentionally return null; server transcript is optional
    return null;
  },
});

// Public: no-op start; exists to satisfy UI calls when enabled by teachers/admins in the future
export const start = mutation({
  args: {
    sessionId: v.id("sessions"),
    sourceLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    // No-op for now
  },
});

/* Fix: correct transcriptId types to point to the transcripts table */
export const appendChunk = mutation({
  args: { transcriptId: v.id("transcripts"), text: v.string() },
  handler: async (ctx, args) => {
    // No-op for now
  },
});

// Public: no-op stop
export const stop = mutation({
  args: { transcriptId: v.id("transcripts") },
  handler: async (ctx, args) => {
    // No-op for now
  },
});

// Public: no-op set target language
export const setTargetLanguage = mutation({
  args: { transcriptId: v.id("transcripts"), targetLanguage: v.string() },
  handler: async (ctx, args) => {
    // No-op for now
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