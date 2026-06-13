"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { post } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Icon } from "@iconify/react";

interface Message {
  role: "user" | "assistant" | "staff";
  content: string;
  action?: string;
  data?: any;
  redirectUrl?: string;
}

interface ChatResponse {
  reply: string;
  action?: string;
  data?: any;
  redirectUrl?: string;
}

function formatVND(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

function RoomCard({ room }: { room: any }) {
  const img = room.images?.[0] || "";
  return (
    <Link
      href={`/rooms/${room.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-outline/20 hover:border-primary/40 hover:shadow-sm transition-all group"
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-container-high shrink-0">
        {img ? (
          <img src={img} alt={room.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant/40">
            <Icon icon="material-symbols:image" className="text-2xl" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors truncate">
          {room.name}
        </p>
        <p className="text-xs text-on-surface-variant">{room.roomType} · {room.capacity} khách</p>
        <p className="text-sm font-bold text-primary">{formatVND(room.pricePerNight)} / đêm</p>
      </div>
      <Icon icon="material-symbols:chevron-right" className="text-on-surface-variant/50 text-lg" />
    </Link>
  );
}

function RoomList({ rooms }: { rooms: any[] }) {
  return (
    <div className="space-y-2 mt-2">
      {rooms.map((room: any) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}

function BookingCard({ data }: { data: any }) {
  const total = data.totalAmount ? Number(data.totalAmount) : 0;
  return (
    <div className="mt-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
      <p className="text-sm font-semibold text-on-surface">Mã booking: <span className="text-primary">{data.bookingCode}</span></p>
      <p className="text-lg font-bold text-primary mt-1">{formatVND(total)}</p>
      <Link
        href={`/bookings/${data.id}`}
        className="mt-3 inline-flex items-center justify-center w-full bg-primary text-on-primary py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95"
      >
        Thanh toán ngay
      </Link>
    </div>
  );
}

function BookingProposal({ data, onConfirm, confirming }: { data: any; onConfirm: () => void; confirming: boolean }) {
  const total = data.estimatedTotal ? Number(data.estimatedTotal) : 0;
  return (
    <div className="mt-2 p-4 rounded-xl bg-green-50 border border-green-300">
      <p className="text-sm font-bold text-green-800 mb-2"><Icon icon="material-symbols:check-small" className="inline-block align-middle" /> Phòng còn trống</p>
      <p className="text-sm font-semibold text-on-surface">{data.roomName}</p>
      <p className="text-xs text-on-surface-variant mt-1">{data.checkInDate} → {data.checkOutDate} ({data.numberOfNights} đêm)</p>
      <p className="text-lg font-bold text-green-700 mt-2">{formatVND(total)}</p>
      <button
        onClick={onConfirm}
        disabled={confirming}
        className="mt-3 inline-flex items-center justify-center w-full bg-green-600 text-white py-2.5 rounded-full text-sm font-semibold hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50"
      >
        {confirming ? "Đang xử lý..." : "Đặt ngay"}
      </button>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Xin chào! Tôi là trợ lý đặt phòng của DTUVIVI. Tôi có thể giúp gì cho bạn?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket for real-time staff replies
  useEffect(() => {
    if (!open) return;
    const token = getToken();
    if (!token) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const socketUrl = API_URL.replace("/api", "");
    const socket: Socket = io(`${socketUrl}/ws`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("new_message", (data: { role: string; content: string }) => {
      if (data.role === "staff") {
        setMessages((prev) => [...prev, { role: "staff", content: data.content }]);
      }
    });

    return () => { socket.disconnect(); };
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (!getToken()) {
      window.location.href = "/login";
      return;
    }

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await post<ChatResponse>("/chat", { message: userMsg });
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.reply, action: res.action, data: res.data, redirectUrl: res.redirectUrl },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (data: any) => {
    setConfirming(true);
    try {
      const res = await post<{ bookingId: number; bookingCode: string; totalAmount: number }>("/chat/confirm-booking", {
        roomId: data.roomId,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        serviceIds: data.serviceIds?.length ? data.serviceIds : undefined,
        comboIds: data.comboIds?.length ? data.comboIds : undefined,
      });
      window.location.href = `/bookings/${res.bookingId}`;
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, đã có lỗi xảy ra khi đặt phòng. Vui lòng thử lại sau." },
      ]);
    } finally {
      setConfirming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary/90 transition-all duration-200 active:scale-95 flex items-center justify-center"
          aria-label="Chat với trợ lý DTUVIVI"
        >
          <Icon icon="material-symbols:chat" className="text-2xl" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[750px] max-[782px]:w-[calc(100vw-32px)] max-[782px]:right-4 h-[900px] max-h-[calc(100vh-180px)] glass-card rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="bg-primary text-on-primary px-5 py-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Icon icon="material-symbols:smart-toy" className="text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Trợ lý DTUVIVI</p>
              <p className="text-xs text-white/70">Hỗ trợ đặt phòng 24/7</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <Icon icon="material-symbols:close" className="text-xl" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-white/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-on-primary rounded-br-md"
                      : "bg-surface-container-high text-on-surface rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && msg.action === "rooms" && msg.data?.length > 0 && (
                    <RoomList rooms={msg.data} />
                  )}
                  {msg.role === "assistant" && msg.action === "booking" && msg.data && (
                    <BookingCard data={msg.data} />
                  )}
                  {msg.role === "assistant" && msg.action === "booking_proposal" && msg.data && (
                    <BookingProposal data={msg.data} onConfirm={() => handleConfirmBooking(msg.data)} confirming={confirming} />
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-surface-container-high text-on-surface px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-outline/20 px-4 py-3 bg-white/80">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                disabled={loading}
                className="flex-1 h-10 px-4 rounded-full border border-outline/30 bg-background text-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Icon icon="material-symbols:send" className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
