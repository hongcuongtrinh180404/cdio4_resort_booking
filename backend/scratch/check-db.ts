import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fromDate = '2026-06-02';
  const toDate = '2026-07-02';

  const filter: any = { status: { in: ["PAID", "SUCCESS"] } };
  if (fromDate || toDate) {
    filter.paidAt = {};
    if (fromDate) filter.paidAt.gte = new Date(fromDate + "T00:00:00.000Z");
    if (toDate) filter.paidAt.lte = new Date(toDate + "T23:59:59.999Z");
  }

  console.log('Filter is:', filter);

  const bookings = await prisma.booking.findMany({
    where: {
      payment: { ...filter },
    },
    select: {
      numberOfNights: true,
      roomPricePerNight: true,
      services: { select: { priceSnapshot: true, quantity: true } },
      combos: { select: { comboPriceSnapshot: true, quantity: true } },
    },
  });

  console.log('Bookings matched:', bookings.length);

  let roomRevenue = 0;
  let serviceRevenue = 0;
  let comboRevenue = 0;

  for (const b of bookings) {
    roomRevenue += Number(b.roomPricePerNight) * b.numberOfNights;
    for (const s of b.services) {
      serviceRevenue += Number(s.priceSnapshot) * s.quantity;
    }
    for (const c of b.combos) {
      comboRevenue += Number(c.comboPriceSnapshot) * c.quantity;
    }
  }

  const data = [
    { source: "Phòng", revenue: roomRevenue },
    { source: "Dịch vụ lẻ", revenue: serviceRevenue },
    { source: "Combo", revenue: comboRevenue },
  ];

  console.log('Revenue by source:', { data, total: roomRevenue + serviceRevenue + comboRevenue });
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
