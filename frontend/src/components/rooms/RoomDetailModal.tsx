"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import Link from "next/link";

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-in zoom-in-95 duration-200">
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

              <div className="flex flex-col gap-6">
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

                <div className="flex items-center justify-between pt-4 border-t border-outline">
                  <div>
                    <span className="text-2xl font-bold text-primary">{formatVND(room.pricePerNight)}</span>
                    <span className="text-body-sm text-on-surface-variant ml-1">/đêm</span>
                  </div>
                  <Link
                    href={`/bookings/new?roomId=${room.id}`}
                    className="inline-block bg-primary text-on-primary px-6 py-3 rounded-lg font-semibold text-sm hover:bg-primary/95 active:scale-[0.98] transition-all"
                  >
                    Đặt phòng ngay
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
