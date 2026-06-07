"use client";

import { useEffect, useState } from "react";
import { get } from "@/lib/api";
import { hasRole } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Room {
  id: number;
  name: string;
  roomNumber: string;
  status: string;
  roomType: { name: string };
}

export default function AdminRoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    if (!hasRole("EMPLOYEE", "ADMIN")) { router.push("/"); return; }
    get<Room[]>("/rooms").then(setRooms);
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Quản lý phòng</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Tên</th>
            <th className="p-2">Số phòng</th>
            <th className="p-2">Loại</th>
            <th className="p-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.roomNumber}</td>
              <td className="p-2">{r.roomType.name}</td>
              <td className="p-2">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
