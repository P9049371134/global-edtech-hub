import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import * as React from "react";

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

  const addVideo = useMutation(api.videos.addToSession);
  const listVideos = (sessionId: string) =>
    useQuery(api.videos.listForSession, { sessionId: sessionId as any } as any);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Live Sessions</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(liveSessions ?? []).map((s: any) => {
          const videos = listVideos ? listVideos(s._id) : undefined;
          return (
            <div key={s._id} className="border rounded-md p-4 bg-white border-green-100">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-xs text-gray-500">
                    Started {new Date(s.startTime).toLocaleTimeString()} • {s.attendeeCount} attendees
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-sm px-3 py-1 rounded-md border border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => onJoin(s._id)}
                  >
                    Join
                  </button>
                  <button
                    className="text-sm px-3 py-1 rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => openAttach(s._id)}
                  >
                    Attach YouTube
                  </button>
                </div>
              </div>

              {/* Attached videos list */}
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
        })}
      </div>

      {/* Attach YouTube Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attach YouTube Video</DialogTitle>
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
    </div>
  );
}