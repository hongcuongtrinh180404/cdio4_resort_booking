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
  "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
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

    // Add 4 images per room
    const imgCount = 4;
    await prisma.roomImage.deleteMany({ where: { roomId: room.id } });
    await prisma.roomImage.createMany({
      data: Array.from({ length: imgCount }, (_, i) => ({
        roomId: room.id,
        imageUrl: IMAGE_POOL[(idx + i) % IMAGE_POOL.length],
        sortOrder: i,
      })),
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

  // ========== SERVICES ==========
  const servicesData = [
    { name: "Spa Massage", description: "Massage thư giãn toàn thân với tinh dầu thiên nhiên, giúp tái tạo năng lượng", price: 600000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Couple Massage", description: "Massage dành cho cặp đôi trong không gian riêng tư lãng mạn", price: 1000000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Sauna & Steam Bath", description: "Xông hơi khô và ướt kết hợp, thanh lọc cơ thể và thư giãn tinh thần", price: 350000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Airport Transfer", description: "Đưa đón sân bay 2 chiều bằng xe sang cao cấp", price: 500000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Private BBQ Dinner", description: "Bữa tối BBQ riêng tư bên bờ biển với thực đơn cao cấp", price: 800000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Romantic Room Decoration", description: "Trang trí phòng lãng mạn với hoa tươi, nến thơm và rượu vang", price: 500000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Breakfast Buffet", description: "Buffet sáng đa dạng với ẩm thực Á - Âu tại nhà hàng", price: 250000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Floating Breakfast", description: "Bữa sáng độc đáo phục vụ trên bể bơi riêng", price: 350000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Laundry Service", description: "Dịch vụ giặt ủi nhanh chóng, tiện lợi trong ngày", price: 100000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Bicycle Rental", description: "Thuê xe đạp khám phá khu nghỉ dưỡng và vùng lân cận", price: 150000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Kayak Rental", description: "Thuê kayak chèo thuyền trên biển, khám phá vịnh", price: 200000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Yoga Class", description: "Lớp yoga buổi sáng cùng huấn luyện viên chuyên nghiệp", price: 300000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Fitness Center Access", description: "Phòng tập gym hiện đại với đầy đủ trang thiết bị", price: 200000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Babysitting Service", description: "Dịch vụ trông trẻ chuyên nghiệp cho gia đình có trẻ nhỏ", price: 400000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Photography Session", description: "Buổi chụp ảnh chuyên nghiệp tại các góc đẹp nhất resort", price: 1200000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Snorkeling Tour", description: "Tour lặn ngắm san hô và sinh vật biển tại rạn san hô", price: 500000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Scuba Diving Experience", description: "Trải nghiệm lặn bình khí chuyên sâu cùng hướng dẫn viên", price: 1500000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Sunset Cruise", description: "Du thuyền ngắm hoàng hôn trên biển với đồ uống miễn phí", price: 800000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Jet Ski Rental", description: "Thuê mô tô nước lướt sóng trên biển đầy phấn khích", price: 600000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
    { name: "Fishing Trip", description: "Tour câu cá đại dương cùng ngư dân địa phương", price: 700000, imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"] },
  ];

  for (const svc of servicesData) {
    const { name, ...rest } = svc;
    await prisma.service.upsert({
      where: { name },
      update: rest,
      create: svc,
    });
  }

  // ========== SERVICE COMBOS ==========
  const getServiceId = async (name: string) => {
    const s = await prisma.service.findUnique({ where: { name } });
    if (!s) throw new Error(`Service "${name}" not found`);
    return s.id;
  };

  const snorkelingId = await getServiceId("Snorkeling Tour");
  const kayakId = await getServiceId("Kayak Rental");
  const photoId = await getServiceId("Photography Session");
  const airportId = await getServiceId("Airport Transfer");
  const sunsetId = await getServiceId("Sunset Cruise");
  const bbqId = await getServiceId("Private BBQ Dinner");
  const jetSkiId = await getServiceId("Jet Ski Rental");
  const coupleMassageId = await getServiceId("Couple Massage");
  const roomDecorId = await getServiceId("Romantic Room Decoration");
  const floatingBreakfastId = await getServiceId("Floating Breakfast");
  const breakfastId = await getServiceId("Breakfast Buffet");
  const bicycleId = await getServiceId("Bicycle Rental");
  const babysitId = await getServiceId("Babysitting Service");

  const combosData = [
    {
      name: "Ocean Discovery Package",
      description: "Khám phá đại dương với các hoạt động biển hấp dẫn",
      comboPrice: 1400000,
      imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"],
      serviceIds: [snorkelingId, kayakId, photoId],
    },
    {
      name: "Luxury Sea Experience",
      description: "Trải nghiệm biển đẳng cấp dành cho kỳ nghỉ thượng hạng",
      comboPrice: 2500000,
      imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"],
      serviceIds: [airportId, sunsetId, bbqId, photoId],
    },
    {
      name: "Water Adventure Package",
      description: "Trọn gói thể thao biển cho người ưa mạo hiểm",
      comboPrice: 1000000,
      imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"],
      serviceIds: [snorkelingId, jetSkiId, kayakId],
    },
    {
      name: "Couple Romance Package",
      description: "Dành cho các cặp đôi tìm kiếm không gian lãng mạn",
      comboPrice: 1700000,
      imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"],
      serviceIds: [coupleMassageId, roomDecorId, bbqId],
    },
    {
      name: "Honeymoon Experience",
      description: "Gói trăng mật hoàn hảo cho kỳ nghỉ tuần trăng mật đáng nhớ",
      comboPrice: 2300000,
      imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"],
      serviceIds: [coupleMassageId, floatingBreakfastId, photoId, roomDecorId],
    },
    {
      name: "Family Vacation Package",
      description: "Cho gia đình có trẻ em, đảm bảo kỳ nghỉ vui vẻ cho cả nhà",
      comboPrice: 600000,
      imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"],
      serviceIds: [breakfastId, bicycleId, babysitId],
    },
    {
      name: "Premium Resort Experience",
      description: "Combo cao cấp bao gồm tất cả trải nghiệm đẳng cấp nhất",
      comboPrice: 2900000,
      imageUrls: ["https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png", "https://res.cloudinary.com/dzlqaeyly/image/upload/q_auto/f_auto/v1780992687/logo_v2hsgl.png"],
      serviceIds: [airportId, coupleMassageId, floatingBreakfastId, bbqId, photoId],
    },
  ];

  for (const combo of combosData) {
    const { serviceIds, ...comboData } = combo;
    await prisma.serviceCombo.upsert({
      where: { name: combo.name },
      update: comboData,
      create: {
        ...comboData,
        items: { create: serviceIds.map((sid) => ({ serviceId: sid })) },
      },
    });
  }

  console.log("Seed completed successfully!");
  console.log("  Rooms:       50 rooms (15 Villa, 20 Suite, 15 Deluxe)");
  console.log("  Amenities:   15 amenities");
  console.log("  Images:      200 images (4 per room)");
  console.log("  Services:    20 services");
  console.log("  Combos:      7 service combos");
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
