import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getCurrentUser } from "./users";

// Admin: list recent messages by channel (default: global)
export const listRecentMessages = query({
  args: { channel: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me || me.role !== "admin") return [];
    const channel = args.channel ?? "global";
    return await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channel", channel))
      .order("desc")
      .take(50);
  },
});

// Admin: delete a message
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me || me.role !== "admin") throw new Error("Unauthorized");
    await ctx.db.delete(args.messageId);
  },
});

// List recent messages for a channel (latest first, capped to 50)
export const list = query({
  args: { channel: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("messages")
      .withIndex("by_channel", (q) => q.eq("channel", args.channel))
      .order("desc")
      .take(50);
    return rows;
  },
});

// Send a message (requires auth)
export const send = mutation({
  args: { channel: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be authenticated to send messages");

    const name = user.name ?? "User";
    await ctx.db.insert("messages", {
      channel: args.channel,
      userId: user._id,
      name,
      text: args.text.trim(),
    });
  },
});