import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixSequences() {
  const tables = [
    { table: 'combo_reservations', col: 'reservation_id', seq: 'combo_reservations_reservation_id_seq' },
    { table: 'combos', col: 'combo_id', seq: 'combos_combo_id_seq' },
    { table: 'tickets', col: 'ticket_id', seq: 'tickets_ticket_id_seq' },
    { table: 'payments', col: 'payment_id', seq: 'payments_payment_id_seq' },
    { table: 'seats', col: 'seat_id', seq: 'seats_seat_id_seq' },
    { table: 'screenings', col: 'screening_id', seq: 'screenings_screening_id_seq' },
    { table: 'users', col: 'user_id', seq: 'users_user_id_seq' },
    { table: 'movies', col: 'movie_id', seq: 'movies_movie_id_seq' },
    { table: 'order_combos', col: 'order_combo_id', seq: 'order_combos_order_combo_id_seq' },
    { table: 'reviews', col: 'review_id', seq: 'reviews_review_id_seq' },
    { table: 'pricing', col: 'pricing_id', seq: 'pricing_pricing_id_seq' },
    { table: 'coupons', col: 'coupon_id', seq: 'coupons_coupon_id_seq' },
  ];

  for (const t of tables) {
    try {
      const maxRes = await prisma.$queryRawUnsafe(`SELECT COALESCE(MAX(${t.col}), 0) as max_id FROM "${t.table}"`);
      const maxId = Number(maxRes[0].max_id);
      const nextId = maxId + 1;
      await prisma.$executeRawUnsafe(`SELECT setval('${t.seq}', ${nextId}, false)`);
      console.log(`✅ Fixed sequence ${t.seq} to ${nextId}`);
    } catch (e) {
      console.log(`⚠️ Sequence ${t.seq} error:`, e.message);
    }
  }
}

fixSequences().finally(() => prisma.$disconnect());
