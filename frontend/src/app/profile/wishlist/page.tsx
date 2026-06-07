"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { get, del } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";
import Link from "next/link";

interface WishlistItem {
  id: number;
  room: { id: number; name: string; pricePerNight: number; roomType: { name: string } };
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) { router.push("/login"); return; }
    get<WishlistItem[]>("/wishlist").then(setItems);
  }, [router]);

  const remove = async (roomId: number) => {
    await del(`/wishlist/${roomId}`);
    setItems(items.filter((i) => i.room.id !== roomId));
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Phòng yêu thích</h1>
      {items.length === 0 ? <p>Chưa có phòng nào.</p> : (
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Link href={`/rooms/${item.room.id}`} className="font-semibold text-blue-600 hover:underline">
                  {item.room.name}
                </Link>
                <p className="text-sm text-gray-500">{item.room.roomType.name}</p>
              </div>
              <button onClick={() => remove(item.room.id)} className="text-sm text-red-600 hover:underline">
                Xoá
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
