import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";

type Session = any;

type Props = {
  liveSessions: Session[] | undefined | null;
  onJoin: (sessionId: string) => void;
};

export function SessionsTab({ liveSessions, onJoin }: Props) {
  // Local dialog state for attaching YouTube videos
  const [open, setOpen] = React.useState(false);
  const [targetSession, setTargetSession] = React.useState<string | null>(null);
  const [url, setUrl] = React.useState("");
  const [title, setTitle] = React.useState("");

  const { user } = useAuth();

  const addVideo = useMutation(api.videos.addToSession);
   // removed unused listVideos

  // removed unused listMeeting

  const openAttach = (sessionId: string) => {
    setTargetSession(sessionId);
    setUrl("");
    setTitle("");
    setOpen(true);
  };

  const submitAttach = async () => {
    if (!targetSession) return;
    if (!url.trim()) {
      toast.error("Paste a YouTube URL or ID");
      return;
    }
    const p = addVideo({ sessionId: targetSession as any, urlOrId: url.trim(), title: title.trim() || undefined } as any);
    toast.promise(p, {
      loading: "Attaching video...",
      success: "Video attached",
      error: "Failed to attach video",
    });
    await p;
    setOpen(false);
  };

  // New: Schedule Meet dialog state
  const [openMeet, setOpenMeet] = React.useState(false);
  const [meetSession, setMeetSession] = React.useState<string | null>(null);
  const [mTitle, setMTitle] = React.useState("");
  const [mStart, setMStart] = React.useState("");
  const [mEnd, setMEnd] = React.useState("");

  const openSchedule = (sessionId: string) => {
    setMeetSession(sessionId);
    setMTitle("");
    setMStart("");
    setMEnd("");
    setOpenMeet(true);
  };

  const submitSchedule = async () => {
    if (!user?._id || !meetSession) return;
    if (!mTitle.trim() || !mStart || !mEnd) {
      toast.error("Please fill in title, start, and end");
      return;
    }
    const p = fetch("/api/integrations/google/schedule-meet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user._id,
        sessionId: meetSession,
        title: mTitle.trim(),
        start: mStart,
        end: mEnd,
      }),
    }).then(async (r) => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    });
    toast.promise(p, {
      loading: "Scheduling Google Meet...",
      success: "Meet scheduled",
      error: "Failed to schedule",
    });
    try {
      await p;
      setOpenMeet(false);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Live Sessions</h3>
        <div className="flex gap-2">
          {/* Connect Google (OAuth) */}
          <button
            className="text-sm px-3 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => {
              if (!user?._id) {
                toast.error("Sign in first");
                return;
              }
              window.location.href = `/api/integrations/google/start?userId=${user._id}`;
            }}
          >
            Connect Google
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(liveSessions ?? []).map((s: any) => (
          <SessionItem
            key={s._id}
            session={s}
            onJoin={() => onJoin(s._id)}
            onSchedule={() => openSchedule(s._id)}
            onAttach={() => openAttach(s._id)}
          />
        ))}
      </div>

      {/* Attach YouTube Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attach YouTube Video</DialogTitle>
            <DialogDescription>Paste a YouTube URL or the 11-character video ID.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <div className="text-sm text-gray-700">YouTube URL or Video ID</div>
              <Input
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID or VIDEO_ID"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-700">Title (optional)</div>
              <Input placeholder="Lecture 1: Introduction" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <button
              className="px-4 py-2 rounded-md border mr-2"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
              onClick={submitAttach}
            >
              Attach
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Meet Dialog */}
      <Dialog open={openMeet} onOpenChange={setOpenMeet}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Google Meet</DialogTitle>
            <DialogDescription>Create a Calendar event with a Meet link.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-sm">Title</Label>
              <Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Session Standup" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Start</Label>
                <Input type="datetime-local" value={mStart} onChange={(e) => setMStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">End</Label>
                <Input type="datetime-local" value={mEnd} onChange={(e) => setMEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button className="px-4 py-2 rounded-md border mr-2" onClick={() => setOpenMeet(false)}>
              Cancel
            </button>
            <button className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={submitSchedule}>
              Schedule
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add: Child component to safely use hooks per session card
function SessionItem({
  session,
  onJoin,
  onSchedule,
  onAttach,
}: {
  session: any;
  onJoin: () => void;
  onSchedule: () => void;
  onAttach: () => void;
}) {
  const videos = useQuery(api.videos.listForSession, { sessionId: session._id as any } as any);
  const meeting = useQuery(api.meetings.getForSession, { sessionId: session._id as any } as any);

  return (
    <div className="border rounded-md p-4 bg-white border-green-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{session.title}</div>
          <div className="text-xs text-gray-500">
            Started {new Date(session.startTime).toLocaleTimeString()} • {session.attendeeCount} attendees
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="text-sm px-3 py-1 rounded-md border border-green-200 text-green-700 hover:bg-green-50"
            onClick={onJoin}
          >
            Join
          </button>
          {meeting?.providerMeetingUrl ? (
            <a
              href={meeting.providerMeetingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm px-3 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Join Google Meet
            </a>
          ) : (
            <button
              className="text-sm px-3 py-1 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={onSchedule}
            >
              Schedule Meet
            </button>
          )}
          <button
            className="text-sm px-3 py-1 rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={onAttach}
          >
            Attach YouTube
          </button>
        </div>
      </div>

      {(videos ?? []).length > 0 && (
        <div className="mt-3 space-y-2">
          {(videos ?? []).map((v: any) => (
            <div key={v._id} className="rounded-md overflow-hidden border">
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${v.videoId}`}
                  title={v.title ?? "Lecture Video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {v.title && <div className="p-2 text-sm">{v.title}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}