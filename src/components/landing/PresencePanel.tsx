import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";

function formatRelative(t: number) {
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function PresencePanel() {
  const { isAuthenticated, user } = useAuth();
  const online = useQuery(api.presence.online, { channel: "global" });
  const ping = useMutation(api.presence.ping);

  useEffect(() => {
    if (!isAuthenticated) return;
    const id = setInterval(() => {
      ping({ channel: "global" }).catch(() => {});
    }, 30_000);
    ping({ channel: "global" }).catch(() => {});
    return () => clearInterval(id);
  }, [isAuthenticated, ping]);

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        {online ? `${online.length} online` : "—"}
      </div>
      <div className="space-y-2">
        {(online ?? []).map((u) => {
          const isYou = user && (user._id as unknown as string) === (u.userId as unknown as string);
          return (
            <div key={(u.userId as unknown as string)} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-gray-800" title={`Last seen ${formatRelative(u.lastSeen)}`}>
                {u.name}
              </span>
              {isYou && (
                <Badge className="bg-blue-100 text-blue-800">You</Badge>
              )}
            </div>
          );
        })}
        {online && online.length === 0 && (
          <div className="text-sm text-gray-500">No one is online right now.</div>
        )}
      </div>
    </div>
  );
}
