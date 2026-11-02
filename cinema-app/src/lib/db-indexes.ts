import { prisma } from './prisma';

/**
 * Đảm bảo các Partial Unique Index tối quan trọng trong PostgreSQL được thiết lập:
 * - Chống Double Booking: Không cho phép tồn tại 2 vé cùng lúc cho (screening_id, seat_id) trừ khi vé đã 'Cancelled'.
 */
export async function ensurePartialUniqueIndexes(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS unique_active_ticket ON tickets(screening_id, seat_id) WHERE status != 'Cancelled';`
    );
  } catch (error) {
    console.error('[DB] Lỗi khi tạo Partial Unique Index unique_active_ticket:', error);
  }
}
