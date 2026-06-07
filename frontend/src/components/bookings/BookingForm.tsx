"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { post } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface BookingFormProps {
  roomId: number;
}

export function BookingForm({ roomId }: BookingFormProps) {
  const router = useRouter();
  const [dates, setDates] = useState({ checkInDate: "", checkOutDate: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) { router.push("/login"); return; }
    try {
      const booking: any = await post("/bookings", { roomId, ...dates });
      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      setError(err.body?.message ?? "Đặt phòng thất bại");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        className="rounded border p-2"
        type="date"
        value={dates.checkInDate}
        onChange={(e) => setDates({ ...dates, checkInDate: e.target.value })}
        required
      />
      <input
        className="rounded border p-2"
        type="date"
        value={dates.checkOutDate}
        onChange={(e) => setDates({ ...dates, checkOutDate: e.target.value })}
        required
      />
      <button className="rounded bg-blue-600 py-2 text-white font-semibold hover:bg-blue-700" type="submit">
        Đặt ngay
      </button>
    </form>
  );
}
