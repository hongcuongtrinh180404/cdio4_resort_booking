"use client";

import { useEffect } from "react";

interface RoomData {
  title: string;
  price: string;
  image: string;
  description: string;
  amenities: string[];
}

const roomData: Record<string, RoomData> = {
  "ocean-view": {
    title: "Ocean View Villa",
    price: "4.500.000 VNĐ",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuASp4dRIb8eVHUZJQLq6X_Vk310biTzZvhIxquPvzPRvro2eZ_RrFO7O3qFNYFzmrXvoa7JiCuRhGRFsUhAcTOg9GzLxHijCUvXO_N6H2vrNSizHI2W15YAU0kC48ket3OTOFi_SBDJrOtFXQ3-7yTgXnbb0pKiMXOi0QLEAsWl-tizxt8-dUoPCtB1scFlkUwl9MN2IzIZ7E6byECvrElZwsPqsqW2dRdZwEOtzexVzsKxmdYImU7m2RNEMhobpXPOi3owNDqA9MJe",
    description:
      "Biệt thự sang trọng với tầm nhìn toàn cảnh đại dương xanh biếc, ban công rộng rãi và hồ bơi riêng tư. Thích hợp cho các cặp đôi tìm kiếm không gian lãng mạn.",
    amenities: [
      "wifi|Free Wi-Fi",
      "ac_unit|Điều hòa nhiệt độ",
      "tv|Smart TV 55\"",
      "coffee_maker|Máy pha cà phê",
      "bathtub|Bồn tắm nằm",
      "pool|Hồ bơi riêng biệt",
    ],
  },
  "garden-suite": {
    title: "Premium Garden Suite",
    price: "3.200.000 VNĐ",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAyihwrVwX3fBPfaL7VobqLLKTZN5s5RPdSUSLdqilbv6cRpnoeOlv0gmKVWaAdPYpzVp4MZCtlKhTryh_eNPhy7GPUugss4OXs8s_XelMXcUQFOdIsbLsnyfX9VwPfx6q7MaZ1esiO_45rtIkcR0Fu9hBr05tKmDJ9ReDuxspKaQDbJ9yozBV5BglhnmP0Hc_riCs-bHvNeNKXaLtOsvzUHu5CdxJwQLJAs7OZjePEf7XmbqaxxvZICmQRddSaldtQBGoQ8OnCSOaE",
    description:
      "Không gian yên bình và thư thái tuyệt đối ẩn mình giữa khu vườn nhiệt đới xanh mát rượi. Thiết kế mở mang lại cảm giác giao hòa với thiên nhiên.",
    amenities: [
      "wifi|Free Wi-Fi",
      "ac_unit|Điều hòa nhiệt độ",
      "tv|Smart TV 49\"",
      "coffee_maker|Máy pha cà phê",
      "deck|Sân hiên riêng biệt",
      "filter_drama|Trái cây tươi chào mừng",
    ],
  },
  "family-room": {
    title: "Deluxe Family Room",
    price: "2.800.000 VNĐ",
    image:
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
    description:
      "Căn hộ gia đình ấm cúng và tiện nghi với 2 giường lớn rộng rãi, khu vực sinh hoạt chung ấm áp, mang lại sự tiện lợi trọn vẹn cho cả nhà.",
    amenities: [
      "wifi|Free Wi-Fi",
      "ac_unit|Điều hòa nhiệt độ",
      "tv|Smart TV 55\"",
      "kitchen|Tủ lạnh nhỏ & Mini Bar",
      "bathtub|Bồn tắm đứng",
      "child_care|Miễn phí khu vui chơi trẻ em",
    ],
  },
};

interface RoomModalProps {
  roomKey: string | null;
  onClose: () => void;
}

export function RoomModal({ roomKey, onClose }: RoomModalProps) {
  const room = roomKey ? roomData[roomKey] : null;

  useEffect(() => {
    if (!roomKey) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [roomKey]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-on-background/60 backdrop-blur-sm transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-outline scale-100 transition-all duration-300">
        <button
          className="absolute top-4 right-4 p-2 bg-surface/85 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low z-10 transition-colors shadow-sm"
          onClick={onClose}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="h-64 md:h-[500px]">
            <img
              alt={room.title}
              className="w-full h-full object-cover"
              src={room.image}
            />
          </div>

          <div className="p-8 flex flex-col justify-between h-auto md:h-[500px] overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface mb-2">
                  {room.title}
                </h2>
                <p className="font-headline-sm text-headline-sm text-primary font-bold">
                  {room.price}{" "}
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">
                    / đêm
                  </span>
                </p>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {room.description}
              </p>

              <div>
                <h4 className="font-label-caps text-label-caps text-on-surface font-bold uppercase tracking-wider mb-3">
                  Tiện nghi nổi bật
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {room.amenities.map((item) => {
                    const [icon, name] = item.split("|");
                    return (
                      <div
                        key={item}
                        className="flex items-center gap-2.5 text-on-surface-variant font-body-sm text-body-sm"
                      >
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          {icon}
                        </span>
                        {name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-outline/50">
              <div className="flex gap-4">
                <button
                  onClick={() => (window.location.href = "/rooms")}
                  className="flex-1 bg-primary hover:bg-primary/95 text-on-primary py-3.5 rounded-lg font-label-caps text-label-caps font-bold transition-all duration-200 shadow active:scale-95"
                >
                  Đặt phòng ngay
                </button>
                <button className="px-4 border border-outline hover:border-primary text-on-surface-variant hover:text-primary rounded-lg transition-colors flex items-center justify-center active:scale-95">
                  <span className="material-symbols-outlined">favorite_border</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
