"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Search, Minus, Plus } from "lucide-react";
import { get } from "@/lib/api";
import { formatVND, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RoomCard } from "@/components/rooms/RoomCard";
import { RoomDetailModal } from "@/components/rooms/RoomDetailModal";
import { Pagination } from "@/components/rooms/Pagination";

const ROOMS_PER_PAGE = 6;
const MAX_ADULTS = 10;
const MAX_CHILDREN = 5;

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
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filters
  const [checkIn, setCheckIn] = useState<Date>(today);
  const [checkOut, setCheckOut] = useState<Date>(tomorrow);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000000]);
  const [selectedTypeIds, setSelectedTypeIds] = useState<number[]>([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "">("");

  // UI
  const [currentPage, setCurrentPage] = useState(1);
  const [modalRoomId, setModalRoomId] = useState<number | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (checkIn) params.set("checkIn", format(checkIn, "yyyy-MM-dd"));
      if (checkOut) params.set("checkOut", format(checkOut, "yyyy-MM-dd"));
      if (selectedTypeIds.length === 1) params.set("roomTypeId", String(selectedTypeIds[0]));
      if (selectedAmenityIds.length > 0) params.set("amenityIds", selectedAmenityIds.join(","));

      const res = await get<Room[]>(`/rooms?${params.toString()}`);
      let filtered = [...res];

      if (selectedTypeIds.length > 1) {
        filtered = filtered.filter((r) => selectedTypeIds.includes(r.roomType.id));
      }

      filtered = filtered.filter(
        (r) => r.pricePerNight >= priceRange[0] && r.pricePerNight <= priceRange[1]
      );

      if (sortBy === "price_asc") filtered.sort((a, b) => a.pricePerNight - b.pricePerNight);
      if (sortBy === "price_desc") filtered.sort((a, b) => b.pricePerNight - a.pricePerNight);

      setAllRooms(filtered);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [checkIn, checkOut, selectedTypeIds, selectedAmenityIds, priceRange, sortBy]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    get<RoomType[]>("/room-types").then(setRoomTypes).catch(() => {});
    get<Amenity[]>("/rooms/amenities").then(setAmenities).catch(() => {});
  }, []);

  const toggleType = (id: number) => {
    setSelectedTypeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleAmenity = (id: number) => {
    setSelectedAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const clearFilters = () => {
    setCheckIn(today);
    setCheckOut(tomorrow);
    setPriceRange([0, 15000000]);
    setSelectedTypeIds([]);
    setSelectedAmenityIds([]);
    setSortBy("");
  };

  const totalPages = Math.ceil(allRooms.length / ROOMS_PER_PAGE);
  const paginatedRooms = allRooms.slice(
    (currentPage - 1) * ROOMS_PER_PAGE,
    currentPage * ROOMS_PER_PAGE
  );

  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-[320px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: "url('https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780900532/gate1_mi3bmv.png')",
        }} />
        <div className="absolute inset-0 hero-gradient backdrop-blur-[2px]" />
        <div className="relative z-10 w-full max-w-max-width px-margin-desktop text-center">
          <h1 className="font-headline-lg text-headline-lg text-surface-bright mb-10 drop-shadow-lg">
            Tìm phòng nghỉ lý tưởng
          </h1>
          <div className="bg-surface/90 backdrop-blur-xl p-5 rounded-xl shadow-xl flex flex-wrap md:flex-nowrap items-center gap-4 max-w-4xl mx-auto">
            <div className="flex-1 flex flex-col items-start gap-1">
              <span className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Ngày nhận phòng
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-10 border-outline gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">{format(checkIn, "dd/MM/yyyy", { locale: vi })}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkIn} onSelect={(d) => { if (d) { setCheckIn(d); if (d >= checkOut) { const n = new Date(d); n.setDate(n.getDate() + 1); setCheckOut(n); } } }} disabled={(d) => d < today} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 flex flex-col items-start gap-1">
              <span className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Ngày trả phòng
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal h-10 border-outline gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">{format(checkOut, "dd/MM/yyyy", { locale: vi })}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={checkOut} onSelect={(d) => d && setCheckOut(d)} disabled={(d) => d <= checkIn || d < today} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex-1 flex flex-col items-start gap-1">
              <span className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold">
                Số khách
              </span>
              <div className="flex items-center gap-2 border border-outline rounded-lg px-3 py-2 w-full h-10 bg-background">
                <span className="material-symbols-outlined text-primary text-lg">group</span>
                <select className="border-none bg-transparent focus:ring-0 text-sm p-0 w-full outline-none">
                  <option>2 Người lớn</option>
                  <option>1 Người lớn</option>
                  <option>2 Người lớn, 1 Trẻ em</option>
                  <option>2 Người lớn, 2 Trẻ em</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => fetchRooms()}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-label-caps text-xs font-semibold hover:bg-primary/95 transition-all self-end h-10 flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Cập nhật
            </button>
          </div>
        </div>
      </section>

      {/* Main Layout */}
      <main className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4 flex flex-col gap-6">
          <div className="bg-surface-container-low p-5 rounded-xl border border-outline space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm">Bộ lọc tìm kiếm</h3>
              <button
                onClick={clearFilters}
                className="text-primary text-body-sm font-semibold hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>

            {/* Price Range */}
            <div>
              <p className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-3">
                Khoảng giá (VNĐ)
              </p>
              <input
                type="range"
                min={0}
                max={15000000}
                step={500000}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full h-2 bg-outline rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-1.5 text-body-sm font-medium">
                <span>{formatVND(priceRange[0])}</span>
                <span>{formatVND(priceRange[1])}</span>
              </div>
            </div>

            {/* Room Type */}
            <div>
              <p className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-3">
                Loại phòng
              </p>
              <div className="flex flex-col gap-2.5">
                {roomTypes.map((rt) => (
                  <label key={rt.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedTypeIds.includes(rt.id)}
                      onChange={() => toggleType(rt.id)}
                      className="rounded text-primary focus:ring-primary h-4 w-4 border-outline"
                    />
                    <span className="text-body-sm text-on-surface group-hover:text-primary transition-colors">
                      {rt.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <p className="text-label-caps text-xs text-on-surface-variant uppercase tracking-wider font-semibold mb-3">
                Tiện nghi
              </p>
              <div className="flex flex-col gap-2.5 max-h-48 overflow-y-auto">
                {amenities.map((a) => (
                  <label key={a.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedAmenityIds.includes(a.id)}
                      onChange={() => toggleAmenity(a.id)}
                      className="rounded text-primary focus:ring-primary h-4 w-4 border-outline"
                    />
                    {a.icon && (
                      <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary transition-colors">
                        {a.icon}
                      </span>
                    )}
                    <span className="text-body-sm text-on-surface group-hover:text-primary transition-colors">
                      {a.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Room Grid */}
        <section className="w-full md:w-3/4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
            <p className="text-body-md font-medium">
              <span className="text-primary font-bold">{allRooms.length}</span> phòng nghỉ phù hợp
            </p>
            <div className="flex items-center gap-2">
              <span className="text-body-sm text-on-surface-variant">Sắp xếp theo:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-surface-container-low border border-outline rounded-lg px-3 py-1.5 text-body-sm focus:ring-primary focus:border-primary outline-none"
              >
                <option value="">Mặc định</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-surface rounded-xl border border-outline/50 h-[420px] animate-pulse">
                  <div className="h-56 bg-surface-container-high rounded-t-xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-surface-container-high rounded w-3/4" />
                    <div className="h-3 bg-surface-container-high rounded w-1/2" />
                    <div className="h-4 bg-surface-container-high rounded w-2/3" />
                    <div className="h-6 bg-surface-container-high rounded w-1/3 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedRooms.length === 0 ? (
            <div className="text-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl mb-4">search_off</span>
              <p className="text-body-lg font-medium">Không tìm thấy phòng phù hợp</p>
              <p className="text-body-sm mt-1">Thử thay đổi bộ lọc của bạn</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedRooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    onDetail={(id) => setModalRoomId(id)}
                  />
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </section>
      </main>

      <RoomDetailModal roomId={modalRoomId} onClose={() => setModalRoomId(null)} />
    </>
  );
}
