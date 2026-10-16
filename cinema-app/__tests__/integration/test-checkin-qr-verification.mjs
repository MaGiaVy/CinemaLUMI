import assert from 'assert';
import { PrismaClient, TicketStatus } from '@prisma/client';
import { generateTicketSignature } from '../../src/lib/ticket-verification.ts';
import { getStaffCookie, getCustomerCookie } from '../helpers/auth-helper.mjs';

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('========================================================================');
console.log('🎟️ TEST SUITE: TICKET CHECK-IN, HMAC QR VERIFICATION & FR-CHK-01 RULES');
console.log('========================================================================\n');

async function main() {
  let earlyScreening = null;
  let activeScreening = null;
  let expiredScreening = null;
  let testTickets = [];

  try {
    const movie = await prisma.movie.findFirst();
    if (!movie) throw new Error('Không tìm thấy movie trong DB');

    let payment = await prisma.payment.findFirst({ where: { userId: 1 } });
    if (!payment) {
      payment = await prisma.payment.create({
        data: { userId: 1, amount: 100000, paymentMethod: 'Cash', status: 'Success' },
      });
    }

    // 1. Tạo 3 suất chiếu với các mốc thời gian khác nhau để test FR-CHK-01:
    const nowMs = Date.now();

    // 1.1 Suất chiếu quá sớm (> 30 phút, cụ thể là 5 tiếng nữa)
    const earlyTime = new Date(nowMs + 5 * 60 * 60 * 1000);
    earlyScreening = await prisma.screening.create({
      data: {
        movieId: movie.id,
        room: 'Cinema Early 01',
        roomNumber: 1,
        date: earlyTime,
        startTime: earlyTime,
        endTime: new Date(earlyTime.getTime() + 2 * 60 * 60 * 1000),
        price: 100000,
        status: 'UPCOMING',
        seats: {
          create: [{ room: 'Cinema Early 01', row: 'A', number: 1, code: 'A1', type: 'STANDARD', status: 'OCCUPIED' }],
        },
      },
      include: { seats: true },
    });

    // 1.2 Suất chiếu hợp lệ (bắt đầu cách đây 10 phút, kết thúc sau 110 phút)
    const activeTime = new Date(nowMs - 10 * 60 * 1000);
    activeScreening = await prisma.screening.create({
      data: {
        movieId: movie.id,
        room: 'Cinema Active 02',
        roomNumber: 2,
        date: activeTime,
        startTime: activeTime,
        endTime: new Date(nowMs + 110 * 60 * 1000),
        price: 100000,
        status: 'SHOWING',
        seats: {
          create: [
            { room: 'Cinema Active 02', row: 'B', number: 1, code: 'B1', type: 'STANDARD', status: 'OCCUPIED' },
            { room: 'Cinema Active 02', row: 'B', number: 2, code: 'B2', type: 'STANDARD', status: 'OCCUPIED' },
          ],
        },
      },
      include: { seats: true },
    });

    // 1.3 Suất chiếu đã kết thúc (kết thúc cách đây 15 phút)
    const expiredEnd = new Date(nowMs - 15 * 60 * 1000);
    const expiredStart = new Date(expiredEnd.getTime() - 2 * 60 * 60 * 1000);
    expiredScreening = await prisma.screening.create({
      data: {
        movieId: movie.id,
        room: 'Cinema Expired 03',
        roomNumber: 3,
        date: expiredStart,
        startTime: expiredStart,
        endTime: expiredEnd,
        price: 100000,
        status: 'ENDED',
        seats: {
          create: [{ room: 'Cinema Expired 03', row: 'C', number: 1, code: 'C1', type: 'STANDARD', status: 'OCCUPIED' }],
        },
      },
      include: { seats: true },
    });

    // 2. Tạo vé tương ứng
    const earlyTicket = await prisma.ticket.create({
      data: {
        userId: 1,
        screeningId: earlyScreening.id,
        seatId: earlyScreening.seats[0].id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 100000,
        status: TicketStatus.Valid,
      },
    });

    const activeTicket = await prisma.ticket.create({
      data: {
        userId: 1,
        screeningId: activeScreening.id,
        seatId: activeScreening.seats[0].id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 100000,
        status: TicketStatus.Valid,
      },
    });

    const cancelledTicket = await prisma.ticket.create({
      data: {
        userId: 1,
        screeningId: activeScreening.id,
        seatId: activeScreening.seats[1].id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 100000,
        status: TicketStatus.Cancelled,
      },
    });

    const expiredTicket = await prisma.ticket.create({
      data: {
        userId: 1,
        screeningId: expiredScreening.id,
        seatId: expiredScreening.seats[0].id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 100000,
        status: TicketStatus.Valid,
      },
    });

    testTickets = [earlyTicket, activeTicket, cancelledTicket, expiredTicket];
    console.log('✓ Đã chuẩn bị 4 vé test cho các kịch bản check-in');

    const staffCookie = await getStaffCookie();

    // =========================================================================
    // TEST 1: TỪ CHỐI CHECK-IN NẾU THIẾU CHỮ KÝ HMAC QR (Requirement 4)
    // =========================================================================
    console.log('\n--- TEST 1: Bắt lỗi khi không cung cấp chữ ký HMAC QR ---');
    const res1 = await fetch(`${BASE_URL}/api/tickets/${activeTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: {
        Cookie: staffCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const json1 = await res1.json();
    assert.strictEqual(res1.status, 400);
    assert.strictEqual(json1.code, 'MISSING_QR_SIGNATURE');
    console.log('✓ TEST 1 Passed: Bắt lỗi MISSING_QR_SIGNATURE thành công');

    // =========================================================================
    // TEST 2: TỪ CHỐI CHECK-IN NẾU CHỮ KÝ HMAC BỊ GIẢ MẠO / SAI
    // =========================================================================
    console.log('\n--- TEST 2: Bắt lỗi khi chữ ký HMAC không khớp ---');
    const res2 = await fetch(`${BASE_URL}/api/tickets/${activeTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: {
        Cookie: staffCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sig: 'fake_invalid_sig_123' }),
    });
    const json2 = await res2.json();
    assert.strictEqual(res2.status, 400);
    assert.strictEqual(json2.code, 'INVALID_QR_SIGNATURE');
    console.log('✓ TEST 2 Passed: Bắt lỗi INVALID_QR_SIGNATURE thành công');

    // =========================================================================
    // TEST 3: TỪ CHỐI CHECK-IN QUÁ SỚM THEO FR-CHK-01 (> 30 PHÚT TRƯỚC GIỜ CHIẾU)
    // =========================================================================
    console.log('\n--- TEST 3: Bắt lỗi check-in quá sớm theo FR-CHK-01 ---');
    const earlySig = generateTicketSignature(earlyTicket.id, earlyTicket.userId, earlyTicket.seatId, 'Valid');
    const res3 = await fetch(`${BASE_URL}/api/tickets/${earlyTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: {
        Cookie: staffCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sig: earlySig }),
    });
    const json3 = await res3.json();
    assert.strictEqual(res3.status, 400);
    assert.strictEqual(json3.code, 'CHECKIN_TOO_EARLY');
    console.log('✓ TEST 3 Passed: Bắt lỗi CHECKIN_TOO_EARLY thành công');

    // =========================================================================
    // TEST 4: TỪ CHỐI CHECK-IN KHI SUẤT CHIẾU ĐÃ KẾT THÚC THEO FR-CHK-01
    // =========================================================================
    console.log('\n--- TEST 4: Bắt lỗi check-in khi suất chiếu đã kết thúc ---');
    const expiredSig = generateTicketSignature(expiredTicket.id, expiredTicket.userId, expiredTicket.seatId, 'Valid');
    const res4 = await fetch(`${BASE_URL}/api/tickets/${expiredTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: {
        Cookie: staffCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sig: expiredSig }),
    });
    const json4 = await res4.json();
    assert.strictEqual(res4.status, 400);
    assert.strictEqual(json4.code, 'CHECKIN_EXPIRED');
    console.log('✓ TEST 4 Passed: Bắt lỗi CHECKIN_EXPIRED thành công');

    // =========================================================================
    // TEST 5: TỪ CHỐI CHECK-IN KHI SAI PHÒNG CHIẾU THEO FR-CHK-01
    // =========================================================================
    console.log('\n--- TEST 5: Bắt lỗi check-in sai phòng chiếu ---');
    const activeSig = generateTicketSignature(activeTicket.id, activeTicket.userId, activeTicket.seatId, 'Valid');
    const res5 = await fetch(`${BASE_URL}/api/tickets/${activeTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: {
        Cookie: staffCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sig: activeSig, room: 'Cinema Wrong Room 99' }),
    });
    const json5 = await res5.json();
    assert.strictEqual(res5.status, 400);
    assert.strictEqual(json5.code, 'ROOM_MISMATCH');
    console.log('✓ TEST 5 Passed: Bắt lỗi ROOM_MISMATCH thành công');

    // =========================================================================
    // TEST 6: SOÁT VÉ THÀNH CÔNG (ĐÚNG CHỮ KÝ, ĐÚNG PHÒNG, ĐÚNG KHUNG GIỜ)
    // =========================================================================
    console.log('\n--- TEST 6: Check-in thành công (VALID -> USED) ---');
    const res6 = await fetch(`${BASE_URL}/api/tickets/${activeTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: {
        Cookie: staffCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sig: activeSig,
        room: activeScreening.room,
      }),
    });
    const json6 = await res6.json();
    assert.strictEqual(res6.status, 200);
    assert.strictEqual(json6.success, true);
    assert.strictEqual(json6.data.status, 'Used');
    console.log('✓ TEST 6 Passed: Soát vé thành công!', json6.message);

    // =========================================================================
    // TEST 7: CHỐNG CHECK-IN TRÙNG LẶP (TICKET_ALREADY_USED)
    // =========================================================================
    console.log('\n--- TEST 7: Chống check-in trùng lặp vé đã Used ---');
    const res7 = await fetch(`${BASE_URL}/api/tickets/${activeTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: {
        Cookie: staffCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sig: activeSig,
        room: activeScreening.room,
      }),
    });
    const json7 = await res7.json();
    assert.strictEqual(res7.status, 400);
    assert.strictEqual(json7.code, 'TICKET_ALREADY_USED');
    console.log('✓ TEST 7 Passed: Chống check-in trùng thành công:', json7.message || json7.error);

    // =========================================================================
    // TEST 8: CHẶN CHECK-IN VÉ ĐÃ BỊ HỦY (TICKET_CANCELLED)
    // =========================================================================
    console.log('\n--- TEST 8: Chặn check-in vé đã bị hủy ---');
    const cancelledSig = generateTicketSignature(cancelledTicket.id, cancelledTicket.userId, cancelledTicket.seatId, 'Valid');
    const res8 = await fetch(`${BASE_URL}/api/tickets/${cancelledTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: {
        Cookie: staffCookie,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sig: cancelledSig }),
    });
    const json8 = await res8.json();
    assert.strictEqual(res8.status, 400);
    assert.strictEqual(json8.code, 'TICKET_CANCELLED');
    console.log('✓ TEST 8 Passed: Chặn vé đã hủy thành công:', json8.message || json8.error);

    console.log('\n========================================================================');
    console.log('🎉 TOÀN BỘ 8 TEST CASES XÁC MINH QR & FR-CHK-01 ĐỀU PASSED 100%!');
    console.log('========================================================================\n');
  } finally {
    for (const t of testTickets) {
      await prisma.ticket.delete({ where: { id: t.id } }).catch(() => {});
    }
    if (earlyScreening) {
      await prisma.seat.deleteMany({ where: { screeningId: earlyScreening.id } }).catch(() => {});
      await prisma.screening.delete({ where: { id: earlyScreening.id } }).catch(() => {});
    }
    if (activeScreening) {
      await prisma.seat.deleteMany({ where: { screeningId: activeScreening.id } }).catch(() => {});
      await prisma.screening.delete({ where: { id: activeScreening.id } }).catch(() => {});
    }
    if (expiredScreening) {
      await prisma.seat.deleteMany({ where: { screeningId: expiredScreening.id } }).catch(() => {});
      await prisma.screening.delete({ where: { id: expiredScreening.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Lỗi kiểm thử check-in QR:', e);
  process.exit(1);
});
