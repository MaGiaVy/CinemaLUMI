const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const payments = await prisma.payment.findMany({
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      paymentMethod: true
    }
  });
  console.log('Total payments:', payments.length);
  const successPayments = payments.filter(p => p.status === 'Success');
  console.log('Success payments count:', successPayments.length);
  const totalSuccessAmount = successPayments.reduce((acc, p) => acc + Number(p.amount), 0);
  console.log('Total Success Revenue:', totalSuccessAmount);

  // Payments grouped by month or day
  const monthly = {};
  for (const p of successPayments) {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthly[key] = (monthly[key] || 0) + Number(p.amount);
  }
  console.log('Monthly revenue:', monthly);

  const tickets = await prisma.ticket.findMany({
    select: { id: true, price: true, status: true, purchaseDate: true }
  });
  console.log('Total tickets:', tickets.length);
  const validTickets = tickets.filter(t => t.status !== 'Cancelled');
  console.log('Valid tickets count:', validTickets.length);
  const totalTicketRevenue = validTickets.reduce((acc, t) => acc + Number(t.price), 0);
  console.log('Total Ticket Revenue:', totalTicketRevenue);

  const combos = await prisma.orderCombo.findMany({
    select: { id: true, quantity: true, price: true }
  });
  console.log('Total order combos:', combos.length);
  const totalComboRevenue = combos.reduce((acc, c) => acc + (c.quantity * Number(c.price)), 0);
  console.log('Total Combo Revenue:', totalComboRevenue);

  const movies = await prisma.movie.findMany({
    select: { id: true, title: true, ticketPrice: true },
    take: 10
  });
  console.log('Top movies count:', movies.length);
  movies.forEach(m => console.log('Movie:', m.id, m.title));
}

check().catch(console.error).finally(() => prisma.$disconnect());
