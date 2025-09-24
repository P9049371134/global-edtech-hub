import { query } from "./_generated/server";

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasResend = !!process.env.RESEND_API_KEY;

    // New: surface common integration keys presence
    const hasGoogle =
      !!process.env.GOOGLE_CLIENT_ID ||
      !!process.env.GOOGLE_CLIENT_SECRET ||
      !!process.env.GOOGLE_REDIRECT_URI;

    const hasZoom =
      !!(process.env as any).ZOOM_CLIENT_ID ||
      !!(process.env as any).ZOOM_CLIENT_SECRET;

    const hasYouTube =
      !!process.env.YOUTUBE_CLIENT_ID || !!process.env.YOUTUBE_CLIENT_SECRET;

    return {
      openrouter: hasOpenRouter,
      resend: hasResend,
      google: hasGoogle,
      zoom: hasZoom,
      youtube: hasYouTube,
    };
  },
});