"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { get } from "@/lib/api";
import Link from "next/link";

interface Room {
  id: number;
  name: string;
  roomNumber: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  status: string;
  roomType: { name: string };
  images: { imageUrl: string; sortOrder: number }[];
}

export default function RoomDetailPage() {
  const params = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get<Room>(`/rooms/${params.id}`).then(setRoom).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-6">Đang tải...</div>;
  if (!room) return <div className="p-6">Không tìm thấy phòng</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link href="/rooms" className="text-blue-600 hover:underline">&larr; Quay lại</Link>
      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="h-80 rounded bg-gray-200 flex items-center justify-center">
          {room.images[0]?.imageUrl ? (
            <img src={room.images[0].imageUrl} alt={room.name} className="h-full w-full object-cover rounded" />
          ) : (
            <span className="text-gray-500">Hình ảnh</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{room.name}</h1>
          <p className="mt-2 text-gray-500">{room.roomType.name} - Phòng {room.roomNumber}</p>
          <p className="mt-4 text-gray-700">{room.description}</p>
          <div className="mt-4 space-y-2">
            <p>Sức chứa: {room.capacity} khách</p>
            <p className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(room.pricePerNight)}/đêm
            </p>
          </div>
          <Link
            href={`/bookings/new?roomId=${room.id}`}
            className="mt-6 inline-block rounded bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
          >
            Đặt ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
