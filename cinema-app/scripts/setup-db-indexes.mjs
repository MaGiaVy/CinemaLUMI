import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupIndexes() {
  console.log('🔄 Đang kiểm tra và khởi tạo Partial Unique Index trên PostgreSQL...');

  const sql = `CREATE UNIQUE INDEX IF NOT EXISTS unique_active_ticket ON tickets(screening_id, seat_id) WHERE status != 'Cancelled';`;
  
  await prisma.$executeRawUnsafe(sql);
  console.log('✅ Đã thực thi SQL tạo index:', sql);

  // Kiểm tra lại index trong pg_indexes
  const indexes = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'tickets' AND indexname = 'unique_active_ticket';
  `);

  console.log('📋 Kết quả xác thực index trong PostgreSQL:', indexes);
}

setupIndexes()
  .catch((err) => {
    console.error('❌ Lỗi khởi tạo index:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
