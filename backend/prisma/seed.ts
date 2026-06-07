import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dtuvivi.com" },
    update: {},
    create: {
      email: "admin@dtuvivi.com",
      password: hashedPassword,
      fullName: "Admin",
      role: "ADMIN",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@dtuvivi.com" },
    update: {},
    create: {
      email: "employee@dtuvivi.com",
      password: hashedPassword,
      fullName: "Nhân viên",
      role: "EMPLOYEE",
    },
  });

  const guest = await prisma.user.upsert({
    where: { email: "guest@dtuvivi.com" },
    update: {},
    create: {
      email: "guest@dtuvivi.com",
      password: hashedPassword,
      fullName: "Khách hàng",
      phone: "0901234567",
      role: "GUEST",
    },
  });

  const deluxe = await prisma.roomType.upsert({
    where: { name: "Deluxe" },
    update: {},
    create: { name: "Deluxe", description: "Phòng Deluxe cao cấp với view thành phố" },
  });

  const suite = await prisma.roomType.upsert({
    where: { name: "Suite" },
    update: {},
    create: { name: "Suite", description: "Phòng Suite rộng rãi với ban công riêng" },
  });

  const villa = await prisma.roomType.upsert({
    where: { name: "Villa" },
    update: {},
    create: { name: "Villa", description: "Biệt thự riêng với hồ bơi" },
  });

  const rooms = [
    { roomNumber: "D101", name: "Deluxe 101", roomTypeId: deluxe.id, capacity: 2, pricePerNight: 1500000 },
    { roomNumber: "D102", name: "Deluxe 102", roomTypeId: deluxe.id, capacity: 2, pricePerNight: 1500000 },
    { roomNumber: "D201", name: "Deluxe 201", roomTypeId: deluxe.id, capacity: 3, pricePerNight: 1800000 },
    { roomNumber: "S101", name: "Suite 101", roomTypeId: suite.id, capacity: 3, pricePerNight: 2500000 },
    { roomNumber: "S102", name: "Suite 102", roomTypeId: suite.id, capacity: 4, pricePerNight: 3000000 },
    { roomNumber: "V001", name: "Villa 001", roomTypeId: villa.id, capacity: 6, pricePerNight: 5000000 },
    { roomNumber: "V002", name: "Villa 002", roomTypeId: villa.id, capacity: 8, pricePerNight: 7000000 },
  ];

  for (const room of rooms) {
    await prisma.room.upsert({
      where: { roomNumber: room.roomNumber },
      update: {},
      create: room,
    });
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
        items: {
          create: [
            { serviceId: breakfast.id },
            { serviceId: dinner.id },
            { serviceId: spa.id },
          ],
        },
      },
    });

    await prisma.serviceCombo.upsert({
      where: { name: "Business Package" },
      update: {},
      create: {
        name: "Business Package",
        description: "Gói công tác tiện lợi",
        comboPrice: 800000,
        items: {
          create: [
            { serviceId: breakfast.id },
            { serviceId: airport.id },
          ],
        },
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
  console.log("  Admin:    admin@dtuvivi.com / 123456");
  console.log("  Employee: employee@dtuvivi.com / 123456");
  console.log("  Guest:    guest@dtuvivi.com / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
