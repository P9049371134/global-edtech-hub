import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Minimal note fetch for actions
export const getNoteMinimal = internalQuery({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note) return null;
    return {
      _id: note._id,
      userId: note.userId,
      title: note.title,
      content: note.content,
      language: note.language,
    };
  },
});

export const applyNoteSummary = internalMutation({
  args: {
    noteId: v.id("notes"),
    summary: v.string(),
    keyPoints: v.array(v.string()),
    confidence: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      summary: args.summary,
      keyPoints: args.keyPoints,
      confidence: args.confidence,
    });
  },
});
