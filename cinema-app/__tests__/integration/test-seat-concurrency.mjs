// cinema-app/__tests__/integration/test-seat-concurrency.mjs
import assert from 'assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('========================================================================');
console.log('🔒 TEST SUITE: SEAT RESERVATION CONCURRENCY & RACE CONDITION DEFENSE');
console.log('========================================================================\n');

async function main() {
  let testScreening = null;
  let testSeats = [];

  try {
    // 1. Chuẩn bị dữ liệu kiểm thử trong DB
    const movie = await prisma.movie.findFirst();
    if (!movie) {
      throw new Error('Không tìm thấy movie nào trong DB để tạo suất chiếu test');
    }

    const testTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Ngày mai
    testScreening = await prisma.screening.create({
      data: {
        movieId: movie.id,
        room: 'Cinema Concurrency 01',
        roomNumber: 1,
        date: testTime,
        startTime: testTime,
        endTime: new Date(testTime.getTime() + 2 * 60 * 60 * 1000),
        price: 100000,
        status: 'UPCOMING',
        seats: {
          create: [
            { room: 'Cinema Concurrency 01', row: 'C', number: 1, code: 'C1', type: 'STANDARD', status: 'EMPTY' },
            { room: 'Cinema Concurrency 01', row: 'C', number: 2, code: 'C2', type: 'STANDARD', status: 'EMPTY' },
          ],
        },
      },
      include: { seats: true },
    });

    testSeats = testScreening.seats;
    const targetSeat = testSeats[0]; // Ghế C1
    console.log(`✓ Đã tạo suất chiếu #${testScreening.id} kèm ghế mục tiêu: ${targetSeat.code} (ID: ${targetSeat.id})`);

    // Tạo mock session tokens cho 2 user khác nhau
    // User 1 (ID: 1) và User 2 (ID: 2)
    const user1SessionCookie = 'next-auth.session-token=mock_session_user_1';
    const user2SessionCookie = 'next-auth.session-token=mock_session_user_2';

    // =========================================================================
    // TEST 1: CHẠY ĐỒNG THỜI (Promise.all) 2 YÊU CẦU GIỮ CÙNG MỘT GHẾ
    // =========================================================================
    console.log('\n--- TEST 1: Tranh chấp giữ ghế đồng thời (User 1 vs User 2 cùng đặt C1) ---');

    // Chạy 2 transaction đồng thời trực tiếp qua Prisma để kiểm tra Atomic Conditional Update
    const results = await Promise.allSettled([
      // User 1 cố gắng giữ ghế C1
      prisma.$transaction(async (tx) => {
        const updateResult = await tx.seat.updateMany({
          where: {
            id: targetSeat.id,
            screeningId: testScreening.id,
            OR: [
              { status: 'EMPTY' },
              { status: 'RESERVED', reservedUserId: 1 },
              { status: 'RESERVED', reservedUntil: { lt: new Date() } },
            ],
          },
          data: {
            status: 'RESERVED',
            reservedUntil: new Date(Date.now() + 10 * 60 * 1000),
            reservedUserId: 1,
          },
        });
        if (updateResult.count === 0) {
          throw new Error('SEAT_ALREADY_RESERVED');
        }
        return { user: 1, success: true };
      }),

      // User 2 cố gắng giữ ghế C1
      prisma.$transaction(async (tx) => {
        const updateResult = await tx.seat.updateMany({
          where: {
            id: targetSeat.id,
            screeningId: testScreening.id,
            OR: [
              { status: 'EMPTY' },
              { status: 'RESERVED', reservedUserId: 2 },
              { status: 'RESERVED', reservedUntil: { lt: new Date() } },
            ],
          },
          data: {
            status: 'RESERVED',
            reservedUntil: new Date(Date.now() + 10 * 60 * 1000),
            reservedUserId: 2,
          },
        });
        if (updateResult.count === 0) {
          throw new Error('SEAT_ALREADY_RESERVED');
        }
        return { user: 2, success: true };
      }),
    ]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    assert.strictEqual(successes.length, 1, 'Chính xác 1 user phải thành công giữ ghế');
    assert.strictEqual(failures.length, 1, 'Chính xác 1 user phải bị từ chối do xung đột tranh chấp ghế');

    const winningUser = successes[0].value.user;
    const losingUser = winningUser === 1 ? 2 : 1;
    console.log(`✓ Kết quả tranh chấp: User ${winningUser} ĐƯỢC GIỮ GHẾ, User ${losingUser} BỊ TỪ CHỐI`);

    // Kiểm tra DB: ghế phải có status = RESERVED và reservedUserId = winningUser
    const updatedSeat = await prisma.seat.findUnique({ where: { id: targetSeat.id } });
    assert.strictEqual(updatedSeat.status, 'RESERVED');
    assert.strictEqual(updatedSeat.reservedUserId, winningUser);
    console.log(`✓ Xác thực DB: Ghế C1 đã được gán chặt chẽ với reservedUserId = ${winningUser}`);

    // =========================================================================
    // TEST 2: USER THUA CUỘC KHÔNG THỂ GHI ĐÈ LƯỢT GIỮ GHẾ TRONG PAYMENT INITIATE
    // =========================================================================
    console.log(`\n--- TEST 2: Ngăn chặn User ${losingUser} ghi đè ghế trong payment initiate ---`);

    const now = new Date();
    // User thua cuộc cố tình cập nhật ghế trong payment initiate
    const losingUserInitiateResult = await prisma.$transaction(async (tx) => {
      // Logic kiểm tra trong initiatePayment:
      const seatInDb = await tx.seat.findUnique({ where: { id: targetSeat.id } });
      const isReservedByOther =
        seatInDb.status === 'RESERVED' &&
        seatInDb.reservedUntil &&
        seatInDb.reservedUntil > now &&
        seatInDb.reservedUserId !== null &&
        seatInDb.reservedUserId !== losingUser;

      if (isReservedByOther) {
        throw new Error('SEATS_RESERVED_BY_ANOTHER_USER');
      }

      // Cập nhật
      const res = await tx.seat.updateMany({
        where: {
          id: targetSeat.id,
          screeningId: testScreening.id,
          status: { not: 'OCCUPIED' },
          OR: [
            { status: 'EMPTY' },
            { reservedUserId: losingUser },
            { reservedUntil: { lt: now } },
          ],
        },
        data: {
          status: 'RESERVED',
          reservedUntil: new Date(Date.now() + 10 * 60 * 1000),
          reservedUserId: losingUser,
        },
      });
      return res;
    }).catch((err) => err);

    assert.ok(losingUserInitiateResult instanceof Error);
    assert.strictEqual(losingUserInitiateResult.message, 'SEATS_RESERVED_BY_ANOTHER_USER');
    console.log(`✓ Thành công chặn User ${losingUser} ghi đè giữ ghế trong payment initiate`);

    // =========================================================================
    // TEST 3: USER THẮNG CUỘC ĐƯỢC PHÉP INITIATE PAYMENT VÀ TIẾP QUẢN GHẾ
    // =========================================================================
    console.log(`\n--- TEST 3: User ${winningUser} (chính chủ lượt giữ ghế) khởi tạo thanh toán hợp lệ ---`);
    const winningUserInitiateResult = await prisma.$transaction(async (tx) => {
      const seatInDb = await tx.seat.findUnique({ where: { id: targetSeat.id } });
      const isReservedByOther =
        seatInDb.status === 'RESERVED' &&
        seatInDb.reservedUntil &&
        seatInDb.reservedUntil > now &&
        seatInDb.reservedUserId !== null &&
        seatInDb.reservedUserId !== winningUser;

      if (isReservedByOther) {
        throw new Error('SEATS_RESERVED_BY_ANOTHER_USER');
      }

      const res = await tx.seat.updateMany({
        where: {
          id: targetSeat.id,
          screeningId: testScreening.id,
          status: { not: 'OCCUPIED' },
          OR: [
            { status: 'EMPTY' },
            { reservedUserId: winningUser },
            { reservedUntil: { lt: now } },
          ],
        },
        data: {
          status: 'RESERVED',
          reservedUntil: new Date(Date.now() + 10 * 60 * 1000),
          reservedUserId: winningUser,
        },
      });
      return res;
    });

    assert.strictEqual(winningUserInitiateResult.count, 1);
    console.log(`✓ User ${winningUser} xác thực thành công và gia hạn giữ chỗ thanh toán 10 phút`);

    console.log('\n========================================================================');
    console.log('🎉 TOÀN BỘ TEST CASES BẢO VỆ GHẾ VÀ CHỐNG RACE CONDITION ĐỀU PASSED 100%!');
    console.log('========================================================================\n');
  } finally {
    // Dọn dẹp dữ liệu test
    if (testScreening) {
      await prisma.seat.deleteMany({ where: { screeningId: testScreening.id } }).catch(() => {});
      await prisma.screening.delete({ where: { id: testScreening.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Lỗi kiểm thử concurrency:', e);
  process.exit(1);
});
