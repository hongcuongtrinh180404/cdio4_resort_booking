import Link from "next/link";
import { formatVND } from "@/lib/utils";

interface RoomAmenity {
  amenity: {
    id: number;
    name: string;
    icon: string | null;
  };
}

interface RoomCardProps {
  room: {
    id: number;
    name: string;
    pricePerNight: number;
    capacity: number;
    roomType: { name: string };
    images: { imageUrl: string }[];
    amenities?: RoomAmenity[];
  };
}

export function RoomCard({ room }: RoomCardProps) {
  const displayAmenities = room.amenities?.slice(0, 4) ?? [];

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group bg-surface rounded-2xl border border-outline overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      <div className="relative h-[220px] overflow-hidden">
        {room.images[0]?.imageUrl ? (
          <img
            src={room.images[0].imageUrl}
            alt={room.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-body-sm">
            Hình ảnh
          </div>
        )}
        <div className="absolute top-3 left-3 bg-primary-container text-on-primary-container px-2.5 py-0.5 rounded-full font-label-caps text-label-caps font-semibold text-xs shadow-sm">
          {room.roomType.name}
        </div>
      </div>

      <div className="p-5 flex flex-col justify-between flex-grow">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
              {room.name}
            </h3>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-3">
            {room.capacity} khách
          </p>

          {displayAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {displayAmenities.map((ra) => (
                <span
                  key={ra.amenity.id}
                  className="inline-flex items-center gap-1 text-xs text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded-full"
                >
                  {ra.amenity.icon && (
                    <span className="material-symbols-outlined text-[12px]">{ra.amenity.icon}</span>
                  )}
                  {ra.amenity.name}
                </span>
              ))}
              {(room.amenities?.length ?? 0) > 4 && (
                <span className="text-xs text-primary font-semibold">
                  +{room.amenities!.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-outline/50 mt-auto">
          <p className="font-headline-sm text-headline-sm text-primary font-bold">
            {formatVND(room.pricePerNight)}
            <span className="text-xs text-on-surface-variant font-normal">/đêm</span>
          </p>
          <span className="text-primary font-label-caps text-label-caps font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Đặt ngay
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
