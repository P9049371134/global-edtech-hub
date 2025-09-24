import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

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
