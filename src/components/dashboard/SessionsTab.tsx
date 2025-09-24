import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

type Session = any;

type Props = {
  liveSessions: Session[] | undefined | null;
  onJoin: (sessionId: string) => void;
};

export function SessionsTab({ liveSessions, onJoin }: Props) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Live Sessions</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(liveSessions ?? []).map((session) => (
          <Card key={session._id} className="border-green-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{session.title}</CardTitle>
                <Badge className="bg-green-100 text-green-800 animate-pulse">🔴 LIVE</Badge>
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
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onJoin(session._id)}>
                  Join Session
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}