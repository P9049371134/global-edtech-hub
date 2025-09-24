import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";

export default function Profile() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    navigate("/auth");
    return null;
  }

  const role = (user.role ?? "user") as string;

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="EduCollab"
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate("/")}
            />
            <h1 className="text-xl font-bold text-gray-900">Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
            <Button variant="outline" className="border-blue-200" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Name</div>
                  <div className="text-sm font-medium text-gray-900">{user.name ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm font-medium text-gray-900">{user.email ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Institution</div>
                  <div className="text-sm font-medium text-gray-900">{user.institution ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Preferred Language</div>
                  <div className="text-sm font-medium text-gray-900">{user.preferredLanguage ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Grade</div>
                  <div className="text-sm font-medium text-gray-900">{user.grade ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Subject</div>
                  <div className="text-sm font-medium text-gray-900">{user.subject ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Timezone</div>
                  <div className="text-sm font-medium text-gray-900">{user.timezone ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Role</div>
                  <div className="text-sm font-medium text-gray-900 capitalize">{role}</div>
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </Button>
                <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => signOut().then(() => navigate("/"))}>
                  Sign out
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Profile Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full border-blue-200 hover:bg-blue-50" onClick={() => navigate("/dashboard")}>
                Manage Classrooms
              </Button>
              <Button variant="outline" className="w-full border-green-200 hover:bg-green-50" onClick={() => navigate("/dashboard")}>
                Join Live Session
              </Button>
              <Button variant="outline" className="w-full border-purple-200 hover:bg-purple-50" onClick={() => navigate("/dashboard")}>
                View Notes
              </Button>
              <Button variant="outline" className="w-full border-orange-200 hover:bg-orange-50" onClick={() => navigate("/dashboard")}>
                View Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </motion.div>
  );
}
