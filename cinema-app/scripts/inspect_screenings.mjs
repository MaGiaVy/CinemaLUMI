import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const screenings = await prisma.screening.findMany({
    where: { movieId: 3 },
    select: {
      id: true,
      movieId: true,
      movie: { select: { title: true } },
      date: true,
      startTime: true,
      room: true,
      status: true,
      _count: { select: { tickets: true } },
    },
    orderBy: { startTime: 'asc' },
  });
  console.log(JSON.stringify(screenings, null, 2));
}

main().finally(() => prisma.$disconnect());
