import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
  TEACHER: "teacher",
  STUDENT: "student",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
  v.literal(ROLES.TEACHER),
  v.literal(ROLES.STUDENT),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
      
      // EdTech specific fields
      institution: v.optional(v.string()),
      grade: v.optional(v.string()),
      subject: v.optional(v.string()),
      preferredLanguage: v.optional(v.string()),
      timezone: v.optional(v.string()),
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Virtual Classrooms
    classrooms: defineTable({
      name: v.string(),
      description: v.optional(v.string()),
      teacherId: v.id("users"),
      subject: v.string(),
      grade: v.optional(v.string()),
      isActive: v.boolean(),
      maxStudents: v.optional(v.number()),
      meetingUrl: v.optional(v.string()),
      scheduledTime: v.optional(v.number()),
      duration: v.optional(v.number()), // in minutes
      language: v.string(),
      allowTranslation: v.boolean(),
    })
      .index("by_teacher", ["teacherId"])
      .index("by_subject", ["subject"])
      .index("by_active", ["isActive"]),

    // Classroom Enrollments
    enrollments: defineTable({
      classroomId: v.id("classrooms"),
      studentId: v.id("users"),
      enrolledAt: v.number(),
      status: v.union(v.literal("active"), v.literal("completed"), v.literal("dropped")),
    })
      .index("by_classroom", ["classroomId"])
      .index("by_student", ["studentId"])
      .index("by_classroom_and_student", ["classroomId", "studentId"]),

    // Live Sessions
    sessions: defineTable({
      classroomId: v.id("classrooms"),
      teacherId: v.id("users"),
      title: v.string(),
      startTime: v.number(),
      endTime: v.optional(v.number()),
      isLive: v.boolean(),
      recordingUrl: v.optional(v.string()),
      attendeeCount: v.number(),
    })
      .index("by_classroom", ["classroomId"])
      .index("by_teacher", ["teacherId"])
      .index("by_live", ["isLive"]),

    // Session Attendance
    attendance: defineTable({
      sessionId: v.id("sessions"),
      studentId: v.id("users"),
      joinTime: v.number(),
      leaveTime: v.optional(v.number()),
      duration: v.optional(v.number()), // in minutes
    })
      .index("by_session", ["sessionId"])
      .index("by_student", ["studentId"])
      .index("by_session_and_student", ["sessionId", "studentId"]),

    // AI-Generated Notes
    notes: defineTable({
      sessionId: v.id("sessions"),
      userId: v.id("users"),
      title: v.string(),
      content: v.string(),
      summary: v.optional(v.string()),
      keyPoints: v.optional(v.array(v.string())),
      language: v.string(),
      isAiGenerated: v.boolean(),
      confidence: v.optional(v.number()), // AI confidence score
    })
      .index("by_session", ["sessionId"])
      .index("by_user", ["userId"])
      .index("by_session_and_user", ["sessionId", "userId"]),

    // Translations
    translations: defineTable({
      originalText: v.string(),
      translatedText: v.string(),
      fromLanguage: v.string(),
      toLanguage: v.string(),
      sessionId: v.optional(v.id("sessions")),
      userId: v.id("users"),
      timestamp: v.number(),
    })
      .index("by_session", ["sessionId"])
      .index("by_user", ["userId"])
      .index("by_languages", ["fromLanguage", "toLanguage"]),

    // Performance Reports
    reports: defineTable({
      studentId: v.id("users"),
      classroomId: v.id("classrooms"),
      reportType: v.union(
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("semester"),
        v.literal("custom")
      ),
      startDate: v.number(),
      endDate: v.number(),
      attendanceRate: v.number(),
      participationScore: v.number(),
      notesCount: v.number(),
      averageSessionDuration: v.number(),
      strengths: v.array(v.string()),
      improvements: v.array(v.string()),
      generatedAt: v.number(),
    })
      .index("by_student", ["studentId"])
      .index("by_classroom", ["classroomId"])
      .index("by_student_and_classroom", ["studentId", "classroomId"])
      .index("by_report_type", ["reportType"]),

    // Assignments
    assignments: defineTable({
      classroomId: v.id("classrooms"),
      teacherId: v.id("users"),
      title: v.string(),
      description: v.string(),
      dueDate: v.number(),
      maxPoints: v.number(),
      isPublished: v.boolean(),
      attachments: v.optional(v.array(v.string())),
    })
      .index("by_classroom", ["classroomId"])
      .index("by_teacher", ["teacherId"])
      .index("by_due_date", ["dueDate"]),

    // Assignment Submissions
    submissions: defineTable({
      assignmentId: v.id("assignments"),
      studentId: v.id("users"),
      content: v.string(),
      attachments: v.optional(v.array(v.string())),
      submittedAt: v.number(),
      grade: v.optional(v.number()),
      feedback: v.optional(v.string()),
      status: v.union(
        v.literal("draft"),
        v.literal("submitted"),
        v.literal("graded"),
        v.literal("returned")
      ),
    })
      .index("by_assignment", ["assignmentId"])
      .index("by_student", ["studentId"])
      .index("by_assignment_and_student", ["assignmentId", "studentId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;