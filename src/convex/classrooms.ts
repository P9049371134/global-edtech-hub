import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get all classrooms for a user (teacher or student)
export const getUserClassrooms = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    if (user.role === "teacher") {
      return await ctx.db
        .query("classrooms")
        .withIndex("by_teacher", (q) => q.eq("teacherId", user._id))
        .collect();
    } else {
      // Get enrolled classrooms for students
      const enrollments = await ctx.db
        .query("enrollments")
        .withIndex("by_student", (q) => q.eq("studentId", user._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      const classrooms = [];
      for (const enrollment of enrollments) {
        const classroom = await ctx.db.get(enrollment.classroomId);
        if (classroom) classrooms.push(classroom);
      }
      return classrooms;
    }
  },
});

// Get all available classrooms for enrollment
export const getAvailableClassrooms = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("classrooms")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

// Create a new classroom
export const createClassroom = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.string(),
    grade: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
    language: v.string(),
    allowTranslation: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || (user.role !== "teacher" && user.role !== "admin")) {
      throw new Error("Only teachers can create classrooms");
    }

    return await ctx.db.insert("classrooms", {
      ...args,
      teacherId: user._id,
      isActive: true,
    });
  },
});

// Enroll in a classroom
export const enrollInClassroom = mutation({
  args: {
    classroomId: v.id("classrooms"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Must be authenticated");

    // Check if already enrolled
    const existingEnrollment = await ctx.db
      .query("enrollments")
      .withIndex("by_classroom_and_student", (q) =>
        q.eq("classroomId", args.classroomId).eq("studentId", user._id)
      )
      .unique();

    if (existingEnrollment) {
      throw new Error("Already enrolled in this classroom");
    }

    return await ctx.db.insert("enrollments", {
      classroomId: args.classroomId,
      studentId: user._id,
      enrolledAt: Date.now(),
      status: "active",
    });
  },
});

// Get classroom details with enrollment info
export const getClassroomDetails = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) return null;

    const teacher = await ctx.db.get(classroom.teacherId);
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const students = [];
    for (const enrollment of enrollments) {
      const student = await ctx.db.get(enrollment.studentId);
      if (student) students.push(student);
    }

    return {
      ...classroom,
      teacher,
      students,
      enrollmentCount: enrollments.length,
    };
  },
});

// Admin: list all classrooms
export const listAllClassrooms = query({
  args: {},
  handler: async (ctx) => {
    const me = await getCurrentUser(ctx);
    if (!me || me.role !== "admin") return [];
    const q = ctx.db.query("classrooms");
    const out: any[] = [];
    for await (const c of q) out.push(c);
    return out;
  },
});