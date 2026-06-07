import Link from "next/link";

interface RoomCardProps {
  room: {
    id: number;
    name: string;
    pricePerNight: number;
    capacity: number;
    roomType: { name: string };
    images: { imageUrl: string }[];
  };
}

export function RoomCard({ room }: RoomCardProps) {
  return (
    <Link href={`/rooms/${room.id}`} className="group rounded-lg border p-4 shadow hover:shadow-lg transition">
      <div className="mb-2 h-48 rounded bg-gray-200 flex items-center justify-center text-gray-500">
        {room.images[0]?.imageUrl ? (
          <img src={room.images[0].imageUrl} alt={room.name} className="h-full w-full object-cover rounded" />
        ) : (
          <span>Hình ảnh</span>
        )}
      </div>
      <h2 className="text-xl font-semibold group-hover:text-blue-600">{room.name}</h2>
      <p className="text-sm text-gray-500">{room.roomType.name} - {room.capacity} khách</p>
      <p className="mt-2 text-lg font-bold text-blue-600">
        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(room.pricePerNight)}/đêm
      </p>
    </Link>
  );
}
