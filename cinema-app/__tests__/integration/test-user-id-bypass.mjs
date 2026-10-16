// cinema-app/__tests__/integration/test-user-id-bypass.mjs
import assert from 'assert';
import { PrismaClient, TicketStatus } from '@prisma/client';
import { getCustomerCookie } from '../helpers/auth-helper.mjs';

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

console.log('========================================================================');
console.log('🛡️ TEST SUITE: USER_ID QUERY PARAM BYPASS DEFENSE & IDOR PROTECTION (REQ 1)');
console.log('========================================================================\n');

async function main() {
  let user1Cookie = null;
  let user2Cookie = null;
  let testScreening = null;
  let user1Ticket = null;

  async function withRetry(fn, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  try {
    user1Cookie = await getCustomerCookie(1);
    user2Cookie = await getCustomerCookie(2);

    const movie = await withRetry(() => prisma.movie.findFirst());
    if (!movie) throw new Error('Không tìm thấy movie trong DB');

    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
    testScreening = await prisma.screening.create({
      data: {
        movieId: movie.id,
        room: 'Cinema Auth 01',
        roomNumber: 1,
        date: futureDate,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        price: 100000,
        status: 'UPCOMING',
        seats: {
          create: [{ room: 'Cinema Auth 01', row: 'Z', number: 1, code: 'Z1', type: 'STANDARD', status: 'OCCUPIED' }],
        },
      },
      include: { seats: true },
    });

    let payment = await prisma.payment.findFirst({ where: { userId: 1 } });
    if (!payment) {
      payment = await prisma.payment.create({
        data: { userId: 1, amount: 100000, paymentMethod: 'Cash', status: 'Success' },
      });
    }

    user1Ticket = await prisma.ticket.create({
      data: {
        userId: 1,
        screeningId: testScreening.id,
        seatId: testScreening.seats[0].id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 100000,
        status: TicketStatus.Valid,
      },
    });

    console.log(`✓ Đã tạo vé #${user1Ticket.id} thuộc quyền sở hữu của User 1 (ID: 1)`);

    // =========================================================================
    // TEST 1: CHẶN TRUY CẬP DANH SÁCH VÉ KHI KHÔNG ĐĂNG NHẬP DÙ CÓ ?user_id=1
    // =========================================================================
    console.log('\n--- TEST 1: GET /api/tickets?user_id=1 không session ---');
    const resListNoAuth = await fetch(`${BASE_URL}/api/tickets?user_id=1`);
    assert.strictEqual(resListNoAuth.status, 401, 'Không có session phải trả về 401 UNAUTHENTICATED');
    const jsonListNoAuth = await resListNoAuth.json();
    assert.strictEqual(jsonListNoAuth.code, 'UNAUTHENTICATED');
    console.log('✓ TEST 1 Passed: Hoàn toàn loại bỏ query user_id bypass trong danh sách vé (401 UNAUTHENTICATED)');

    // =========================================================================
    // TEST 2: CHẶN XEM CHI TIẾT VÉ KHI KHÔNG ĐĂNG NHẬP DÙ CÓ ?user_id=1
    // =========================================================================
    console.log('\n--- TEST 2: GET /api/tickets/[id]?user_id=1 không session ---');
    const resDetailNoAuth = await fetch(`${BASE_URL}/api/tickets/${user1Ticket.id}?user_id=1`);
    assert.strictEqual(resDetailNoAuth.status, 401, 'Không có session phải trả về 401 UNAUTHENTICATED');
    const jsonDetailNoAuth = await resDetailNoAuth.json();
    assert.strictEqual(jsonDetailNoAuth.code, 'UNAUTHENTICATED');
    console.log('✓ TEST 2 Passed: Hoàn toàn loại bỏ query user_id bypass trong chi tiết vé (401 UNAUTHENTICATED)');

    // =========================================================================
    // TEST 3: CHẶN HỦY VÉ KHI KHÔNG ĐĂNG NHẬP DÙ CÓ ?user_id=1
    // =========================================================================
    console.log('\n--- TEST 3: DELETE /api/tickets/[id]?user_id=1 không session ---');
    const resDeleteNoAuth = await fetch(`${BASE_URL}/api/tickets/${user1Ticket.id}?user_id=1`, {
      method: 'DELETE',
    });
    assert.strictEqual(resDeleteNoAuth.status, 401, 'Không có session phải trả về 401 UNAUTHENTICATED');
    const jsonDeleteNoAuth = await resDeleteNoAuth.json();
    assert.strictEqual(jsonDeleteNoAuth.code, 'UNAUTHENTICATED');
    console.log('✓ TEST 3 Passed: Hoàn toàn loại bỏ query user_id bypass trong hủy vé (401 UNAUTHENTICATED)');

    // =========================================================================
    // TEST 4: IDOR DEFENSE - USER 2 CÓ SESSION NHƯNG TRUY CẬP VÉ CỦA USER 1
    // =========================================================================
    console.log('\n--- TEST 4: User 2 cố gắng xem chi tiết vé của User 1 (IDOR) ---');
    const resUser2Access = await fetch(`${BASE_URL}/api/tickets/${user1Ticket.id}`, {
      headers: { Cookie: user2Cookie },
    });
    assert.strictEqual(resUser2Access.status, 403, 'User khác không có quyền xem vé phải bị 403 FORBIDDEN');
    const jsonUser2Access = await resUser2Access.json();
    assert.strictEqual(jsonUser2Access.code, 'FORBIDDEN');
    console.log('✓ TEST 4 Passed: Chặn IDOR thành công (403 FORBIDDEN)');

    // =========================================================================
    // TEST 5: IDOR DEFENSE - USER 2 CỐ TÌNH TRUYỀN ?user_id=1 KÈM SESSION USER 2
    // =========================================================================
    console.log('\n--- TEST 5: User 2 cố tình truyền ?user_id=1 kèm session User 2 ---');
    const resTamperedParam = await fetch(`${BASE_URL}/api/tickets/${user1Ticket.id}?user_id=1`, {
      headers: { Cookie: user2Cookie },
    });
    assert.strictEqual(resTamperedParam.status, 403, 'Server phải dựa vào session, phớt lờ query param giả mạo');
    console.log('✓ TEST 5 Passed: Server chỉ tin cậy session server-side, từ chối tham số query giả mạo');

    // =========================================================================
    // TEST 6: CHÍNH CHỦ USER 1 TRUY CẬP THÀNH CÔNG VỚI ĐẦY ĐỦ THÔNG TIN
    // =========================================================================
    console.log('\n--- TEST 6: Chính chủ User 1 xem vé hợp lệ ---');
    const resOwner = await fetch(`${BASE_URL}/api/tickets/${user1Ticket.id}`, {
      headers: { Cookie: user1Cookie },
    });
    const jsonOwner = await resOwner.json();
    if (resOwner.status !== 200) {
      console.error('Test 6 Failed:', resOwner.status, jsonOwner);
    }
    assert.strictEqual(resOwner.status, 200);
    assert.strictEqual(jsonOwner.success, true);
    assert.strictEqual(jsonOwner.data.id, user1Ticket.id);
    assert.strictEqual(jsonOwner.data.user.id, 1);
    console.log('✓ TEST 6 Passed: Chính chủ User 1 xem vé thành công với quyền sở hữu được bảo đảm');

    console.log('\n========================================================================');
    console.log('🎉 TOÀN BỘ 6 TEST CASES CHỐNG BYPASS USER_ID QUERY ĐỀU PASSED 100%!');
    console.log('========================================================================\n');
  } finally {
    if (user1Ticket) {
      await prisma.ticket.delete({ where: { id: user1Ticket.id } }).catch(() => {});
    }
    if (testScreening) {
      await prisma.seat.deleteMany({ where: { screeningId: testScreening.id } }).catch(() => {});
      await prisma.screening.delete({ where: { id: testScreening.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Lỗi kiểm thử IDOR / user_id bypass:', e);
  process.exit(1);
});
