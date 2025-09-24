import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation, useAction } from "convex/react";
import { motion } from "framer-motion";
import { BookOpen, Video, FileText, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import * as React from "react";
import { HeaderBar } from "@/components/dashboard/HeaderBar";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { ClassroomsTab } from "@/components/dashboard/ClassroomsTab";
import { SessionsTab } from "@/components/dashboard/SessionsTab";
import { NotesTab } from "@/components/dashboard/NotesTab";
import { ReportsTab } from "@/components/dashboard/ReportsTab";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const joinSession = useMutation(api.sessions.joinSession);
  const createClassroom = useMutation(api.classrooms.createClassroom);

  // Add: create classroom modal state
  const [openCreate, setOpenCreate] = React.useState(false);
  const [cName, setCName] = React.useState("");
  const [cSubject, setCSubject] = React.useState("");
  const [cLanguage, setCLanguage] = React.useState("English");
  const [cGrade, setCGrade] = React.useState("");
  const [cMax, setCMax] = React.useState<string>("");
  const [cAllowTranslate, setCAllowTranslate] = React.useState(true);
  const [creating, setCreating] = React.useState(false);

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

  // Add: submit create classroom
  const submitCreateClassroom = async () => {
    if (!cName.trim() || !cSubject.trim() || !cLanguage.trim()) {
      toast.error("Please fill in Name, Subject, and Language");
      return;
    }
    setCreating(true);
    try {
      await createClassroom({
        name: cName.trim(),
        subject: cSubject.trim(),
        language: cLanguage.trim(),
        allowTranslation: cAllowTranslate,
        ...(cGrade.trim() ? { grade: cGrade.trim() } : {}),
        ...(cMax.trim() ? { maxStudents: Number(cMax) } : {}),
      } as any);
      toast.success("Classroom created");
      setOpenCreate(false);
      setCName("");
      setCSubject("");
      setCLanguage("English");
      setCGrade("");
      setCMax("");
      setCAllowTranslate(true);
    } catch {
      toast.error("Failed to create classroom");
    } finally {
      setCreating(false);
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
              onCreateClassroom={() => setOpenCreate(true)}
              onStartSession={handleStartSession}
              onEnroll={handleEnroll}
            />

            {/* Create Classroom Dialog */}
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Classroom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="cname">Name</Label>
                    <Input id="cname" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Algebra 101" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="csubject">Subject</Label>
                    <Input id="csubject" value={cSubject} onChange={(e) => setCSubject(e.target.value)} placeholder="Mathematics" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clanguage">Language</Label>
                      <Input id="clanguage" value={cLanguage} onChange={(e) => setCLanguage(e.target.value)} placeholder="English" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cgrade">Grade (optional)</Label>
                      <Input id="cgrade" value={cGrade} onChange={(e) => setCGrade(e.target.value)} placeholder="Grade 8" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cmax">Max Students (optional)</Label>
                      <Input
                        id="cmax"
                        type="number"
                        min={1}
                        value={cMax}
                        onChange={(e) => setCMax(e.target.value)}
                        placeholder="30"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <Label htmlFor="ctranslate" className="mr-4">Allow Translation</Label>
                      <Switch id="ctranslate" checked={cAllowTranslate} onCheckedChange={setCAllowTranslate} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>
                    Cancel
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={submitCreateClassroom} disabled={creating}>
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <SessionsTab
              liveSessions={liveSessions}
              onJoin={async (sessionId: string) => {
                try {
                  await joinSession({ sessionId: sessionId as any });
                  toast.success("Joined session! Attendance recorded.");
                } catch {
                  toast.error("Failed to join session");
                }
              }}
            />
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <NotesTab
              notes={userNotes}
              onViewAll={() => toast.info("You're already viewing your notes here.")}
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
              onGenerate={() => toast.info("Use the date filters to refine your reports here.")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}