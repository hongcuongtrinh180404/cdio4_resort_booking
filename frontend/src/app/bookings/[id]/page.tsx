"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { get, post } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

interface Booking {
  id: number;
  bookingCode: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  totalAmount: number;
  room: { name: string };
  payment: { id: number } | null;
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    get<Booking>(`/bookings/${params.id}`).then(setBooking).finally(() => setLoading(false));
  }, [params.id, router]);

  const handlePay = async () => {
    await post("/payments/mock", { bookingId: booking!.id });
    setBooking({ ...booking!, status: "CONFIRMED" });
  };

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!booking) return <div className="p-6">Không tìm thấy booking</div>;

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="mb-4 text-2xl font-bold">Chi tiết đặt phòng</h1>
      <div className="space-y-2 rounded-lg border p-4">
        <p>Mã booking: <strong>{booking.bookingCode}</strong></p>
        <p>Phòng: <strong>{booking.room.name}</strong></p>
        <p>Nhận phòng: {new Date(booking.checkInDate).toLocaleDateString("vi-VN")}</p>
        <p>Trả phòng: {new Date(booking.checkOutDate).toLocaleDateString("vi-VN")}</p>
        <p>Số đêm: {booking.numberOfNights}</p>
        <p className="text-xl font-bold">
          Tổng: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(booking.totalAmount)}
        </p>
        <p>Trạng thái: <span className="font-semibold">{booking.status}</span></p>
      </div>
      {booking.status === "PENDING" && (
        <button onClick={handlePay} className="mt-4 w-full rounded bg-green-600 py-3 text-white font-semibold hover:bg-green-700">
          Thanh toán qua VNPay
        </button>
      )}
    </div>
  );
}
