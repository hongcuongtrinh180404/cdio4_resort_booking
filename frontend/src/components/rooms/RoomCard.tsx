"use client";

import { useState, useEffect, useCallback } from "react";
import { formatVND } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@iconify/react";

interface RoomAmenity {
  amenity: { id: number; name: string; icon: string | null };
}

interface RoomCardProps {
  room: {
    id: number;
    name: string;
    roomNumber: string;
    pricePerNight: number;
    capacity: number;
    roomType: { name: string };
    images: { imageUrl: string }[];
    amenities?: RoomAmenity[];
  };
  isWishlisted?: boolean;
  onToggleWishlist?: (roomId: number) => void;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
}

function getBadge(room: RoomCardProps["room"]): { label: string; className: string } | null {
  if (room.pricePerNight >= 4000000)
    return { label: "Sang trọng", className: "bg-primary text-on-primary" };
  if (room.capacity >= 4)
    return { label: "Phù hợp gia đình", className: "bg-secondary-container text-on-secondary-container" };
  if (room.pricePerNight <= 2800000)
    return { label: "Giá tốt", className: "bg-error text-on-error" };
  if (room.roomType?.name)
    return { label: room.roomType.name, className: "bg-primary-container text-on-primary-container" };
  return null;
}

export function RoomCard({ room, isWishlisted = false, onToggleWishlist, checkIn, checkOut, adults, children }: RoomCardProps) {
  const badge = getBadge(room);
  const displayAmenities = room.amenities?.slice(0, 4) ?? [];
  const [animating, setAnimating] = useState(false);
  const [showBounce, setShowBounce] = useState(false);

  useEffect(() => {
    if (isWishlisted) {
      const t = setTimeout(() => setShowBounce(true), 420);
      return () => clearTimeout(t);
    }
    setShowBounce(false);
  }, [isWishlisted]);

  const handleToggle = useCallback(() => {
    if (animating) return;
    setAnimating(true);
    onToggleWishlist?.(room.id);
    setTimeout(() => setAnimating(false), 700);
  }, [animating, onToggleWishlist, room.id]);

  const detailUrl = `/rooms/${room.id}${checkIn ? `?checkIn=${checkIn}` : ""}${checkOut ? `&checkOut=${checkOut}` : ""}${adults ? `&adults=${adults}` : ""}${children ? `&children=${children}` : ""}`;

  return (
    <div className="group bg-surface rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col border border-outline/50">
      <div className="relative h-56 overflow-hidden">
        {room.images[0]?.imageUrl ? (
          <img
            src={room.images[0].imageUrl}
            alt={room.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <Icon icon="material-symbols:image" className="text-3xl" />
          </div>
        )}
        {badge && (
          <span className={`absolute top-3 left-3 px-3 py-0.5 rounded-full text-label-caps text-xs font-semibold shadow-sm ${badge.className}`}>
            {badge.label}
          </span>
        )}
        <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-surface-bright px-2.5 py-0.5 rounded-md text-label-caps text-xs font-semibold shadow-sm">
          #{String(room.roomNumber).padStart(3, '0')}
        </span>

        {/* Wishlist heart */}
        <button
          onClick={handleToggle}
          disabled={animating}
          className="absolute top-3 right-3 bg-surface/80 backdrop-blur-sm p-1.5 rounded-full hover:bg-primary hover:text-on-primary transition-colors shadow-sm z-10"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Icon icon="material-symbols:favorite-outline" className="text-lg text-gray-400" />
            <Icon
              icon="material-symbols:favorite"
              className="absolute inset-0 flex items-center justify-center text-lg"
              style={{
                color: "#FF97D0",
                clipPath: isWishlisted ? "inset(0 0 0 0)" : "inset(100% 0 0 0)",
                transition: "clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
            {showBounce && (
              <Icon
                icon="material-symbols:favorite"
                className="absolute inset-0 flex items-center justify-center text-lg heart-pop"
                style={{ color: "#FF97D0" }}
                onAnimationEnd={() => setShowBounce(false)}
              />
            )}
          </div>
        </button>
      </div>

      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex justify-between items-start mb-2">
            <Link
              href={detailUrl}
              className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors"
            >
              {room.name}
            </Link>
          </div>

          <div className="flex items-center gap-3 mb-4 text-on-surface-variant">
            <span className="flex items-center gap-1 text-body-sm">
              <Icon icon="material-symbols:square-foot" className="text-base" />
              120 m²
            </span>
            <span className="flex items-center gap-1 text-body-sm">
              <Icon icon="material-symbols:bed" className="text-base" />
              King
            </span>
            <span className="flex items-center gap-1 text-body-sm">
              <Icon icon="material-symbols:group" className="text-base" />
              {room.capacity} khách
            </span>
          </div>

          {displayAmenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {displayAmenities.map((ra) => (
                <span
                  key={ra.amenity.id}
                  className="inline-flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full"
                >
                  {ra.amenity.icon && (
                    <Icon icon={`material-symbols:${ra.amenity.icon.replace(/_/g, "-")}`} className="text-[11px]" />
                  )}
                  {ra.amenity.name}
                </span>
              ))}
              {(room.amenities?.length ?? 0) > 4 && (
                <span className="text-xs text-primary font-semibold">+{room.amenities!.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-outline/50 mt-auto">
          <div>
            <span className="font-headline-sm text-headline-sm text-primary font-bold">
              {formatVND(room.pricePerNight)}
            </span>
            <span className="text-body-sm text-on-surface-variant ml-1">/đêm</span>
          </div>
          <div className="flex gap-2">
            <Link
              href={detailUrl}
              className="px-3 py-1.5 text-primary border border-primary rounded-lg text-label-caps text-xs font-semibold hover:bg-primary/5 transition-all"
            >
              Chi tiết
            </Link>
            <Link
              href={`/bookings/new?roomId=${room.id}${checkIn ? `&checkIn=${checkIn}` : ""}${checkOut ? `&checkOut=${checkOut}` : ""}${adults ? `&adults=${adults}` : ""}${children ? `&children=${children}` : ""}`}
              className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-label-caps text-xs font-semibold hover:bg-primary/95 transition-all active:scale-95"
            >
              Đặt ngay
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes heartPop {
          0% { transform: scale(1); }
          30% { transform: scale(1.4); }
          50% { transform: scale(0.85); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        .heart-pop {
          animation: heartPop 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
