import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import { toast } from "sonner";

export function ChatBox() {
  const { isAuthenticated } = useAuth();
  const [text, setText] = useState("");
  const messages = useQuery(api.messages.list, { channel: "global" });
  const send = useMutation(api.messages.send);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const handleSend = async () => {
    const value = text.trim();
    if (!value) return;
    try {
      await send({ channel: "global", text: value });
      setText("");
    } catch (e) {
      toast.error("Failed to send. Please try again.");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isAuthenticated && text.trim()) {
        handleSend();
      }
    }
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 border border-gray-200 rounded-lg">
        <ScrollArea className="h-80 p-4">
          <div className="space-y-3">
            {(messages ?? []).slice().reverse().map((m) => (
              <div key={m._id} className="text-sm">
                <span className="font-semibold text-gray-900">{m.name}</span>
                <span className="text-gray-400 mx-2">•</span>
                <span className="text-gray-600">{m.text}</span>
              </div>
            ))}
            {messages && messages.length === 0 && (
              <div className="text-gray-500 text-sm">
                No messages yet. Be the first to say hello!
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>
      <div className="mt-3 flex gap-2">
        <Input
          placeholder={isAuthenticated ? "Type a message..." : "Sign in to chat"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={!isAuthenticated}
        />
        <Button
          onClick={handleSend}
          disabled={!isAuthenticated || !text.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          Send
        </Button>
      </div>
      {!isAuthenticated && (
        <p className="text-xs text-gray-500 mt-2">
          You must be signed in to participate. Click Get Started above.
        </p>
      )}
    </div>
  );
}