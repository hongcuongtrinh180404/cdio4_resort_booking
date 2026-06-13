"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { get } from "@/lib/api";
import { formatVND } from "@/lib/utils";
import Link from "next/link";
import { Icon } from "@iconify/react";

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
  status: string;
  roomType: { id: number; name: string };
  images: RoomImage[];
  amenities: RoomAmenity[];
}

function RoomDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkInParam = searchParams.get("checkIn") || undefined;
  const checkOutParam = searchParams.get("checkOut") || undefined;
  const adultsParam = searchParams.get("adults") || undefined;
  const childrenParam = searchParams.get("children") || undefined;
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    get<Room>(`/rooms/${params.id}`)
      .then((res) => {
        setRoom(res);
        setSelectedImage(0);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-96 bg-surface-container-high rounded-2xl" />
          <div className="h-8 bg-surface-container-high rounded w-1/3" />
          <div className="h-4 bg-surface-container-high rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-20 text-center">
        <p className="font-body-lg text-body-lg text-on-surface-variant">Không tìm thấy phòng</p>
        <button
          onClick={() => router.back()}
          className="mt-4 inline-block text-primary font-label-caps text-label-caps font-bold"
        >
          &larr; Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-primary font-label-caps text-label-caps font-bold hover:text-primary/80 transition-colors mb-6"
      >
        <Icon icon="material-symbols:arrow-back" className="text-sm" />
        Quay lại danh sách
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="h-[350px] md:h-[450px] rounded-2xl overflow-hidden border border-outline">
            {room.images[selectedImage]?.imageUrl ? (
              <img
                src={room.images[selectedImage].imageUrl}
                alt={room.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <Icon icon="material-symbols:image" className="text-4xl" />
              </div>
            )}
          </div>
          {room.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {room.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                    selectedImage === i
                      ? "border-primary shadow-md"
                      : "border-outline hover:border-primary/50"
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={`${room.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Room details */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-container text-on-primary-container px-3 py-0.5 rounded-full font-label-caps text-label-caps font-semibold text-xs">
                {room.roomType.name}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Phòng {room.roomNumber}
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-2">
              {room.name}
            </h1>
            <p className="font-headline-sm text-headline-sm text-primary font-bold">
              {formatVND(room.pricePerNight)}
              <span className="font-body-md text-body-md text-on-surface-variant font-normal">
                /đêm
              </span>
            </p>
          </div>

          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {room.description}
          </p>

          <div className="flex items-center gap-4 text-on-surface-variant font-body-sm text-body-sm">
            <span className="flex items-center gap-1.5">
              <Icon icon="material-symbols:groups" className="text-lg" />
              {room.capacity} khách
            </span>
            {room.status === "AVAILABLE" && (
              <span className="flex items-center gap-1.5 text-green-600">
                <Icon icon="material-symbols:check-circle" className="text-lg" />
                Còn phòng
              </span>
            )}
          </div>

          {/* Amenities section */}
          {room.amenities && room.amenities.length > 0 && (
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">
                Tiện nghi nổi bật
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {room.amenities.map((ra) => (
                  <div
                    key={ra.amenity.id}
                    className="flex items-center gap-2.5 bg-surface-container-low px-3 py-2.5 rounded-lg"
                  >
                    {ra.amenity.icon && (
                      <Icon icon={`material-symbols:${ra.amenity.icon.replace(/_/g, "-")}`} className="text-primary text-lg" />
                    )}
                    <span className="font-body-sm text-body-sm text-on-surface">
                      {ra.amenity.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Link
              href={`/bookings/new?roomId=${room.id}${checkInParam ? `&checkIn=${checkInParam}` : ""}${checkOutParam ? `&checkOut=${checkOutParam}` : ""}${adultsParam ? `&adults=${adultsParam}` : ""}${childrenParam ? `&children=${childrenParam}` : ""}`}
              className="inline-block bg-primary hover:bg-primary/95 text-on-primary px-8 py-3.5 rounded-full font-label-caps text-label-caps font-semibold transition-all duration-200 shadow-md active:scale-95"
            >
              Đặt phòng ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoomDetailPage() {
  return (
    <Suspense fallback={null}>
      <RoomDetailContent />
    </Suspense>
  );
}
