"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import { hasRole } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Dashboard {
  totalRooms: number;
  activeBookings: number;
  totalUsers: number;
  pendingBookings: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (!hasRole("EMPLOYEE", "ADMIN")) { router.push("/"); return; }
    get<Dashboard>("/admin/dashboard").then(setData);
  }, [router]);

  if (!data) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{data.totalRooms}</p><p className="text-sm text-gray-500">Phòng</p></div>
        <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{data.activeBookings}</p><p className="text-sm text-gray-500">Đã xác nhận</p></div>
        <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{data.pendingBookings}</p><p className="text-sm text-gray-500">Chờ thanh toán</p></div>
        <div className="rounded-lg border p-4"><p className="text-2xl font-bold">{data.totalUsers}</p><p className="text-sm text-gray-500">Người dùng</p></div>
      </div>
      <div className="mt-6 rounded-lg border p-4">
        <p className="text-lg font-semibold">Doanh thu: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data.totalRevenue)}</p>
      </div>
      <div className="mt-6 flex gap-4">
        <Link href="/admin/rooms" className="text-blue-600 hover:underline">Quản lý phòng</Link>
        <Link href="/admin/bookings" className="text-blue-600 hover:underline">Quản lý booking</Link>
        <Link href="/admin/reports" className="text-blue-600 hover:underline">Báo cáo</Link>
      </div>
    </div>
  );
}
