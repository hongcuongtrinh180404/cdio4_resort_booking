"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import { hasRole } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Booking {
  id: number;
  bookingCode: string;
  status: string;
  user: { fullName: string };
  room: { name: string };
  totalAmount: number;
  createdAt: string;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!hasRole("EMPLOYEE", "ADMIN")) { router.push("/"); return; }
    get<Booking[]>("/bookings").then(setBookings);
  }, [router]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Quản lý booking</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Mã</th>
            <th className="p-2">Khách</th>
            <th className="p-2">Phòng</th>
            <th className="p-2">Tổng</th>
            <th className="p-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="p-2">{b.bookingCode}</td>
              <td className="p-2">{b.user.fullName}</td>
              <td className="p-2">{b.room.name}</td>
              <td className="p-2">{b.totalAmount.toLocaleString("vi-VN")} VND</td>
              <td className="p-2">{b.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
