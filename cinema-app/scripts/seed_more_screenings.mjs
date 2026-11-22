import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROWS = ['A', 'B', 'C', 'D', 'E'];
const COLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ROOMS = [
  { name: 'Cinema 01', num: 1 },
  { name: 'Cinema 02', num: 2 },
  { name: 'Cinema 03', num: 3 },
  { name: 'Cinema 04', num: 4 },
  { name: 'Cinema 05', num: 5 },
];

// 6 khung giờ chiếu đẹp trong ngày (giờ VN +07:00)
const VN_SLOTS = [
  { h: 8, m: 30 },
  { h: 11, m: 15 },
  { h: 14, m: 0 },
  { h: 16, m: 45 },
  { h: 19, m: 30 },
  { h: 22, m: 15 },
];

function build50Seats(screeningId, roomName) {
  const list = [];
  for (const row of ROWS) {
    for (const number of COLS) {
      list.push({
        screeningId,
        room: roomName,
        row,
        number,
        code: `${row}${number}`,
        type: 'STANDARD',
        status: 'EMPTY',
      });
    }
  }
  return list;
}

async function main() {
  const movies = await prisma.movie.findMany({
    where: { status: 'SHOWING', isDeleted: false },
    orderBy: { id: 'asc' },
  });

  let added = 0;
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const dayDate = new Date();
    dayDate.setHours(0, 0, 0, 0);
    dayDate.setDate(dayDate.getDate() + dayOffset);

    // Date-only UTC midnight for Prisma @db.Date
    const yyyy = dayDate.getFullYear();
    const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
    const dd = String(dayDate.getDate()).padStart(2, '0');
    const dbDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);

    for (let mi = 0; mi < movies.length; mi++) {
      const movie = movies[mi];
      // Thử xếp cho mỗi phim 4 khung giờ khác nhau mỗi ngày (sáng, trưa, chiều, tối)
      const targetSlots = [0, 1, 2, 3, 4, 5];
      let movieDayCount = await prisma.screening.count({
        where: { movieId: movie.id, date: dbDate, status: { not: 'CANCELLED' } },
      });

      for (const sIdx of targetSlots) {
        if (movieDayCount >= 4) break;
        const slot = VN_SLOTS[(sIdx + mi) % VN_SLOTS.length];
        const hh = String(slot.h).padStart(2, '0');
        const min = String(slot.m).padStart(2, '0');
        const startTime = new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00+07:00`);
        const endTime = new Date(startTime.getTime() + movie.duration * 60 * 1000);
        const bufStart = new Date(startTime.getTime() - 15 * 60 * 1000);
        const bufEnd = new Date(endTime.getTime() + 15 * 60 * 1000);

        // Nếu phim đã có suất ở gần khung giờ này thì bỏ qua để rải đều các giờ
        const sameMovieSameSlot = await prisma.screening.findFirst({
          where: {
            movieId: movie.id,
            status: { not: 'CANCELLED' },
            startTime: { gte: new Date(startTime.getTime() - 90 * 60 * 1000), lte: new Date(startTime.getTime() + 90 * 60 * 1000) },
          },
        });
        if (sameMovieSameSlot) continue;

        // Tìm phòng trống (không trùng lịch + 15p dọn phòng BR-08)
        for (let rOffset = 0; rOffset < ROOMS.length; rOffset++) {
          const room = ROOMS[(mi + sIdx + rOffset) % ROOMS.length];
          const conflict = await prisma.screening.findFirst({
            where: {
              room: room.name,
              status: { not: 'CANCELLED' },
              startTime: { lt: bufEnd },
              endTime: { gt: bufStart },
            },
          });
          if (!conflict) {
            const sc = await prisma.screening.create({
              data: {
                movieId: movie.id,
                room: room.name,
                roomNumber: room.num,
                startTime,
                endTime,
                date: dbDate,
                price: movie.ticketPrice,
                status: 'UPCOMING',
              },
            });
            await prisma.seat.createMany({
              data: build50Seats(sc.id, room.name),
              skipDuplicates: true,
            });
            added++;
            movieDayCount++;
            break;
          }
        }
      }
    }
  }

  console.log(`+ Đã bổ sung ${added} suất chiếu mới (kèm ${added * 50} ghế).`);

  // Kiểm tra số suất chiếu hôm nay của từng phim
  const todayStart = new Date('2026-11-23T00:00:00+07:00');
  const todayEnd = new Date('2026-11-24T00:00:00+07:00');
  for (const m of movies) {
    const scs = await prisma.screening.findMany({
      where: { movieId: m.id, startTime: { gte: todayStart, lt: todayEnd }, status: { not: 'CANCELLED' } },
      orderBy: { startTime: 'asc' },
      select: { room: true, startTime: true },
    });
    const times = scs.map((s) =>
      s.startTime.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }) + ` (${s.room})`
    );
    console.log(`- ${m.title}: ${scs.length} suất hôm nay -> ${times.join(', ')}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
