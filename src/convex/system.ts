import { query } from "./_generated/server";
/* removed unused import */

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
    // Check the most recent token (descending) to infer connectivity without invalid index usage
    const latestToken = await ctx.db
      .query("tokens")
      .order("desc")
      .take(1);
    googleConnected = latestToken.some((t: any) => t.provider === "google");

    return {
      openrouter: hasOpenRouter,
      resend: hasResend,
      google: hasGoogleEnv || googleConnected,
      zoom: hasZoom,
      youtube: hasYouTube,
    };
  },
});