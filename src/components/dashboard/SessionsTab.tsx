import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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
          <SessionCard
            key={s._id}
            session={s}
            onJoin={onJoin}
            onAttach={openAttach}
            onSchedule={openSchedule}
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

function SessionCard({
  session,
  onJoin,
  onAttach,
  onSchedule,
}: {
  session: any;
  onJoin: (sessionId: string) => void;
  onAttach: (sessionId: string) => void;
  onSchedule: (sessionId: string) => void;
}) {
  // Per-session queries (valid, top-level in a component)
  const videos = useQuery(api.videos.listForSession, { sessionId: session._id as any } as any);
  const meeting = useQuery(api.meetings.getForSession, { sessionId: session._id as any } as any);

  // Add: Live Transcript (Web Speech API) state
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [lang, setLang] = React.useState("en-US");
  const [transcript, setTranscript] = React.useState("");
  const recognitionRef = React.useRef<any>(null);

  const { user } = useAuth();

  // Server-backed transcript hooks
  const liveTranscript = useQuery(api.transcription.getLiveForSession, { sessionId: session._id as any } as any) as any;
  const startServerTranscript = useMutation(api.transcription.start);
  const appendServerChunk = useMutation(api.transcription.appendChunk);
  const stopServerTranscript = useMutation(api.transcription.stop);
  const setTargetLang = useMutation(api.transcription.setTargetLanguage);

  const LANGS: Array<string> = [
    "en-US",
    "es-ES",
    "fr-FR",
    "hi-IN",
    "de-DE",
    "zh-CN",
    "ja-JP",
    "ar-SA",
  ];

  const getSpeechRecognition = () => {
    if (typeof window === "undefined") return null;
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
    return SR;
  };

  const initRecognition = React.useCallback(() => {
    const SR = getSpeechRecognition();
    if (!SR) return null;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (event: any) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += chunk + " ";
        } else {
          interim += chunk;
        }
      }
      if (finalText) {
        setTranscript((prev) => `${prev}${finalText}`);
        // If a server transcript is live, append chunk
        if (liveTranscript?._id) {
          appendServerChunk({ transcriptId: liveTranscript._id, text: finalText } as any).catch(() => {});
        }
      }
    };
    rec.onerror = (e: any) => {
      toast.error(`Transcription error: ${e?.error ?? "unknown"}`);
      setIsRecording(false);
    };
    rec.onend = () => {
      setIsRecording(false);
    };
    return rec;
  }, [lang, liveTranscript?._id]);
  
  const startRec = async () => {
    const SR = getSpeechRecognition();
    if (!SR) {
      toast.error("Live transcription not supported in this browser.");
      return;
    }
    // Ensure server transcript (teacher/admin only auto-start; others skip)
    try {
      if ((user?.role === "teacher" || user?.role === "admin") && !liveTranscript?._id) {
        await startServerTranscript({
          sessionId: session._id as any,
          sourceLanguage: lang,
        } as any);
      }
    } catch (e) {
      // non-fatal for client-only capture
    }
    if (isRecording) return;
    const rec = initRecognition();
    if (!rec) {
      toast.error("Could not start transcription.");
      return;
    }
    try {
      recognitionRef.current = rec;
      rec.start();
      setIsRecording(true);
      toast("Transcription started");
    } catch (e) {
      toast.error("Failed to start transcription");
    }
  };

  const stopRec = async () => {
    if (!isRecording) return;
    try {
      recognitionRef.current?.stop();
      setIsRecording(false);
      toast("Transcription stopped");
    } catch {}
    // Stop server transcript if owner/admin
    try {
      if ((user?.role === "teacher" || user?.role === "admin") && liveTranscript?._id) {
        await stopServerTranscript({ transcriptId: liveTranscript._id } as any);
      }
    } catch {}
  };

  const onChangeTargetLang = async (val: string) => {
    setLang(val);
    if (liveTranscript?._id && (user?.role === "teacher" || user?.role === "admin")) {
      try {
        await setTargetLang({ transcriptId: liveTranscript._id, targetLanguage: val } as any);
      } catch {}
    }
  };

  // Add: Local .txt downloader for client-only transcript
  const downloadTxt = React.useCallback(() => {
    const content = (transcript || "").trim();
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename = `${(session?.title ?? "transcript")
      .toString()
      .replace(/[^a-z0-9_-]/gi, "_")}.txt`;
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [transcript, session?.title]);

  const serverDownloadHref =
    liveTranscript?._id ? `/api/transcripts/export?transcriptId=${liveTranscript._id}` : null;

  React.useEffect(() => {
    // Stop recording if language changed mid-stream
    if (isRecording) {
      stopRec();
      // slight delay then restart with new language
      setTimeout(() => startRec(), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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
            onClick={() => onJoin(session._id)}
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
              onClick={() => onSchedule(session._id)}
            >
              Schedule Meet
            </button>
          )}
          <button
            className="text-sm px-3 py-1 rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() => onAttach(session._id)}
          >
            Attach YouTube
          </button>
          {/* Add: Live Transcript toggle */}
          <button
            className="text-sm px-3 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => setShowTranscript((v) => !v)}
          >
            {showTranscript ? "Hide Transcript" : "Live Transcript"}
          </button>
        </div>
      </div>

      {/* Live Transcript Panel */}
      {showTranscript && (
        <div className="mt-3 rounded-md border bg-gray-50">
          <div className="p-3 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <div className="text-sm text-gray-700">Recognition language</div>
              <select
                className="text-sm border rounded px-2 py-1 bg-white"
                value={lang}
                onChange={(e) => onChangeTargetLang(e.target.value)}
              >
                {LANGS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 mt-1 sm:mt-0">
                {!isRecording ? (
                  <button
                    className="text-sm px-3 py-1 rounded-md bg-gray-800 text-white hover:bg-gray-900"
                    onClick={startRec}
                  >
                    Start
                  </button>
                ) : (
                  <button
                    className="text-sm px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700"
                    onClick={stopRec}
                  >
                    Stop
                  </button>
                )}

                {serverDownloadHref ? (
                  <a
                    className="text-sm px-3 py-1 rounded-md border border-gray-300 text-gray-800 hover:bg-white"
                    href={serverDownloadHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Download .txt
                  </a>
                ) : (
                  <button
                    className="text-sm px-3 py-1 rounded-md border border-gray-300 text-gray-800 hover:bg-white"
                    onClick={downloadTxt}
                    disabled={!transcript.trim()}
                  >
                    Download .txt
                  </button>
                )}
              </div>
            </div>

            <div className="h-40 overflow-auto rounded border bg-white p-2 text-sm leading-6">
              {/* Prefer server transcript if present; fallback to local */}
              {liveTranscript?.chunks?.length ? (
                <pre className="whitespace-pre-wrap font-sans">
                  {(liveTranscript.chunks as any[]).map((c) => c.translated ?? c.text).join("")}
                </pre>
              ) : transcript ? (
                <pre className="whitespace-pre-wrap font-sans">{transcript}</pre>
              ) : (
                <div className="text-gray-400">No transcript yet. Click "Start" to begin.</div>
              )}
            </div>
          </div>
        </div>
      )}

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