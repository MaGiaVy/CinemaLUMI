import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 1. MOVIES ===');
  const movies = await prisma.movie.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      isDeleted: true,
      genre: true,
      duration: true,
      releaseDate: true,
      _count: {
        select: {
          screenings: true,
          reviews: true,
          coupons: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });
  console.log(JSON.stringify(movies, null, 2));

  console.log('\n=== 2. SCREENINGS DETAILS ===');
  const screenings = await prisma.screening.findMany({
    select: {
      id: true,
      movieId: true,
      movie: { select: { title: true } },
      date: true,
      startTime: true,
      room: true,
      status: true,
      _count: { select: { tickets: true, seats: true } },
    },
    orderBy: { id: 'asc' },
  });
  console.log(JSON.stringify(screenings, null, 2));

  console.log('\n=== 3. COUPONS ===');
  const coupons = await prisma.coupon.findMany();
  console.log(JSON.stringify(coupons, null, 2));

  console.log('\n=== 4. TICKETS SUMMARY ===');
  const ticketsByStatus = await prisma.ticket.groupBy({
    by: ['status'],
    _count: true,
  });
  console.log(JSON.stringify(ticketsByStatus, null, 2));

  console.log('\n=== 4. COMBOS ===');
  const combos = await prisma.combo.findMany();
  console.log(JSON.stringify(combos, null, 2));

  console.log('\n=== 5. USERS ===');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(JSON.stringify(users, null, 2));

  console.log('\n=== 6. PRICING ===');
  const pricing = await prisma.pricing.findMany();
  console.log(JSON.stringify(pricing, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
