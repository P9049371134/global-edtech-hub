import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const listClassroomRecipients = internalQuery({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    // Get enrollments for the classroom
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const recipients: Array<{ email: string; name: string }> = [];
    for (const e of enrollments) {
      const user = await ctx.db.get(e.studentId);
      if (user?.email) {
        recipients.push({ email: user.email, name: user.name ?? "Student" });
      }
    }
    return recipients;
  },
});
