import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MessageSquare, Users } from "lucide-react";
import { ChatBox } from "@/components/landing/ChatBox";
import { PresencePanel } from "@/components/landing/PresencePanel";

export function RTCDemo() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Real-time Collaboration</h2>
            <p className="text-gray-600 mt-2">Jump into the Global Lounge to see live chat and presence updates instantly.</p>
          </div>
          <Badge className="bg-green-100 text-green-800">Live Demo</Badge>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Global Lounge
              </CardTitle>
              <CardDescription>Public channel. Messages update in real-time.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChatBox />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Online Now
              </CardTitle>
              <CardDescription>Users active in the last 2 minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <PresencePanel />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
