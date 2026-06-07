"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { post } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    roomId: Number(searchParams.get("roomId")) || 0,
    checkInDate: "",
    checkOutDate: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }
    try {
      const booking: any = await post("/bookings", form);
      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      setError(err.body?.message ?? "Đặt phòng thất bại");
    }
  };

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-6 text-2xl font-bold">Đặt phòng</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          className="rounded border p-2"
          type="date"
          placeholder="Ngày nhận phòng"
          value={form.checkInDate}
          onChange={(e) => setForm({ ...form, checkInDate: e.target.value })}
          required
        />
        <input
          className="rounded border p-2"
          type="date"
          placeholder="Ngày trả phòng"
          value={form.checkOutDate}
          onChange={(e) => setForm({ ...form, checkOutDate: e.target.value })}
          required
        />
        <button className="rounded bg-blue-600 py-2 text-white font-semibold hover:bg-blue-700" type="submit">
          Xác nhận đặt phòng
        </button>
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
