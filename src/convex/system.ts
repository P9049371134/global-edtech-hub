import { query } from "./_generated/server";
import { v } from "convex/values";

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasResend = !!process.env.RESEND_API_KEY;

    // Existing env presence checks
    const hasGoogleEnv =
      !!process.env.GOOGLE_CLIENT_ID ||
      !!process.env.GOOGLE_CLIENT_SECRET ||
      !!process.env.GOOGLE_REDIRECT_URI;

    const hasZoom =
      !!(process.env as any).ZOOM_CLIENT_ID ||
      !!(process.env as any).ZOOM_CLIENT_SECRET;

    const hasYouTube =
      !!process.env.YOUTUBE_CLIENT_ID || !!process.env.YOUTUBE_CLIENT_SECRET;

    // New: check stored token existence
    let googleConnected = false;
    // Safe query: take(1) to avoid scans
    const anyGoogleToken = await ctx.db
      .query("tokens")
      .withIndex("by_user_and_provider", (q) => q) // cannot filter user here without id; we'll just look for any row by scanning minimal
      .take(1);
    // Filter client-side for provider === "google" from the 1 taken (cheap op)
    googleConnected = anyGoogleToken.some((t: any) => t.provider === "google");

    return {
      openrouter: hasOpenRouter,
      resend: hasResend,
      google: hasGoogleEnv || googleConnected,
      zoom: hasZoom,
      youtube: hasYouTube,
    };
  },
});