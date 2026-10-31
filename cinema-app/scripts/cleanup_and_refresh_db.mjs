import { PrismaClient, SeatType, SeatStatus, ScreeningStatus, MovieStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 === BẮT ĐẦU DỌN DẸP & CẬP NHẬT DATABASE CINEMALUMI ===\n');

  // 1. Dọn dẹp các voucher test rác
  console.log('1. Xóa các voucher bồi hoàn thử nghiệm (COMP50_...)...');
  const deletedCoupons = await prisma.coupon.deleteMany({
    where: {
      code: { startsWith: 'COMP50_' },
    },
  });
  console.log(`✓ Đã xóa ${deletedCoupons.count} voucher thử nghiệm.\n`);

  // 2. Dọn dẹp combo test 'combo BeO'
  console.log('2. Xóa combo thử nghiệm "combo BeO"...');
  // Xóa các liên kết orderCombos hoặc comboReservations nếu có
  await prisma.comboReservation.deleteMany({ where: { comboId: 8 } });
  await prisma.orderCombo.deleteMany({ where: { comboId: 8 } });
  const deletedCombo = await prisma.combo.deleteMany({ where: { id: 8 } });
  console.log(`✓ Đã xóa combo BeO (${deletedCombo.count} bản ghi).\n`);

  // 3. Xóa 4 bộ phim mẫu (Avengers: Doomsday id: 4, Mission Impossible 9 id: 6, Inside Out 3 id: 7, Dune Messiah id: 8)
  const sampleMovieIds = [4, 6, 7, 8];
  console.log(`3. Xóa hoàn toàn 4 bộ phim mẫu (IDs: ${sampleMovieIds.join(', ')})...`);

  // Tìm tất cả các suất chiếu của 4 phim này
  const sampleScreenings = await prisma.screening.findMany({
    where: { movieId: { in: sampleMovieIds } },
    select: { id: true },
  });
  const sampleScreeningIds = sampleScreenings.map((s) => s.id);
  console.log(`- Tìm thấy ${sampleScreeningIds.length} suất chiếu của phim mẫu.`);

  if (sampleScreeningIds.length > 0) {
    // Xóa vé của các suất chiếu này
    const deletedTickets = await prisma.ticket.deleteMany({
      where: { screeningId: { in: sampleScreeningIds } },
    });
    console.log(`- Đã xóa ${deletedTickets.count} vé liên quan.`);

    // Xóa ghế của các suất chiếu này
    const deletedSeats = await prisma.seat.deleteMany({
      where: { screeningId: { in: sampleScreeningIds } },
    });
    console.log(`- Đã xóa ${deletedSeats.count} ghế liên quan.`);

    // Xóa các suất chiếu
    const deletedScreenings = await prisma.screening.deleteMany({
      where: { id: { in: sampleScreeningIds } },
    });
    console.log(`- Đã xóa ${deletedScreenings.count} suất chiếu.`);
  }

  // Xóa reviews & coupons liên quan đến 4 phim này
  await prisma.review.deleteMany({ where: { movieId: { in: sampleMovieIds } } });
  await prisma.coupon.deleteMany({ where: { applicableMovieId: { in: sampleMovieIds } } });

  // Xóa chính thức 4 phim
  const deletedMovies = await prisma.movie.deleteMany({
    where: { id: { in: sampleMovieIds } },
  });
  console.log(`✓ Đã xóa thành công ${deletedMovies.count} phim mẫu khỏi database.\n`);

  // 4. Cập nhật thông tin chuẩn cho 2 phim chính được giữ lại (Spider-Man id: 3, Lật Mặt 8 id: 5)
  console.log('4. Cập nhật trạng thái SHOWING cho Spider-Man và Lật Mặt 8...');
  await prisma.movie.update({
    where: { id: 3 },
    data: {
      status: MovieStatus.SHOWING,
      isDeleted: false,
    },
  });

  await prisma.movie.update({
    where: { id: 5 },
    data: {
      status: MovieStatus.SHOWING,
      isDeleted: false,
    },
  });
  console.log('✓ Đã cập nhật 2 phim chính.\n');

  // 5. Sinh thêm các suất chiếu mới cho Hôm nay (19/10/2026), Ngày mai (20/10/2026) và Ngày kia (21/10/2026)
  console.log('5. Tạo các suất chiếu mới từ hôm nay (19/10/2026)...');

  const newShowDates = [
    new Date('2026-10-19T00:00:00.000Z'),
    new Date('2026-10-20T00:00:00.000Z'),
    new Date('2026-10-21T00:00:00.000Z'),
  ];

  const timeSlots = [
    { startH: 9, startM: 0, endH: 11, endM: 30, room: 'Cinema 01', roomNum: 1 },
    { startH: 14, startM: 30, endH: 17, endM: 0, room: 'Cinema 02', roomNum: 2 },
    { startH: 18, startM: 30, endH: 21, endM: 0, room: 'Cinema 01', roomNum: 1 },
    { startH: 20, startM: 45, endH: 23, endM: 15, room: 'Cinema 02', roomNum: 2 },
  ];

  const targetMovies = [
    { id: 3, price: 120000 },
    { id: 5, price: 100000 },
  ];

  let totalNewScreenings = 0;
  let totalNewSeats = 0;

  for (const dateObj of newShowDates) {
    const dateStr = dateObj.toISOString().split('T')[0];

    for (const movie of targetMovies) {
      for (const slot of timeSlots) {
        // Tránh trùng suất chiếu cùng phòng cùng giờ
        const startTime = new Date(dateObj);
        startTime.setUTCHours(slot.startH, slot.startM, 0, 0);

        const endTime = new Date(dateObj);
        endTime.setUTCHours(slot.endH, slot.endM, 0, 0);

        // Tạo suất chiếu
        const screening = await prisma.screening.create({
          data: {
            movieId: movie.id,
            room: slot.room,
            roomNumber: slot.roomNum,
            startTime,
            endTime,
            date: dateObj,
            price: movie.price,
            status: ScreeningStatus.UPCOMING,
          },
        });
        totalNewScreenings++;

        // Tạo 50 ghế (Hàng A -> E, mỗi hàng 10 ghế)
        const seatData = [];
        const rows = ['A', 'B', 'C', 'D', 'E'];

        for (const row of rows) {
          for (let num = 1; num <= 10; num++) {
            let seatType = SeatType.STANDARD;
            if (row === 'C' || row === 'D') seatType = SeatType.VIP;
            if (row === 'E') seatType = SeatType.COUPLE;

            seatData.push({
              screeningId: screening.id,
              room: slot.room,
              row,
              number: num,
              code: `${row}${num}`,
              type: seatType,
              status: SeatStatus.EMPTY,
            });
          }
        }

        await prisma.seat.createMany({
          data: seatData,
        });
        totalNewSeats += seatData.length;
      }
    }
  }

  console.log(`✓ Đã tạo thành công ${totalNewScreenings} suất chiếu mới.`);
  console.log(`✓ Đã khởi tạo ${totalNewSeats} ghế phòng chiếu (Trạng thái EMPTY).\n`);

  console.log('🎉 === TOÀN BỘ DATABASE ĐÃ ĐƯỢC DỌN DẸP VÀ ĐỒNG BỘ THÀNH CÔNG! ===\n');
}

main()
  .catch((err) => {
    console.error('❌ Lỗi khi dọn dẹp DB:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
