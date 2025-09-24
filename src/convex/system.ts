import { query } from "./_generated/server";

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    // presence of env keys (node runtime isn't required for reading env in queries; Convex injects secrets via environment)
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const hasResend = !!process.env.RESEND_API_KEY;
    return {
      openrouter: hasOpenRouter,
      resend: hasResend,
    };
  },
});
