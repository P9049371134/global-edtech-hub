"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const sendSessionStartEmails = action({
  args: {
    classroomId: v.id("classrooms"),
    sessionTitle: v.string(),
    teacherName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return; // optional feature

    const recipients = await ctx.runQuery(
      internal.notificationsInternal.listClassroomRecipients,
      { classroomId: args.classroomId }
    );

    if (recipients.length === 0) return;

    const subject = `Live session started: ${args.sessionTitle}`;
    const from = "noreply@resend.dev";
    const html = `
      <div>
        <p>Hello,</p>
        <p>A live session has just started${args.teacherName ? ` by <b>${args.teacherName}</b>` : ""}: <b>${args.sessionTitle}</b>.</p>
        <p>Join from your dashboard.</p>
        <p>— Global EdTech Hub</p>
      </div>
    `;

    // Send individually to avoid exposing emails
    for (const r of recipients) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: r.email,
          subject,
          html,
        }),
      }).catch(() => {});
    }
  },
});
