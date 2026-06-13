"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { get, post } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Icon } from "@iconify/react";

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
  staff?: { id: number; fullName: string } | null;
}

interface ConversationData {
  conversation: any;
  messages: Message[];
}

export default function ChatPanel({
  userId,
  userName,
  onClose,
}: {
  userId: number;
  userName: string;
  onClose: () => void;
}) {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const res = await get<ConversationData>(`/admin/chat/${conversationId}/messages`);
      setMessages(res.messages);
    } catch {}
  };

  // Find conversation for this user
  const findConversation = async () => {
    setLoading(true);
    try {
      const convs = await get<any[]>("/admin/chat/conversations");
      const conv = convs.find((c: any) => c.userId === userId);
      if (conv) {
        setConversationId(conv.id);
        const res = await get<ConversationData>(`/admin/chat/${conv.id}/messages`);
        setMessages(res.messages);
        await patch(`/admin/chat/${conv.id}/read`);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findConversation();
  }, [userId]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!conversationId) return;
    const token = getToken();
    if (!token) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const socketUrl = API_URL.replace("/api", "");
    const socket: Socket = io(`${socketUrl}/ws`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("new_message", () => {
      fetchMessages();
    });

    return () => { socket.disconnect(); };
  }, [conversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendReply = async () => {
    if (!input.trim() || !conversationId) return;
    const content = input.trim();
    setInput("");
    try {
      await post(`/admin/chat/${conversationId}/reply`, { content });
      await fetchMessages();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-[450px] max-w-full h-full bg-white shadow-2xl flex flex-col animate-slide-left">
        <style>{`
          @keyframes slide-left { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .animate-slide-left { animation: slide-left 0.25s ease-out; }
        `}</style>

        {/* Header */}
        <div className="bg-primary text-on-primary px-5 py-4 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Icon icon="material-symbols:chat" className="text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Chat với {userName}</p>
            <p className="text-xs text-white/70">Nhân viên hỗ trợ</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <Icon icon="material-symbols:close" className="text-xl" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
          {loading ? (
            <div className="text-center py-12 text-body-sm text-on-surface-variant">Đang tải...</div>
          ) : !conversationId ? (
            <div className="text-center py-12 text-body-sm text-on-surface-variant">
              Khách hàng chưa có tin nhắn nào
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-on-primary rounded-br-md"
                      : msg.role === "staff"
                      ? "bg-green-100 text-green-900 rounded-bl-md"
                      : "bg-white text-on-surface border border-outline/20 rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-[10px] mt-1 opacity-60">
                    {msg.role === "staff" && msg.staff
                      ? `${msg.staff.fullName} · `
                      : msg.role === "assistant"
                      ? <><Icon icon="mdi:robot" className="inline-block align-middle" /> AI · </>
                      : ""}
                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {conversationId && (
          <div className="shrink-0 border-t border-outline/20 px-4 py-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 h-10 px-4 rounded-full border border-outline/30 bg-background text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                onClick={sendReply}
                disabled={!input.trim()}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Icon icon="material-symbols:send" className="text-lg" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Import patch inline to avoid circular deps
async function patch(path: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
