import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx } from "./_generated/server";

/**
 * Get the current signed in user. Returns null if the user is not signed in.
 * Usage: const signedInUser = await ctx.runQuery(api.authHelpers.currentUser);
 * THIS FUNCTION IS READ-ONLY. DO NOT MODIFY.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    if (user === null) {
      return null;
    }

    return user;
  },
});

/**
 * Use this function internally to get the current user data. Remember to handle the null user case.
 * @param ctx
 * @returns
 */
export const getCurrentUser = async (ctx: QueryCtx) => {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  return await ctx.db.get(userId);
};

// List users (admin only)
import { v } from "convex/values";

// Add: listUsers
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me || me.role !== "admin") return [];
    // Note: simple list for admin; add pagination later if needed
    const q = ctx.db.query("users");
    const out: any[] = [];
    for await (const u of q) out.push(u);
    return out;
  },
});

// Add: updateUserRole
export const updateUserRole = mutation({
  args: { userId: v.id("users"), role: v.union(v.literal("admin"), v.literal("user"), v.literal("member"), v.literal("teacher"), v.literal("student")) },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me || me.role !== "admin") throw new Error("Unauthorized");
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// Add: setUserActive
export const setUserActive = mutation({
  args: { userId: v.id("users"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me || me.role !== "admin") throw new Error("Unauthorized");
    await ctx.db.patch(args.userId, { isActive: args.isActive });
  },
});