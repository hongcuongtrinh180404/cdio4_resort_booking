import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const IMAGE_POOL = [
  "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522771739013-7c97f2b48a84?auto=format&fit=crop&w=800&q=80",
];

const AMENITIES = [
  { name: "Hồ bơi riêng", icon: "pool" },
  { name: "View biển", icon: "beach_access" },
  { name: "Ban công", icon: "balcony" },
  { name: "Bồn tắm nằm", icon: "bathtub" },
  { name: "Jacuzzi", icon: "hot_tub" },
  { name: "Bếp nhỏ", icon: "kitchen" },
  { name: "Minibar", icon: "local_bar" },
  { name: "Lối đi riêng ra biển", icon: "stairs" },
  { name: "Khu vực ăn uống", icon: "restaurant" },
  { name: "Ghế sofa", icon: "living" },
  { name: "View vườn", icon: "yard" },
  { name: "View núi", icon: "landscape" },
  { name: "View hồ bơi", icon: "pool" },
  { name: "Máy pha cà phê", icon: "coffee_maker" },
  { name: "Khu vui chơi trẻ em", icon: "child_care" },
];

// Amenity names for each room type (by index in AMENITIES array, 1-based)
const VILLA_AMENITIES = ["Hồ bơi riêng", "View biển", "Ban công", "Bồn tắm nằm", "Jacuzzi", "Lối đi riêng ra biển", "Khu vực ăn uống", "Ghế sofa"];
const SUITE_AMENITIES = ["Ban công", "Bếp nhỏ", "Minibar", "Ghế sofa", "View vườn", "View núi", "Máy pha cà phê"];
const DELUXE_AMENITIES = ["Bếp nhỏ", "Minibar", "Ghế sofa", "View hồ bơi", "View núi", "Máy pha cà phê", "Khu vui chơi trẻ em"];

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: { email: "admin@dtuvivi.com" },
    update: {},
    create: { email: "admin@dtuvivi.com", password: hashedPassword, fullName: "Admin", role: "ADMIN" },
  });
  await prisma.user.upsert({
    where: { email: "employee@dtuvivi.com" },
    update: {},
    create: { email: "employee@dtuvivi.com", password: hashedPassword, fullName: "Nhân viên", role: "EMPLOYEE" },
  });
  await prisma.user.upsert({
    where: { email: "guest@dtuvivi.com" },
    update: {},
    create: { email: "guest@dtuvivi.com", password: hashedPassword, fullName: "Khách hàng", phone: "0901234567", role: "GUEST" },
  });

  const villaType = await prisma.roomType.upsert({
    where: { name: "Villa" },
    update: {},
    create: { name: "Villa", description: "Ocean View Villa - Biệt thự hướng biển sang trọng" },
  });
  const suiteType = await prisma.roomType.upsert({
    where: { name: "Suite" },
    update: {},
    create: { name: "Suite", description: "Premium Garden Suite - Suite vườn cao cấp" },
  });
  const deluxeType = await prisma.roomType.upsert({
    where: { name: "Deluxe" },
    update: {},
    create: { name: "Deluxe", description: "Deluxe Family Room - Phòng gia đình tiện nghi" },
  });

  const allRooms: { roomNumber: string; name: string; roomTypeId: number; capacity: number; pricePerNight: number; description: string; amenityNames: string[] }[] = [];

  // Villa (Ocean View) — 15 rooms
  const villaNames = [
    "Ocean View Villa", "Sunset Paradise Villa", "Coral Bay Villa",
    "Seaside Retreat", "Wave Crest Villa", "Blue Horizon Villa",
    "Tropical Haven", "Mermaid Cove Villa", "Seafront Delight",
    "Palm Breeze Villa", "Starfish Villa", "Coconut Beach Villa",
    "Sailor's Villa", "Aqua Marine Villa", "Breeze Villa",
  ];
  for (let i = 0; i < 15; i++) {
    const num = String(i + 1).padStart(2, "0");
    allRooms.push({
      roomNumber: `OV-${num}`,
      name: villaNames[i],
      roomTypeId: villaType.id,
      capacity: 2,
      pricePerNight: 4500000,
      description: "Biệt thự sang trọng với tầm nhìn toàn cảnh đại dương xanh biếc, ban công rộng rãi và hồ bơi riêng tư. Thích hợp cho các cặp đôi tìm kiếm không gian lãng mạn.",
      amenityNames: VILLA_AMENITIES,
    });
  }

  // Suite (Garden) — 20 rooms
  const suiteNames = [
    "Premium Garden Suite", "Garden Bliss Suite", "Emerald Suite",
    "Rose Garden Suite", "Lily Pad Suite", "Orchid Suite",
    "Sunflower Suite", "Tulip Garden Suite", "Jasmine Suite",
    "Lavender Suite", "Daisy Suite", "Magnolia Suite",
    "Cherry Blossom Suite", "Ivy Suite", "Maple Leaf Suite",
    "Fern Garden Suite", "Lotus Suite", "Sakura Suite",
    "Peony Suite", "Violet Suite",
  ];
  for (let i = 0; i < 20; i++) {
    const num = String(i + 1).padStart(2, "0");
    allRooms.push({
      roomNumber: `GS-${num}`,
      name: suiteNames[i],
      roomTypeId: suiteType.id,
      capacity: 3,
      pricePerNight: 3200000,
      description: "Không gian yên bình và thư thái tuyệt đối ẩn mình giữa khu vườn nhiệt đới xanh mát rượi. Thiết kế mở mang lại cảm giác giao hòa với thiên nhiên.",
      amenityNames: SUITE_AMENITIES,
    });
  }

  // Deluxe (Family) — 15 rooms
  const deluxeNames = [
    "Deluxe Family Room", "Family Comfort Suite", "Cozy Family Room",
    "Happy Family Room", "Home Away Suite", "Family Retreat",
    "Sunshine Family Room", "Garden Family Suite", "Family Haven",
    "Comfort Plus Room", "Family Nest", "Joyful Family Room",
    "Peaceful Family Suite", "Deluxe Family Plus", "Grand Family Room",
  ];
  for (let i = 0; i < 15; i++) {
    const num = String(i + 1).padStart(2, "0");
    allRooms.push({
      roomNumber: `DF-${num}`,
      name: deluxeNames[i],
      roomTypeId: deluxeType.id,
      capacity: 4,
      pricePerNight: 2800000,
      description: "Căn hộ gia đình ấm cúng và tiện nghi với 2 giường lớn rộng rãi, khu vực sinh hoạt chung ấm áp, mang lại sự tiện lợi trọn vẹn cho cả nhà.",
      amenityNames: DELUXE_AMENITIES,
    });
  }

  // Create amenities
  const amenityMap: Record<string, number> = {};
  for (const a of AMENITIES) {
    const created = await prisma.amenity.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
    amenityMap[a.name] = created.id;
  }

  // Create rooms with images and amenities
  for (let idx = 0; idx < allRooms.length; idx++) {
    const r = allRooms[idx];
    const room = await prisma.room.upsert({
      where: { roomNumber: r.roomNumber },
      update: {},
      create: {
        roomNumber: r.roomNumber,
        name: r.name,
        roomTypeId: r.roomTypeId,
        capacity: r.capacity,
        pricePerNight: r.pricePerNight,
        description: r.description,
      },
    });

    // Add 2 images per room
    const img1Idx = idx % IMAGE_POOL.length;
    const img2Idx = (idx + 1) % IMAGE_POOL.length;
    await prisma.roomImage.deleteMany({ where: { roomId: room.id } });
    await prisma.roomImage.createMany({
      data: [
        { roomId: room.id, imageUrl: IMAGE_POOL[img1Idx], sortOrder: 0 },
        { roomId: room.id, imageUrl: IMAGE_POOL[img2Idx], sortOrder: 1 },
      ],
    });

    // Add amenities
    await prisma.roomAmenity.deleteMany({ where: { roomId: room.id } });
    for (const name of r.amenityNames) {
      const amenityId = amenityMap[name];
      if (amenityId) {
        await prisma.roomAmenity.create({
          data: { roomId: room.id, amenityId },
        });
      }
    }
  }

  const services = [
    { name: "Bữa sáng", description: "Buffet sáng tại nhà hàng", price: 200000 },
    { name: "Đưa đón sân bay", description: "Xe đưa đón sân bay 2 chiều", price: 500000 },
    { name: "Spa", description: "Massage thư giãn 60 phút", price: 600000 },
    { name: "Thuê xe máy", description: "Thuê xe máy 24h", price: 150000 },
    { name: "Dùng bữa tối", description: "Set dinner 3 món", price: 350000 },
  ];
  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  const breakfast = await prisma.service.findUnique({ where: { name: "Bữa sáng" } });
  const airport = await prisma.service.findUnique({ where: { name: "Đưa đón sân bay" } });
  const spa = await prisma.service.findUnique({ where: { name: "Spa" } });
  const dinner = await prisma.service.findUnique({ where: { name: "Dùng bữa tối" } });
  if (breakfast && dinner && spa && airport) {
    await prisma.serviceCombo.upsert({
      where: { name: "Honeymoon Package" },
      update: {},
      create: {
        name: "Honeymoon Package",
        description: "Gói trăng mật lãng mạn",
        comboPrice: 1500000,
        items: { create: [{ serviceId: breakfast.id }, { serviceId: dinner.id }, { serviceId: spa.id }] },
      },
    });
    await prisma.serviceCombo.upsert({
      where: { name: "Business Package" },
      update: {},
      create: {
        name: "Business Package",
        description: "Gói công tác tiện lợi",
        comboPrice: 800000,
        items: { create: [{ serviceId: breakfast.id }, { serviceId: airport.id }] },
      },
    });
  }

  const vouchers = [
    { code: "WELCOME10", description: "Giảm 10% cho lần đầu đặt phòng", discountType: "PERCENTAGE" as const, discountValue: 10, maxUsage: 100, startDate: new Date("2025-01-01"), endDate: new Date("2027-12-31") },
    { code: "SUMMER500", description: "Giảm 500,000 VND cho kỳ nghỉ hè", discountType: "FIXED_AMOUNT" as const, discountValue: 500000, maxUsage: 50, startDate: new Date("2025-06-01"), endDate: new Date("2026-09-30") },
    { code: "VIP1000", description: "Giảm 1,000,000 VND cho khách VIP", discountType: "FIXED_AMOUNT" as const, discountValue: 1000000, maxUsage: 20, startDate: new Date("2025-01-01"), endDate: new Date("2026-12-31") },
  ];
  for (const voucher of vouchers) {
    await prisma.voucher.upsert({
      where: { code: voucher.code },
      update: {},
      create: voucher,
    });
  }

  console.log("Seed completed successfully!");
  console.log("  Rooms:       50 rooms (15 Villa, 20 Suite, 15 Deluxe)");
  console.log("  Amenities:   15 amenities");
  console.log("  Images:      100 images (2 per room)");
  console.log("  Admin:       admin@dtuvivi.com / 123456");
  console.log("  Employee:    employee@dtuvivi.com / 123456");
  console.log("  Guest:       guest@dtuvivi.com / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
