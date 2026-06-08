"use client";

import Link from "next/link";
import { useState } from "react";
import { RoomModal } from "./RoomModal";

const rooms = [
  {
    key: "ocean-view",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuASp4dRIb8eVHUZJQLq6X_Vk310biTzZvhIxquPvzPRvro2eZ_RrFO7O3qFNYFzmrXvoa7JiCuRhGRFsUhAcTOg9GzLxHijCUvXO_N6H2vrNSizHI2W15YAU0kC48ket3OTOFi_SBDJrOtFXQ3-7yTgXnbb0pKiMXOi0QLEAsWl-tizxt8-dUoPCtB1scFlkUwl9MN2IzIZ7E6byECvrElZwsPqsqW2dRdZwEOtzexVzsKxmdYImU7m2RNEMhobpXPOi3owNDqA9MJe",
    badge: "Phổ biến nhất",
    badgeClass: "bg-primary text-on-primary",
    title: "Ocean View Villa",
    rating: "4.9",
    description:
      "Biệt thự sang trọng hướng biển với ban công rộng lớn đón trọn bình minh và bể bơi vô cực riêng tư.",
    price: "4.500.000đ",
  },
  {
    key: "garden-suite",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAyihwrVwX3fBPfaL7VobqLLKTZN5s5RPdSUSLdqilbv6cRpnoeOlv0gmKVWaAdPYpzVp4MZCtlKhTryh_eNPhy7GPUugss4OXs8s_XelMXcUQFOdIsbLsnyfX9VwPfx6q7MaZ1esiO_45rtIkcR0Fu9hBr05tKmDJ9ReDuxspKaQDbJ9yozBV5BglhnmP0Hc_riCs-bHvNeNKXaLtOsvzUHu5CdxJwQLJAs7OZjePEf7XmbqaxxvZICmQRddSaldtQBGoQ8OnCSOaE",
    badge: "Không gian xanh",
    badgeClass: "bg-secondary text-on-secondary",
    title: "Premium Garden Suite",
    rating: "4.8",
    description:
      "Thiết kế mở giao hòa tuyệt đối với thiên nhiên, ẩn mình giữa khu vườn nhiệt đới xanh mát rượi.",
    price: "3.200.000đ",
  },
  {
    key: "family-room",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
    badge: "Cho cả gia đình",
    badgeClass: "bg-primary-container text-on-primary-container",
    title: "Deluxe Family Room",
    rating: "4.7",
    description:
      "Căn hộ gia đình ấm cúng với đầy đủ trang thiết bị tiện nghi, mang lại cảm giác thoải mái như ở nhà.",
    price: "2.800.000đ",
  },
];

export function FeaturedRooms() {
  const [modalRoom, setModalRoom] = useState<string | null>(null);

  return (
    <section className="py-16 md:py-24 max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop" id="rooms">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div className="max-w-2xl">
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-3 tracking-tight">
            Không gian nghỉ dưỡng đẳng cấp
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Trải nghiệm sự xa hoa và thoải mái tối đa trong từng chi tiết. Mỗi căn phòng đều được
            thiết kế tỉ mỉ để mang đến cho bạn kỳ nghỉ hoàn hảo nhất.
          </p>
        </div>
        <Link
          href="/rooms"
          className="text-primary font-label-caps text-label-caps font-bold flex items-center gap-1 hover:text-primary/80 transition-colors"
        >
          Xem tất cả phòng
          <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {rooms.map((room) => (
          <div
            key={room.key}
            className="group bg-surface rounded-2xl border border-outline overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-[520px]"
          >
            <div className="relative h-[280px] overflow-hidden">
              <img
                alt={room.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={room.image}
              />
              <div
                className={`absolute top-4 left-4 px-3 py-1 rounded-full font-label-caps text-label-caps font-semibold shadow-sm ${room.badgeClass}`}
              >
                {room.badge}
              </div>
            </div>

            <div className="p-6 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                    {room.title}
                  </h3>
                  <div className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-sm text-secondary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-body-sm font-semibold text-on-surface">
                      {room.rating}
                    </span>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                  {room.description}
                </p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-outline/50 mt-auto">
                <div>
                  <p className="font-body-sm text-on-surface-variant">Giá từ</p>
                  <p className="font-headline-sm text-headline-sm text-primary font-bold">
                    {room.price}
                    <span className="text-xs text-on-surface-variant font-normal">/đêm</span>
                  </p>
                </div>
                <button
                  className="px-5 py-2.5 rounded-lg border border-primary text-primary hover:bg-primary hover:text-on-primary transition-all duration-200 font-label-caps text-label-caps font-semibold active:scale-95"
                  onClick={() => setModalRoom(room.key)}
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <RoomModal roomKey={modalRoom} onClose={() => setModalRoom(null)} />
    </section>
  );
}
