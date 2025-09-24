import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, useAction } from "convex/react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Users, 
  Video, 
  FileText, 
  BarChart3, 
  Globe, 
  Clock,
  Plus,
  Play,
  UserPlus,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import * as React from "react";
import { HeaderBar } from "@/components/dashboard/HeaderBar";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { ClassroomsTab } from "@/components/dashboard/ClassroomsTab";
import { SessionsTab } from "@/components/dashboard/SessionsTab";
import { NotesTab } from "@/components/dashboard/NotesTab";
import { ReportsTab } from "@/components/dashboard/ReportsTab";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const classrooms = useQuery(api.classrooms.getUserClassrooms);
  const availableClassrooms = useQuery(api.classrooms.getAvailableClassrooms);
  const liveSessions = useQuery(api.sessions.getLiveSessions);
  const userNotes = useQuery(api.notes.getUserNotes);
  const [reportStart, setReportStart] = React.useState<string>("");
  const [reportEnd, setReportEnd] = React.useState<string>("");

  const startMs = reportStart ? new Date(reportStart).getTime() : undefined;
  const endMs = reportEnd ? new Date(reportEnd).getTime() : undefined;

  const userReports = useQuery(api.reports.getStudentReports, {
    ...(startMs && endMs ? { startDate: startMs, endDate: endMs } : {}),
  } as any);
  
  const enrollInClassroom = useMutation(api.classrooms.enrollInClassroom);
  const startSession = useMutation(api.sessions.startSession);
  const sendEmails = useAction(api.notifications.sendSessionStartEmails);
  const summarize = useMutation(api.notes.generateNoteSummary);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleEnroll = async (classroomId: string) => {
    try {
      await enrollInClassroom({ classroomId: classroomId as any });
      toast.success("Successfully enrolled in classroom!");
    } catch (error) {
      toast.error("Failed to enroll in classroom");
    }
  };

  const handleStartSession = async (classroomId: string, title: string) => {
    try {
      await startSession({ classroomId: classroomId as any, title });
      toast.success("Session started successfully!");
      // Optional: fire-and-forget email notifications
      sendEmails({ classroomId: classroomId as any, sessionTitle: title, teacherName: user.name ?? "Teacher" })
        .catch(() => {});
    } catch (error) {
      toast.error("Failed to start session");
    }
  };

  const isTeacher = user.role === "teacher";
  const userRole = user.role || "user";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <HeaderBar
        userRole={userRole}
        userName={user.name}
        onLogoClick={() => navigate("/")}
        onProfileClick={() => navigate("/profile")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name || "Learner"}! 👋
          </h2>
          <p className="text-gray-600">
            {isTeacher 
              ? "Manage your classrooms and track student progress"
              : "Continue your learning journey with AI-powered tools"
            }
          </p>
        </motion.div>

        {/* Quick Stats */}
        <QuickStats
          classroomsCount={classrooms?.length || 0}
          liveCount={liveSessions?.length || 0}
          notesCount={userNotes?.length || 0}
          reportsCount={userReports?.length || 0}
        />

        {/* Main Content */}
        <Tabs defaultValue="classrooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white border border-blue-100">
            <TabsTrigger value="classrooms" className="data-[state=active]:bg-blue-50">
              <BookOpen className="h-4 w-4 mr-2" />
              Classrooms
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-green-50">
              <Video className="h-4 w-4 mr-2" />
              Live Sessions
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-purple-50">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-orange-50">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="classrooms" className="space-y-6">
            <ClassroomsTab
              classrooms={classrooms}
              availableClassrooms={availableClassrooms}
              isTeacher={isTeacher}
              onCreateClassroom={() => navigate("/create-classroom")}
              onStartSession={handleStartSession}
              onEnroll={handleEnroll}
            />
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <SessionsTab liveSessions={liveSessions} />
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <NotesTab
              notes={userNotes}
              onViewAll={() => navigate("/notes")}
              onSummarize={async (noteId: string) => {
                const p = summarize({ noteId: noteId as any });
                toast.promise(p, {
                  loading: "Summarizing with AI...",
                  success: "Summary generated!",
                  error: "Failed to summarize",
                });
                await p;
              }}
            />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <ReportsTab
              reports={userReports}
              startDate={reportStart}
              endDate={reportEnd}
              onStartChange={setReportStart}
              onEndChange={setReportEnd}
              onGenerate={() => navigate("/reports")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}