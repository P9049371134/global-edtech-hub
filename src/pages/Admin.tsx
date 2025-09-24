import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function Admin() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const users = useQuery(api.users.listUsers);
  const classrooms = useQuery(api.classrooms.listAllClassrooms);
  const liveSessions = useQuery(api.sessions.getLiveSessions);
  const system = useQuery(api.system.getStatus);

  const updateUserRole = useMutation(api.users.updateUserRole);
  const setUserActive = useMutation(api.users.setUserActive);
  const adminStart = useMutation(api.sessions.adminStartSession);
  const adminEnd = useMutation(api.sessions.adminEndSession);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  const recentMessages = useQuery(api.messages.listRecentMessages, { channel: "global" } as any);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    navigate("/dashboard");
    return null;
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="EduCollab" className="h-8 w-8 cursor-pointer" onClick={() => navigate("/")} />
            <h1 className="text-xl font-bold text-gray-900">Admin</h1>
            <Badge variant="secondary" className="bg-red-100 text-red-800">Superuser</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-blue-200" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" className="border-blue-200" onClick={() => navigate("/profile")}>
              Profile
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="text-blue-100">Users</div>
              <div className="text-2xl font-bold">{users?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="text-indigo-100">Classrooms</div>
              <div className="text-2xl font-bold">{classrooms?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="text-green-100">Live Sessions</div>
              <div className="text-2xl font-bold">{liveSessions?.length ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="text-orange-100">OpenRouter/Resend</div>
              <div className="text-sm font-medium">
                OR: {system?.openrouter ? "On" : "Off"} • RS: {system?.resend ? "On" : "Off"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-white border border-blue-100">
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-50">Users & Roles</TabsTrigger>
            <TabsTrigger value="classes" className="data-[state=active]:bg-green-50">Classrooms & Sessions</TabsTrigger>
            <TabsTrigger value="moderation" className="data-[state=active]:bg-purple-50">Moderation</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-orange-50">Settings</TabsTrigger>
          </TabsList>

          {/* Users */}
          <TabsContent value="users" className="space-y-6">
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="text-lg">Manage Users</CardTitle>
                <CardDescription>View users, change roles, and activate/deactivate accounts.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Status</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(users ?? []).map((u: any) => (
                        <tr key={u._id} className="border-t">
                          <td className="p-2">{u.name ?? "—"}</td>
                          <td className="p-2">{u.email ?? "—"}</td>
                          <td className="p-2 capitalize">{u.role ?? "user"}</td>
                          <td className="p-2">
                            {u.isActive === false ? (
                              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-2 justify-end">
                              <Select
                                onValueChange={async (val) => {
                                  try {
                                    await updateUserRole({ userId: u._id, role: val as any });
                                    toast.success("Role updated");
                                  } catch {
                                    toast.error("Failed to update role");
                                  }
                                }}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue placeholder={u.role ?? "user"} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">admin</SelectItem>
                                  <SelectItem value="teacher">teacher</SelectItem>
                                  <SelectItem value="student">student</SelectItem>
                                  <SelectItem value="member">member</SelectItem>
                                  <SelectItem value="user">user</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="outline"
                                className="border-red-200"
                                onClick={async () => {
                                  try {
                                    const next = !(u.isActive !== false);
                                    await setUserActive({ userId: u._id, isActive: next });
                                    toast.success(next ? "User activated" : "User deactivated");
                                  } catch {
                                    toast.error("Failed to update status");
                                  }
                                }}
                              >
                                {u.isActive === false ? "Activate" : "Deactivate"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Classrooms & Sessions */}
          <TabsContent value="classes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-green-100">
                <CardHeader>
                  <CardTitle className="text-lg">All Classrooms</CardTitle>
                  <CardDescription>Overview across the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(classrooms ?? []).map((c: any) => (
                    <div key={c._id} className="p-3 border rounded-md border-green-100 bg-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.subject} • {c.language}</div>
                        </div>
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          {c.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">Grade: {c.grade ?? "—"}</div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            try {
                              await adminStart({ classroomId: c._id, title: `${c.name} Admin Session` });
                              toast.success("Session started");
                            } catch {
                              toast.error("Failed to start session");
                            }
                          }}
                        >
                          Start Session
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-green-100">
                <CardHeader>
                  <CardTitle className="text-lg">Live Sessions</CardTitle>
                  <CardDescription>Force end if necessary.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(liveSessions ?? []).map((s: any) => (
                    <div key={s._id} className="p-3 border rounded-md border-green-100 bg-white flex justify-between items-center">
                      <div>
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-gray-500">
                          Started {new Date(s.startTime).toLocaleTimeString()} • {s.attendeeCount} attendees
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={async () => {
                          try {
                            await adminEnd({ sessionId: s._id });
                            toast.success("Session ended");
                          } catch {
                            toast.error("Failed to end session");
                          }
                        }}
                      >
                        End
                      </Button>
                    </div>
                  ))}
                  {(liveSessions ?? []).length === 0 && (
                    <div className="text-sm text-gray-500">No live sessions.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Moderation */}
          <TabsContent value="moderation" className="space-y-6">
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="text-lg">Recent Messages (global)</CardTitle>
                <CardDescription>Review and remove messages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600">
                        <th className="p-2">User</th>
                        <th className="p-2">Message</th>
                        <th className="p-2">Time</th>
                        <th className="p-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(recentMessages ?? []).map((m: any) => (
                        <tr key={m._id} className="border-t">
                          <td className="p-2">{m.name}</td>
                          <td className="p-2 max-w-[480px] truncate">{m.text}</td>
                          <td className="p-2">{new Date(m._creationTime).toLocaleString()}</td>
                          <td className="p-2">
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={async () => {
                                  try {
                                    await deleteMessage({ messageId: m._id });
                                    toast.success("Message deleted");
                                  } catch {
                                    toast.error("Failed to delete");
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(recentMessages ?? []).length === 0 && (
                  <div className="text-sm text-gray-500">No messages found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="text-lg">System Configuration</CardTitle>
                <CardDescription>Integration status and global options.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">OpenRouter</div>
                    <div className="text-xs text-gray-500">AI summarization</div>
                  </div>
                  <Badge className={system?.openrouter ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                    {system?.openrouter ? "Configured" : "Missing"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium">Resend</div>
                    <div className="text-xs text-gray-500">Email notifications</div>
                  </div>
                  <Badge className={system?.resend ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}>
                    {system?.resend ? "Configured" : "Missing"}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500">
                  Manage API keys via Integrations tab. Changes take effect immediately.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </motion.div>
  );
}
