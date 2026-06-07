"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import Link from "next/link";

interface Booking {
  id: number;
  bookingCode: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  room: { name: string };
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    get<Booking[]>("/bookings/my").then(setBookings);
  }, [router]);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Booking của tôi</h1>
      {bookings.length === 0 ? (
        <p>Chưa có booking nào.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Link key={b.id} href={`/bookings/${b.id}`} className="block rounded-lg border p-4 hover:shadow transition">
              <p className="font-semibold">{b.bookingCode} - {b.room.name}</p>
              <p className="text-sm text-gray-500">
                {new Date(b.checkInDate).toLocaleDateString("vi-VN")} → {new Date(b.checkOutDate).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-sm">Trạng thái: <span className="font-semibold">{b.status}</span></p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
