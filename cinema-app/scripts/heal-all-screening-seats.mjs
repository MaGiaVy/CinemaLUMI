import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu kiểm tra và bổ sung ghế cho toàn bộ suất chiếu ---');

  const screenings = await prisma.screening.findMany({
    include: {
      _count: {
        select: { seats: true },
      },
      movie: {
        select: { title: true },
      },
    },
  });

  console.log(`Tìm thấy tổng cộng ${screenings.length} suất chiếu.`);

  let healedCount = 0;

  for (const s of screenings) {
    if (s._count.seats < 50) {
      console.log(`Suất chiếu #${s.id} (Phim: "${s.movie.title}") chỉ có ${s._count.seats} ghế. Đang bù đủ 50 ghế...`);

      // Lấy danh sách mã ghế hiện có
      const existingSeats = await prisma.seat.findMany({
        where: { screeningId: s.id },
        select: { code: true },
      });
      const existingCodes = new Set(existingSeats.map(item => item.code));

      const seatRows = ['A', 'B', 'C', 'D', 'E'];
      const missingSeats = [];

      for (const row of seatRows) {
        for (let num = 1; num <= 10; num++) {
          const code = `${row}${num}`;
          if (!existingCodes.has(code)) {
            missingSeats.push({
              screeningId: s.id,
              room: s.room || 'Cinema 01',
              row,
              number: num,
              code,
              type: row === 'D' ? 'VIP' : row === 'E' ? 'COUPLE' : 'STANDARD',
              status: 'EMPTY',
            });
          }
        }
      }

      if (missingSeats.length > 0) {
        await prisma.seat.createMany({
          data: missingSeats,
        });
        healedCount++;
      }
    }
  }

  console.log(`Hoàn tất! Đã sửa và bù 50 ghế cho ${healedCount} suất chiếu.`);
}

main()
  .catch(err => {
    console.error('Lỗi khi bù ghế:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
