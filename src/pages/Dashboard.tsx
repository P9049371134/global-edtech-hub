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
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img
                src="/logo.svg"
                alt="EduCollab"
                className="h-8 w-8 cursor-pointer"
                onClick={() => navigate("/")}
              />
              <h1 className="text-xl font-bold text-gray-900">EduCollab</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
              <Button
                variant="outline"
                onClick={() => navigate("/profile")}
                className="border-blue-200 hover:bg-blue-50"
              >
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">My Classrooms</p>
                  <p className="text-2xl font-bold">{classrooms?.length || 0}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Live Sessions</p>
                  <p className="text-2xl font-bold">{liveSessions?.length || 0}</p>
                </div>
                <Video className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">My Notes</p>
                  <p className="text-2xl font-bold">{userNotes?.length || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Reports</p>
                  <p className="text-2xl font-bold">{userReports?.length || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

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
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">My Classrooms</h3>
              {isTeacher && (
                <Button onClick={() => navigate("/create-classroom")} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Classroom
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms?.map((classroom) => (
                <motion.div
                  key={classroom._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 border-blue-100">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{classroom.name}</CardTitle>
                          <CardDescription>{classroom.subject}</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-blue-200 text-blue-700">
                          {classroom.grade || "All Levels"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Globe className="h-4 w-4" />
                          <span>{classroom.language}</span>
                        </div>
                        {isTeacher && (
                          <Button
                            size="sm"
                            onClick={() => handleStartSession(classroom._id, `${classroom.name} Session`)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {!isTeacher && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4">Available Classrooms</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableClassrooms?.filter(classroom => 
                    !classrooms?.some(enrolled => enrolled._id === classroom._id)
                  ).map((classroom) => (
                    <Card key={classroom._id} className="border-green-100">
                      <CardHeader>
                        <CardTitle className="text-lg">{classroom.name}</CardTitle>
                        <CardDescription>{classroom.subject}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="border-green-200 text-green-700">
                            {classroom.grade || "All Levels"}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleEnroll(classroom._id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Enroll
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <h3 className="text-xl font-semibold">Live Sessions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveSessions?.map((session) => (
                <Card key={session._id} className="border-green-100">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.title}</CardTitle>
                      <Badge className="bg-green-100 text-green-800 animate-pulse">
                        🔴 LIVE
                      </Badge>
                    </div>
                    <CardDescription>
                      Started {new Date(session.startTime).toLocaleTimeString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{session.attendeeCount} attendees</span>
                      </div>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Join Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">My Notes</h3>
              <Button onClick={() => navigate("/notes")} variant="outline" className="border-purple-200">
                View All Notes
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userNotes?.slice(0, 4).map((note) => (
                <Card key={note._id} className="border-purple-100">
                  <CardHeader>
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-purple-200 text-purple-700">
                        {note.language}
                      </Badge>
                      {note.isAiGenerated && (
                        <Badge className="bg-purple-100 text-purple-800">
                          AI Generated
                        </Badge>
                      )}
                      {note.summary && (
                        <Badge className="bg-purple-100 text-purple-800">
                          Summarized
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {note.summary ?? note.content}
                    </p>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={!!note.summary}
                        onClick={async () => {
                          const p = summarize({ noteId: note._id as any });
                          toast.promise(p, {
                            loading: "Summarizing with AI...",
                            success: "Summary generated!",
                            error: "Failed to summarize",
                          });
                          await p;
                        }}
                      >
                        Summarize with AI
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={reportStart}
                  onChange={(e) => setReportStart(e.target.value)}
                  className="border border-orange-200 rounded px-2 py-1 text-sm"
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="date"
                  value={reportEnd}
                  onChange={(e) => setReportEnd(e.target.value)}
                  className="border border-orange-200 rounded px-2 py-1 text-sm"
                />
              </div>
              <h3 className="text-xl font-semibold">Performance Reports</h3>
              <Button onClick={() => navigate("/reports")} variant="outline" className="border-orange-200">
                Generate Report
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userReports?.slice(0, 4).map((report) => (
                <Card key={report._id} className="border-orange-100">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">{report.reportType} Report</CardTitle>
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {report.attendanceRate.toFixed(0)}%
                      </Badge>
                    </div>
                    <CardDescription>
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {new Date(report.startDate).toLocaleDateString()} - {new Date(report.endDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Participation Score:</span>
                        <span className="font-medium">{report.participationScore}/100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Notes Created:</span>
                        <span className="font-medium">{report.notesCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tiny chart: Attendance over time */}
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="text-lg">Attendance Trend</CardTitle>
                <CardDescription>Recent report attendance rates</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={(userReports ?? [])
                      .slice()
                      .reverse()
                      .map((r) => ({
                        date: new Date(r.endDate).toLocaleDateString(),
                        attendance: Math.round(r.attendanceRate),
                      }))}>
                    <defs>
                      <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fb923c" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="attendance" stroke="#fb923c" fillOpacity={1} fill="url(#colorAttend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}