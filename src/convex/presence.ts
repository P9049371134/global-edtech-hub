import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Query online users in a channel (lastSeen within N ms)
export const online = query({
  args: { channel: v.string(), windowMs: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const windowMs = args.windowMs ?? 120_000; // 2 minutes
    const cutoff = Date.now() - windowMs;

    const rows = await ctx.db
      .query("presence")
      .withIndex("by_channel_and_lastSeen", (q) =>
        q.eq("channel", args.channel).gte("lastSeen", cutoff),
      )
      .collect();

    // Return unique users by userId
    const seen = new Set<string>();
    const unique = [];
    for (const row of rows) {
      const key = row.userId as unknown as string;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push({ userId: row.userId, name: row.name, lastSeen: row.lastSeen });
      }
    }
    return unique;
  },
});

// Ping presence (upsert for current user in a channel)
export const ping = mutation({
  args: { channel: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return; // silently ignore for unauthenticated users

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_channel_and_user", (q) =>
        q.eq("channel", args.channel).eq("userId", user._id),
      )
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: now, name: existing.name ?? user.name ?? "User" });
    } else {
      await ctx.db.insert("presence", {
        channel: args.channel,
        userId: user._id,
        name: user.name ?? "User",
        lastSeen: now,
      });
    }
  },
});
