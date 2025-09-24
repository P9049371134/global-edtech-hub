import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Upsert Google token for a user
export const upsertGoogleToken = internalMutation({
  args: {
    userId: v.id("users"),
    providerUserId: v.string(),
    accessTokenEncrypted: v.string(),
    refreshTokenEncrypted: v.string(),
    expiresAt: v.number(),
    scopes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tokens")
      .withIndex("by_user_and_provider", (q) => q.eq("userId", args.userId).eq("provider", "google"))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        providerUserId: args.providerUserId,
        accessTokenEncrypted: args.accessTokenEncrypted,
        refreshTokenEncrypted: args.refreshTokenEncrypted,
        expiresAt: args.expiresAt,
        scopes: args.scopes,
        updatedAt: now,
      });
      return existing._id;
    }
    const id = await ctx.db.insert("tokens", {
      userId: args.userId,
      provider: "google",
      providerUserId: args.providerUserId,
      accessTokenEncrypted: args.accessTokenEncrypted,
      refreshTokenEncrypted: args.refreshTokenEncrypted,
      expiresAt: args.expiresAt,
      scopes: args.scopes ?? [],
      updatedAt: now,
    });
    return id;
  },
});

// Get Google token by user
export const getGoogleTokenByUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("tokens")
      .withIndex("by_user_and_provider", (q) => q.eq("userId", args.userId).eq("provider", "google"))
      .unique();
    return token;
  },
});

// Update access token after refresh
export const updateAccessToken = internalMutation({
  args: { tokenId: v.id("tokens"), newAccessTokenEncrypted: v.string(), newExpiresAt: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, {
      accessTokenEncrypted: args.newAccessTokenEncrypted,
      expiresAt: args.newExpiresAt,
      updatedAt: Date.now(),
    });
  },
});

// Upsert external classroom
export const upsertExternalClassroom = internalMutation({
  args: {
    provider: v.literal("google"),
    providerCourseId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("classrooms_external")
      .withIndex("by_providerCourseId", (q) => q.eq("providerCourseId", args.providerCourseId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        provider: "google",
        title: args.title,
        description: args.description,
        syncedAt: now,
      });
      return existing._id;
    }
    const id = await ctx.db.insert("classrooms_external", {
      provider: "google",
      providerCourseId: args.providerCourseId,
      title: args.title,
      description: args.description,
      syncedAt: now,
    });
    return id;
  },
});

// Insert meeting record for session
export const insertMeeting = internalMutation({
  args: {
    provider: v.literal("google"),
    providerMeetingId: v.optional(v.string()),
    providerMeetingUrl: v.string(),
    sessionId: v.id("sessions"),
    scheduledAt: v.optional(v.number()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("meetings_external", {
      provider: "google",
      providerMeetingId: args.providerMeetingId,
      providerMeetingUrl: args.providerMeetingUrl,
      sessionId: args.sessionId,
      scheduledAt: args.scheduledAt,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
    return id;
  },
});
