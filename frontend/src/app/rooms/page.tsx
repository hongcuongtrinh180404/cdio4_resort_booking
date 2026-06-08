"use client";

import { useCallback, useEffect, useState } from "react";
import { get } from "@/lib/api";
import { RoomCard } from "@/components/rooms/RoomCard";
import { formatVND } from "@/lib/utils";

interface RoomImage {
  imageUrl: string;
  sortOrder: number;
}

interface Amenity {
  id: number;
  name: string;
  icon: string | null;
}

interface RoomAmenity {
  amenityId: number;
  amenity: Amenity;
}

interface Room {
  id: number;
  name: string;
  roomNumber: string;
  capacity: number;
  pricePerNight: number;
  status: string;
  roomType: { id: number; name: string };
  images: RoomImage[];
  amenities: RoomAmenity[];
}

interface RoomType {
  id: number;
  name: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedTypeId, setSelectedTypeId] = useState<number | "">("");
  const [selectedCapacity, setSelectedCapacity] = useState<number | "">("");
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "">("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTypeId) params.set("roomTypeId", String(selectedTypeId));
      if (selectedCapacity) params.set("capacity", String(selectedCapacity));
      if (checkIn) params.set("checkIn", checkIn);
      if (checkOut) params.set("checkOut", checkOut);
      if (selectedAmenityIds.length > 0) {
        params.set("amenityIds", selectedAmenityIds.join(","));
      }

      const res = await get<Room[]>(`/rooms?${params.toString()}`);
      let sorted = [...res];
      if (sortBy === "price_asc") sorted.sort((a, b) => a.pricePerNight - b.pricePerNight);
      if (sortBy === "price_desc") sorted.sort((a, b) => b.pricePerNight - a.pricePerNight);
      setRooms(sorted);
    } finally {
      setLoading(false);
    }
  }, [selectedTypeId, selectedCapacity, selectedAmenityIds, sortBy, checkIn, checkOut]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    get<RoomType[]>("/room-types").then(setRoomTypes).catch(() => {});
    get<Amenity[]>("/rooms/amenities").then(setAmenities).catch(() => {});
  }, []);

  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          Danh sách phòng
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Tìm phòng phù hợp với nhu cầu của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 space-y-8">
          {/* Date filters */}
          <div className="space-y-4">
            <h4 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
              Ngày
            </h4>
            <div className="space-y-3">
              <div>
                <label className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                  Nhận phòng
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface"
                />
              </div>
              <div>
                <label className="font-body-sm text-body-sm text-on-surface-variant block mb-1">
                  Trả phòng
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface"
                />
              </div>
            </div>
          </div>

          {/* Room type filter */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
              Loại phòng
            </h4>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(Number(e.target.value) || "")}
              className="w-full px-3 py-2.5 rounded-lg border border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface appearance-none"
            >
              <option value="">Tất cả</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity filter */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
              Số khách
            </h4>
            <select
              value={selectedCapacity}
              onChange={(e) => setSelectedCapacity(Number(e.target.value) || "")}
              className="w-full px-3 py-2.5 rounded-lg border border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface appearance-none"
            >
              <option value="">Tất cả</option>
              {[1, 2, 3, 4, 6, 8].map((c) => (
                <option key={c} value={c}>
                  {c}+ khách
                </option>
              ))}
            </select>
          </div>

          {/* Amenity filter */}
          {amenities.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
                Tiện nghi
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {amenities.map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center gap-2.5 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenityIds.includes(amenity.id)}
                      onChange={() => toggleAmenity(amenity.id)}
                      className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
                    />
                    {amenity.icon && (
                      <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary transition-colors">
                        {amenity.icon}
                      </span>
                    )}
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {amenity.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div className="space-y-3">
            <h4 className="font-label-caps text-label-caps text-on-surface uppercase tracking-wider font-semibold">
              Sắp xếp
            </h4>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3 py-2.5 rounded-lg border border-outline bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-body-md text-body-md text-on-surface appearance-none"
            >
              <option value="">Mặc định</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>

          <button
            onClick={fetchRooms}
            className="w-full bg-primary hover:bg-primary/95 text-on-primary py-2.5 rounded-lg font-label-caps text-label-caps font-semibold transition-all duration-200 active:scale-95"
          >
            Áp dụng
          </button>
        </div>

        {/* Room List */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-surface rounded-2xl border border-outline h-[400px] animate-pulse"
                >
                  <div className="h-[220px] bg-surface-container-high rounded-t-2xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-surface-container-high rounded w-3/4" />
                    <div className="h-4 bg-surface-container-high rounded w-1/2" />
                    <div className="h-6 bg-surface-container-high rounded w-1/3 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
              <p className="font-body-lg text-body-lg">Không tìm thấy phòng phù hợp</p>
              <p className="font-body-sm text-body-sm mt-1">Thử thay đổi bộ lọc của bạn</p>
            </div>
          ) : (
            <>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">
                Hiển thị {rooms.length} phòng
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
