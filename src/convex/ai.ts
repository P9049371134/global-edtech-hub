"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const summarizeNoteAction = internalAction({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return;

    const note = await ctx.runQuery(internal.aiInternal.getNoteMinimal, {
      noteId: args.noteId,
    });
    if (!note) return;

    // Build a concise prompt
    const prompt = `
You are an educational assistant. Summarize the student's note into a concise paragraph and 3-5 key bullet points.

Title: ${note.title}
Language: ${note.language}
Content:
${note.content}
`;

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://global-edtech-hub.local",
        "X-Title": "Global EdTech Hub",
      },
      body: JSON.stringify({
        model: "openrouter/auto",
        messages: [
          { role: "system", content: "You are a helpful education assistant." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const data = await res.json().catch(() => null);
    const text: string =
      data?.choices?.[0]?.message?.content ??
      "Summary not available. Please try again.";

    // Heuristic split: first paragraph as summary, lines after as bullets
    const parts = text.split("\n").filter((l: string) => l.trim().length > 0);
    const summary = parts[0].replace(/^\s*summary\s*[:\-]\s*/i, "").trim();
    const keyPoints = parts
      .slice(1)
      .map((l: string) => l.replace(/^[\-\*\d\.\s]+/, "").trim())
      .filter((l: string) => l.length > 0)
      .slice(0, 5);

    await ctx.runMutation(internal.aiInternal.applyNoteSummary, {
      noteId: args.noteId,
      summary,
      keyPoints: keyPoints.length ? keyPoints : ["Review core concepts", "Practice exercises", "Clarify doubts"],
      confidence: 0.9,
    });
  },
});
