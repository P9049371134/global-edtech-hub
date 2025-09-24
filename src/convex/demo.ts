import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Mock translation: echoes text with a prefix and target language
export const translateMock = mutation({
  args: {
    text: v.string(),
    toLanguage: v.string(),
  },
  handler: async (ctx, args) => {
    const translated = `TRANSLATED (${args.toLanguage.toUpperCase()}): ${args.text}`;
    return { translated };
  },
});

// Mock summarization: returns first ~20 words with a prefix
export const summarizeMock = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const words = args.text.split(/\s+/).filter(Boolean);
    const summary = `SUMMARY: ${words.slice(0, 20).join(" ")}${words.length > 20 ? "..." : ""}`;
    return { summary };
  },
});
