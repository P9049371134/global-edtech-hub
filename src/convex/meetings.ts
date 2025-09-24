import { v } from "convex/values";
import { query } from "./_generated/server";

// Latest meeting for a session (e.g., Google Meet URL)
export const getForSession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("meetings_external")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .take(1);
    return rows[0] ?? null;
  },
});

// Add: list latest meeting for many sessions at once
export const listForSessions = query({
  args: { sessionIds: v.array(v.id("sessions")) },
  handler: async (ctx, args) => {
    const map: Record<string, any> = {};
    for (const id of args.sessionIds) {
      const rows = await ctx.db
        .query("meetings_external")
        .withIndex("by_session", (q) => q.eq("sessionId", id))
        .order("desc")
        .take(1);
      map[id as any] = rows[0] ?? null;
    }
    return map;
  },
});