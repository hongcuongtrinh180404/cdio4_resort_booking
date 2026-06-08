"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { X, CalendarIcon } from "lucide-react";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Amenity {
  id: number;
  name: string;
  icon: string | null;
}

interface RoomAmenity {
  amenityId: number;
  amenity: Amenity;
}

interface RoomImage {
  imageUrl: string;
  sortOrder: number;
}

interface Room {
  id: number;
  name: string;
  roomNumber: string;
  description: string;
  capacity: number;
  pricePerNight: number;
  roomType: { name: string };
  images: RoomImage[];
  amenities: RoomAmenity[];
}

interface Props {
  roomId: number | null;
  onClose: () => void;
}

export function RoomDetailModal({ roomId, onClose }: Props) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t;
  });

  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    get<Room>(`/rooms/${roomId}`)
      .then(setRoom)
      .finally(() => setLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [roomId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (roomId) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [roomId, onClose]);

  if (!roomId) return null;

  const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  const total = room ? room.pricePerNight * nights : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in zoom-in-95 duration-200">
        {loading || !room ? (
          <div className="p-12 text-center animate-pulse space-y-4">
            <div className="h-8 bg-surface-container-high rounded w-1/3 mx-auto" />
            <div className="h-64 bg-surface-container-high rounded-xl" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-outline sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-3">
                <h2 className="font-headline-sm text-headline-sm text-on-surface">
                  {room.name}
                </h2>
                <span className="bg-primary-container text-on-primary-container px-2 py-0.5 rounded-md text-label-caps text-xs font-semibold">
                  {room.roomType.name}
                </span>
                <span className="bg-black/10 text-on-surface-variant px-2 py-0.5 rounded-md text-label-caps text-xs font-semibold">
                  #{String(room.roomNumber).padStart(3, '0')}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-full hover:bg-error-container/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-8">
              {room.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 h-auto md:h-[350px]">
                  <div className="md:col-span-2 md:row-span-2 rounded-xl overflow-hidden relative h-48 md:h-full">
                    <img
                      src={room.images[0].imageUrl}
                      alt={room.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {room.images.slice(1, 5).map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden relative h-24 md:h-auto hidden md:block">
                      <img
                        src={img.imageUrl}
                        alt={`${room.name} ${i + 2}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <section>
                    <h3 className="font-headline-sm text-headline-sm mb-3">Chi tiết phòng</h3>
                    <p className="text-body-md text-on-surface-variant leading-relaxed">
                      {room.description}
                    </p>
                  </section>

                  <section className="flex flex-wrap gap-5 py-4 border-y border-outline">
                    <div className="flex items-center gap-2 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-primary text-xl">square_foot</span>
                      120 m²
                    </div>
                    <div className="flex items-center gap-2 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-primary text-xl">bed</span>
                      King Size Bed
                    </div>
                    <div className="flex items-center gap-2 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-primary text-xl">group</span>
                      {room.capacity} Người lớn
                    </div>
                  </section>

                  {room.amenities && room.amenities.length > 0 && (
                    <section>
                      <h3 className="font-headline-sm text-headline-sm mb-4">Tiện nghi phòng</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {room.amenities.map((ra) => (
                          <div key={ra.amenity.id} className="flex items-center gap-2.5 bg-surface-container-low px-3 py-2 rounded-lg">
                            {ra.amenity.icon && (
                              <span className="material-symbols-outlined text-on-surface-variant">{ra.amenity.icon}</span>
                            )}
                            <span className="text-body-sm text-on-surface">{ra.amenity.name}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                <div className="lg:col-span-1">
                  <div className="bg-surface-container-low border border-outline rounded-xl p-5 sticky top-24 space-y-4">
                    <div className="flex items-baseline gap-1 pb-4 border-b border-outline">
                      <span className="text-2xl font-bold text-primary">{formatVND(room.pricePerNight)}</span>
                      <span className="text-body-sm text-on-surface-variant">/ đêm</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Ngày nhận phòng
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 border-outline")}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {format(checkIn, "dd/MM/yyyy", { locale: vi })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={checkIn} onSelect={(d) => d && setCheckIn(d)} disabled={(d) => d < today} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                        Ngày trả phòng
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10 border-outline")}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                            {format(checkOut, "dd/MM/yyyy", { locale: vi })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={checkOut} onSelect={(d) => d && setCheckOut(d)} disabled={(d) => d <= checkIn || d < today} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="pt-4 border-t border-outline space-y-2">
                      <div className="flex justify-between text-body-sm">
                        <span className="text-on-surface-variant">{formatVND(room.pricePerNight)} x {nights} đêm</span>
                        <span>{formatVND(room.pricePerNight * nights)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-outline">
                        <span className="font-semibold text-on-surface">Tổng tạm tính</span>
                        <span className="font-bold text-xl text-primary">{formatVND(total)}</span>
                      </div>
                    </div>

                    <a
                      href={`/bookings/new?roomId=${room.id}`}
                      className="block w-full bg-primary text-on-primary py-3 rounded-lg text-center font-semibold text-sm hover:bg-primary/95 active:scale-[0.98] transition-all"
                    >
                      Đặt phòng ngay
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
