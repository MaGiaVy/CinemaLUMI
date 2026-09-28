import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.ticket.findMany({
    take: 5,
    include: {
      screening: {
        include: {
          movie: { select: { id: true, title: true } },
        },
      },
      seat: true,
      payment: true,
      user: { select: { id: true, email: true, name: true } },
    },
    orderBy: { id: 'desc' },
  });

  console.log('Total tickets:', await prisma.ticket.count());
  console.log('Sample tickets:', JSON.stringify(tickets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
