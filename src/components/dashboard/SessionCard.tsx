import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

type Props = {
  session: any;
  onJoin: (sessionId: string) => void;
  onOpenAttach: (sessionId: string) => void;
  onOpenSchedule: (sessionId: string) => void;
};

export function SessionCard({ session: s, onJoin, onOpenAttach, onOpenSchedule }: Props) {
  const videos = useQuery(api.videos.listForSession, { sessionId: s._id as any } as any);
  const meeting = useQuery(api.meetings.getForSession, { sessionId: s._id as any } as any);

  return (
    <div className="border rounded-md p-4 bg-white border-green-100">
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
              onClick={() => onOpenSchedule(s._id)}
            >
              Schedule Meet
            </button>
          )}
          <button
            className="text-sm px-3 py-1 rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() => onOpenAttach(s._id)}
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
