import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get notes for a session
export const getSessionNotes = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("notes")
      .withIndex("by_session_and_user", (q) =>
        q.eq("sessionId", args.sessionId).eq("userId", user._id)
      )
      .collect();
  },
});

// Create a note
export const createNote = mutation({
  args: {
    sessionId: v.id("sessions"),
    title: v.string(),
    content: v.string(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be authenticated");

    return await ctx.db.insert("notes", {
      ...args,
      userId: user._id,
      isAiGenerated: false,
      createdAt: Date.now(),
    });
  },
});

// Generate AI summary for notes
export const generateNoteSummary = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be authenticated");

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    // Simulate AI summary generation
    const summary = `AI Summary: ${note.content.substring(0, 100)}...`;
    const keyPoints = [
      "Key concept discussed",
      "Important formula mentioned",
      "Assignment deadline noted",
    ];

    await ctx.db.patch(args.noteId, {
      summary,
      keyPoints,
      confidence: 0.85,
    });

    return { summary, keyPoints };
  },
});

// Get all notes for a user
export const getUserNotes = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});