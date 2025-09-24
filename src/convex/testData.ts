import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create test users
    const teacherId = await ctx.db.insert("users", {
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@educollab.com",
      role: "teacher",
      institution: "Global University",
      subject: "Mathematics",
      preferredLanguage: "English",
      timezone: "UTC-5",
    });

    const studentId1 = await ctx.db.insert("users", {
      name: "Alex Chen",
      email: "alex.chen@student.com",
      role: "student",
      institution: "Global University",
      grade: "Grade 10",
      preferredLanguage: "English",
      timezone: "UTC-8",
    });

    const studentId2 = await ctx.db.insert("users", {
      name: "Maria Rodriguez",
      email: "maria.rodriguez@student.com",
      role: "student",
      institution: "Global University",
      grade: "Grade 10",
      preferredLanguage: "Spanish",
      timezone: "UTC-6",
    });

    // Create test classrooms
    const classroomId1 = await ctx.db.insert("classrooms", {
      name: "Advanced Algebra",
      description: "Learn advanced algebraic concepts with real-world applications",
      teacherId,
      subject: "Mathematics",
      grade: "Grade 10-12",
      isActive: true,
      maxStudents: 30,
      language: "English",
      allowTranslation: true,
    });

    const classroomId2 = await ctx.db.insert("classrooms", {
      name: "Calculus Fundamentals",
      description: "Introduction to differential and integral calculus",
      teacherId,
      subject: "Mathematics",
      grade: "Grade 11-12",
      isActive: true,
      maxStudents: 25,
      language: "English",
      allowTranslation: true,
    });

    const classroomId3 = await ctx.db.insert("classrooms", {
      name: "Spanish Literature",
      description: "Explore classic and contemporary Spanish literature",
      teacherId,
      subject: "Literature",
      grade: "Grade 9-12",
      isActive: true,
      maxStudents: 20,
      language: "Spanish",
      allowTranslation: true,
    });

    // Create enrollments
    await ctx.db.insert("enrollments", {
      classroomId: classroomId1,
      studentId: studentId1,
      enrolledAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
      status: "active",
    });

    await ctx.db.insert("enrollments", {
      classroomId: classroomId1,
      studentId: studentId2,
      enrolledAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      status: "active",
    });

    await ctx.db.insert("enrollments", {
      classroomId: classroomId2,
      studentId: studentId1,
      enrolledAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
      status: "active",
    });

    // Create test sessions
    const sessionId1 = await ctx.db.insert("sessions", {
      classroomId: classroomId1,
      teacherId,
      title: "Quadratic Equations Deep Dive",
      startTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      endTime: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
      isLive: false,
      attendeeCount: 15,
    });

    const sessionId2 = await ctx.db.insert("sessions", {
      classroomId: classroomId1,
      teacherId,
      title: "Live Q&A Session",
      startTime: Date.now() - 30 * 60 * 1000, // 30 minutes ago
      isLive: true,
      attendeeCount: 8,
    });

    // Create attendance records
    await ctx.db.insert("attendance", {
      sessionId: sessionId1,
      studentId: studentId1,
      joinTime: Date.now() - 2 * 60 * 60 * 1000,
      leaveTime: Date.now() - 1 * 60 * 60 * 1000,
      duration: 60,
    });

    await ctx.db.insert("attendance", {
      sessionId: sessionId1,
      studentId: studentId2,
      joinTime: Date.now() - 2 * 60 * 60 * 1000,
      leaveTime: Date.now() - 90 * 60 * 1000,
      duration: 30,
    });

    await ctx.db.insert("attendance", {
      sessionId: sessionId2,
      studentId: studentId1,
      joinTime: Date.now() - 30 * 60 * 1000,
    });

    // Create test notes
    await ctx.db.insert("notes", {
      sessionId: sessionId1,
      userId: studentId1,
      title: "Quadratic Formula Notes",
      content: "The quadratic formula is x = (-b ± √(b²-4ac)) / 2a. This formula helps solve any quadratic equation of the form ax² + bx + c = 0. Key points: discriminant determines number of solutions, vertex form is useful for graphing.",
      summary: "Quadratic formula derivation and applications for solving second-degree equations",
      keyPoints: [
        "Quadratic formula: x = (-b ± √(b²-4ac)) / 2a",
        "Discriminant b²-4ac determines solution types",
        "Vertex form useful for graphing parabolas"
      ],
      language: "English",
      isAiGenerated: true,
      confidence: 0.92,
    });

    await ctx.db.insert("notes", {
      sessionId: sessionId1,
      userId: studentId2,
      title: "Mis Notas de Ecuaciones Cuadráticas",
      content: "La fórmula cuadrática es muy importante para resolver ecuaciones de segundo grado. Necesito practicar más con los problemas de aplicación.",
      language: "Spanish",
      isAiGenerated: false,
    });

    // Create test translations
    await ctx.db.insert("translations", {
      originalText: "Today we will learn about quadratic equations",
      translatedText: "Hoy aprenderemos sobre ecuaciones cuadráticas",
      fromLanguage: "English",
      toLanguage: "Spanish",
      sessionId: sessionId1,
      userId: studentId2,
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
    });

    // Create test reports
    await ctx.db.insert("reports", {
      studentId: studentId1,
      classroomId: classroomId1,
      reportType: "weekly",
      startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      endDate: Date.now(),
      attendanceRate: 85.5,
      participationScore: 92,
      notesCount: 12,
      averageSessionDuration: 55,
      strengths: [
        "Excellent attendance record",
        "Active note-taking",
        "Good session engagement"
      ],
      improvements: [
        "Participate more in discussions",
        "Ask questions when confused"
      ],
      generatedAt: Date.now(),
    });

    await ctx.db.insert("reports", {
      studentId: studentId2,
      classroomId: classroomId1,
      reportType: "weekly",
      startDate: Date.now() - 7 * 24 * 60 * 60 * 1000,
      endDate: Date.now(),
      attendanceRate: 70.0,
      participationScore: 78,
      notesCount: 8,
      averageSessionDuration: 42,
      strengths: [
        "Uses translation features effectively",
        "Consistent note-taking in native language"
      ],
      improvements: [
        "Improve class attendance",
        "Stay engaged for full sessions",
        "Practice English technical vocabulary"
      ],
      generatedAt: Date.now(),
    });

    return {
      message: "Test data seeded successfully!",
      data: {
        teachers: 1,
        students: 2,
        classrooms: 3,
        sessions: 2,
        notes: 2,
        reports: 2,
      }
    };
  },
});
