"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";

interface Dashboard {
  totalRooms: number;
  activeBookings: number;
  totalUsers: number;
  pendingBookings: number;
  totalRevenue: number;
}

const STAT_CARDS = [
  { key: "totalRooms", label: "Tổng số phòng", icon: "meeting_room", color: "bg-blue-500" },
  { key: "activeBookings", label: "Đã xác nhận", icon: "check_circle", color: "bg-green-500" },
  { key: "pendingBookings", label: "Chờ thanh toán", icon: "hourglass_empty", color: "bg-yellow-500" },
  { key: "totalUsers", label: "Người dùng", icon: "people", color: "bg-purple-500" },
];

function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-outline p-5 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-6 bg-gray-200 rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);

  useEffect(() => {
    get<Dashboard>("/admin/dashboard").then(setData);
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">Dashboard</h1>
        <p className="text-body-md text-on-surface-variant mt-1">Tổng quan hoạt động của resort</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {!data ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          STAT_CARDS.map((card) => (
            <div key={card.key} className="bg-white rounded-xl border border-outline p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-white text-2xl">{card.icon}</span>
                </div>
                <div>
                  <p className="text-body-sm text-on-surface-variant">{card.label}</p>
                  <p className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    {data[card.key as keyof Dashboard]?.toLocaleString("vi-VN") ?? 0}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Revenue Card */}
      {data && (
        <div className="bg-white rounded-xl border border-outline p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">payments</span>
            </div>
            <div>
              <p className="text-body-sm text-on-surface-variant">Tổng doanh thu</p>
              <p className="font-headline-md text-headline-md font-bold text-primary">
                {formatVND(Number(data.totalRevenue))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
