import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get sessions for a classroom
export const getClassroomSessions = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .order("desc")
      .collect();
  },
});

// Start a live session
export const startSession = mutation({
  args: {
    classroomId: v.id("classrooms"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      throw new Error("Only teachers can start sessions");
    }

    return await ctx.db.insert("sessions", {
      classroomId: args.classroomId,
      teacherId: user._id,
      title: args.title,
      startTime: Date.now(),
      isLive: true,
      attendeeCount: 0,
    });
  },
});

// End a live session
export const endSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be authenticated");

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.teacherId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.sessionId, {
      endTime: Date.now(),
      isLive: false,
    });
  },
});

// Join a session (for attendance tracking)
export const joinSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be authenticated");

    // Check if already joined
    const existingAttendance = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_student", (q) =>
        q.eq("sessionId", args.sessionId).eq("studentId", user._id)
      )
      .unique();

    if (existingAttendance && !existingAttendance.leaveTime) {
      return existingAttendance._id;
    }

    // Insert new attendance and increment session attendeeCount
    const id = await ctx.db.insert("attendance", {
      sessionId: args.sessionId,
      studentId: user._id,
      joinTime: Date.now(),
    });

    const session = await ctx.db.get(args.sessionId);
    if (session) {
      await ctx.db.patch(args.sessionId, {
        attendeeCount: Math.max(0, (session.attendeeCount ?? 0) + 1),
      });
    }

    return id;
  },
});

// Leave a session
export const leaveSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be authenticated");

    const attendance = await ctx.db
      .query("attendance")
      .withIndex("by_session_and_student", (q) =>
        q.eq("sessionId", args.sessionId).eq("studentId", user._id)
      )
      .filter((q) => q.eq(q.field("leaveTime"), undefined))
      .unique();

    if (attendance) {
      const leaveTime = Date.now();
      const duration = Math.floor((leaveTime - attendance.joinTime) / 60000); // minutes

      await ctx.db.patch(attendance._id, {
        leaveTime,
        duration,
      });

      // Decrement attendeeCount once when a user leaves
      const session = await ctx.db.get(attendance.sessionId);
      if (session) {
        await ctx.db.patch(attendance.sessionId, {
          attendeeCount: Math.max(0, (session.attendeeCount ?? 0) - 1),
        });
      }
    }
  },
});

// Get live sessions
export const getLiveSessions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_live", (q) => q.eq("isLive", true))
      .collect();
  },
});

// Admin: start a session for any classroom
export const adminStartSession = mutation({
  args: { classroomId: v.id("classrooms"), title: v.string() },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me || me.role !== "admin") throw new Error("Unauthorized");
    return await ctx.db.insert("sessions", {
      classroomId: args.classroomId,
      teacherId: me._id, // record initiator; ownership remains classroom teacher operationally
      title: args.title,
      startTime: Date.now(),
      isLive: true,
      attendeeCount: 0,
    });
  },
});

// Admin: end any session
export const adminEndSession = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me || me.role !== "admin") throw new Error("Unauthorized");
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Not found");
    await ctx.db.patch(args.sessionId, { endTime: Date.now(), isLive: false });
  },
});