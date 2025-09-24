import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Generate performance report
export const generateReport = mutation({
  args: {
    studentId: v.optional(v.id("users")),
    classroomId: v.id("classrooms"),
    reportType: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("semester"),
      v.literal("custom")
    ),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be authenticated");

    const targetStudentId = args.studentId || user._id;

    // Calculate attendance rate
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .filter((q) => 
        q.gte(q.field("startTime"), args.startDate) && 
        q.lte(q.field("startTime"), args.endDate)
      )
      .collect();

    const attendanceRecords = [];
    for (const session of sessions) {
      const attendance = await ctx.db
        .query("attendance")
        .withIndex("by_session_and_student", (q) =>
          q.eq("sessionId", session._id).eq("studentId", targetStudentId)
        )
        .unique();
      if (attendance) attendanceRecords.push(attendance);
    }

    const attendanceRate = sessions.length > 0 ? 
      (attendanceRecords.length / sessions.length) * 100 : 0;

    // Calculate average session duration
    const totalDuration = attendanceRecords.reduce(
      (sum, record) => sum + (record.duration || 0), 0
    );
    const averageSessionDuration = attendanceRecords.length > 0 ? 
      totalDuration / attendanceRecords.length : 0;

    // Count notes in time window using index
    const notesInPeriod = await ctx.db
      .query("notes")
      .withIndex("by_user_and_createdAt", (q) =>
        q
          .eq("userId", targetStudentId)
          .gte("createdAt", args.startDate)
          .lte("createdAt", args.endDate),
      )
      .collect();

    // Generate insights
    const strengths = [];
    const improvements = [];

    if (attendanceRate >= 80) {
      strengths.push("Excellent attendance record");
    } else if (attendanceRate < 60) {
      improvements.push("Improve class attendance");
    }

    if (notesInPeriod.length >= 5) {
      strengths.push("Active note-taking");
    } else {
      improvements.push("Take more detailed notes");
    }

    if (averageSessionDuration >= 45) {
      strengths.push("Good session engagement");
    } else {
      improvements.push("Stay engaged for full sessions");
    }

    return await ctx.db.insert("reports", {
      studentId: targetStudentId,
      classroomId: args.classroomId,
      reportType: args.reportType,
      startDate: args.startDate,
      endDate: args.endDate,
      attendanceRate,
      participationScore: Math.min(100, attendanceRate + (notesInPeriod.length * 5)),
      notesCount: notesInPeriod.length,
      averageSessionDuration,
      strengths,
      improvements,
      generatedAt: Date.now(),
    });
  },
});

// Get reports for a student
export const getStudentReports = query({
  args: { studentId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const targetStudentId = args.studentId || user._id;

    // Teachers can view any student's reports, students can only view their own
    if (user.role !== "teacher" && user.role !== "admin" && targetStudentId !== user._id) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("reports")
      .withIndex("by_student", (q) => q.eq("studentId", targetStudentId))
      .order("desc")
      .collect();
  },
});

// Get classroom reports (for teachers)
export const getClassroomReports = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      throw new Error("Only teachers can view classroom reports");
    }

    return await ctx.db
      .query("reports")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .order("desc")
      .collect();
  },
});