"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import Link from "next/link";

interface Room {
  id: number;
  name: string;
  roomNumber: string;
  capacity: number;
  pricePerNight: number;
  status: string;
  roomType: { name: string };
  images: { imageUrl: string; sortOrder: number }[];
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Room[]>("/rooms").then(setRooms).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Danh sách phòng</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <Link key={room.id} href={`/rooms/${room.id}`} className="group rounded-lg border p-4 shadow hover:shadow-lg transition">
            <div className="mb-2 h-48 rounded bg-gray-200 flex items-center justify-center text-gray-500">
              {room.images[0]?.imageUrl ? (
                <img src={room.images[0].imageUrl} alt={room.name} className="h-full w-full object-cover rounded" />
              ) : (
                <span>Hình ảnh</span>
              )}
            </div>
            <h2 className="text-xl font-semibold group-hover:text-blue-600">{room.name}</h2>
            <p className="text-sm text-gray-500">{room.roomType.name} - {room.capacity} khách</p>
            <p className="mt-2 text-lg font-bold text-blue-600">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(room.pricePerNight)}/đêm
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
