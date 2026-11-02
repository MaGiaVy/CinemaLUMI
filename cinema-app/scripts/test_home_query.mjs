import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const rawDbMovies = await prisma.movie.findMany({
      where: {
        isDeleted: false,
        status: { in: ['SHOWING', 'UPCOMING'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        screenings: {
          where: { status: 'UPCOMING' },
          orderBy: { startTime: 'asc' },
          take: 5,
        },
      },
    });
    console.log('Query succeeded! Total movies found:', rawDbMovies.length);
    rawDbMovies.forEach((m) =>
      console.log(` - ID: ${m.id} | ${m.title} | Status: ${m.status} | Screenings: ${m.screenings.length}`)
    );
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
