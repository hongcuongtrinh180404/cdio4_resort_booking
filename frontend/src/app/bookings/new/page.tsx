"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { post, get } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface OccupiedRange {
  from: string;
  to: string;
}

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomId = Number(searchParams.get("roomId")) || 0;
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [error, setError] = useState("");
  const [occupied, setOccupied] = useState<OccupiedRange[]>([]);

  useEffect(() => {
    if (!roomId) return;
    get<{ occupied: OccupiedRange[] }>(`/rooms/${roomId}/availability`).then((data) => {
      setOccupied(data.occupied);
    }).catch(() => {});
  }, [roomId]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateOccupied = (date: Date) => {
    return occupied.some((o) => {
      const from = new Date(o.from);
      const to = new Date(o.to);
      return date >= from && date < to;
    });
  };

  const isDayDisabled = (date: Date) => {
    if (date < today) return true;
    if (isDateOccupied(date)) return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    try {
      const booking: any = await post("/bookings", {
        roomId,
        checkInDate: checkIn ? format(checkIn, "yyyy-MM-dd") : "",
        checkOutDate: checkOut ? format(checkOut, "yyyy-MM-dd") : "",
      });
      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      setError(err.body?.message ?? "Đặt phòng thất bại");
    }
  };

  return (
    <div className="mx-auto p-6 flex flex-col gap-8">
      <h1 className="text-2xl font-bold">Đặt phòng</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Ngày nhận phòng
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 border-outline")}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {checkIn ? format(checkIn, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={(d) => { setCheckIn(d); setCheckOut(undefined); }}
                  disabled={isDayDisabled}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Ngày trả phòng
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 border-outline")}>
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {checkOut ? format(checkOut, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={(d) => d && setCheckOut(d)}
                  disabled={(d) => d <= (checkIn ?? today) || isDayDisabled(d)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-semibold text-sm hover:bg-primary/95">
          Xác nhận đặt phòng
        </Button>
      </form>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="p-6">Đang tải...</div>}>
      <NewBookingForm />
    </Suspense>
  );
}
