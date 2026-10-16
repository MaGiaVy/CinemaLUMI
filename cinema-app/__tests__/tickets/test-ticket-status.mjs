import assert from 'assert';
import { PrismaClient, TicketStatus, SeatStatus } from '@prisma/client';
import { getStaffCookie, getCustomerCookie } from '../helpers/auth-helper.mjs';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function runTicketStatusTests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ PHASE 10: XỬ LÝ TRẠNG THÁI VÉ (DELETE & PATCH)');
  console.log('================================================================\n');

  try {
    const user1Cookie = await getCustomerCookie(1);
    const user999Cookie = await getCustomerCookie(999);
    const staffCookie = await getStaffCookie();

    // Chuẩn bị 2 vé hợp lệ Valid cho User 1 trong tương lai (đủ điều kiện hủy trước 2h)
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h tới
    let screening = await prisma.screening.findFirst({
      where: {
        startTime: { gt: new Date(Date.now() + 4 * 60 * 60 * 1000) },
      },
      include: { seats: true },
    });

    if (!screening) {
      const movie = await prisma.movie.findFirst();
      screening = await prisma.screening.create({
        data: {
          movieId: movie.id,
          date: futureDate,
          startTime: futureDate,
          endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
          room: 'Cinema 01',
          roomNumber: 1,
          price: 100000,
          status: 'UPCOMING',
          seats: {
            create: [
              { room: 'Cinema 01', row: 'A', number: 1, code: 'A1', type: 'STANDARD', status: 'EMPTY' },
              { room: 'Cinema 01', row: 'A', number: 2, code: 'A2', type: 'STANDARD', status: 'EMPTY' },
            ],
          },
        },
        include: { seats: true },
      });
    }

    // Ghế 1 & Ghế 2
    let seat1 = screening.seats[0];
    let seat2 = screening.seats[1];

    await prisma.seat.update({ where: { id: seat1.id }, data: { status: 'OCCUPIED' } });
    await prisma.seat.update({ where: { id: seat2.id }, data: { status: 'OCCUPIED' } });

    // Lấy hoặc tạo payment cho User 1
    let payment = await prisma.payment.findFirst({ where: { userId: 1 } });
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          userId: 1,
          amount: 200000,
          paymentMethod: 'Cash',
          status: 'Success',
        },
      });
    }

    // Tạo 2 vé test Valid cho User 1
    const cancelTestTicket = await prisma.ticket.create({
      data: {
        userId: 1,
        screeningId: screening.id,
        seatId: seat1.id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 100000,
        status: TicketStatus.Valid,
      },
      include: { seat: true },
    });

    const staffTestTicket = await prisma.ticket.create({
      data: {
        userId: 1,
        screeningId: screening.id,
        seatId: seat2.id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 100000,
        status: TicketStatus.Valid,
      },
      include: { seat: true },
    });

    console.log(`[INFO] Vé dùng để test HỦY (BR-03): #${cancelTestTicket.id} (Ghế: ${cancelTestTicket.seat?.code})`);
    console.log(`[INFO] Vé dùng để test SOÁT VÉ (STAFF): #${staffTestTicket.id} (Ghế: ${staffTestTicket.seat?.code})\n`);

    // =========================================================================
    // TEST 1: DELETE /api/tickets/[id] - Bắt lỗi xác thực & quyền sở hữu
    // =========================================================================
    console.log('--- TEST 1: Kiểm tra quyền truy cập khi hủy vé ---');
    // 1.1 Chưa đăng nhập
    const delRes1 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}`, { method: 'DELETE' });
    const delJson1 = await delRes1.json();
    assert.strictEqual(delRes1.status, 401);
    console.log('✓ 1.1 Bắt lỗi 401 UNAUTHENTICATED thành công');

    // 1.2 User khác cố tình hủy vé (User 999 hủy vé của User 1)
    const delRes2 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}`, {
      method: 'DELETE',
      headers: { Cookie: user999Cookie },
    });
    const delJson2 = await delRes2.json();
    assert.strictEqual(delRes2.status, 403);
    console.log('✓ 1.2 Bắt lỗi 403 FORBIDDEN khi hủy vé của người khác thành công:', delJson2.message || delJson2.error);

    // =========================================================================
    // TEST 2: DELETE /api/tickets/[id] - Thực hiện Hủy vé theo ràng buộc BR-03
    // Giải phóng ghế & Nhận Voucher bồi hoàn 50%
    // =========================================================================
    console.log('\n--- TEST 2: Khách hàng tự hủy vé hợp lệ theo quy định BR-03 ---');
    const delRes3 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}`, {
      method: 'DELETE',
      headers: { Cookie: user1Cookie },
    });
    const delJson3 = await delRes3.json();

    assert.strictEqual(delRes3.status, 200, 'Hủy vé hợp lệ phải trả về HTTP 200');
    assert.strictEqual(delJson3.success, true);
    assert.strictEqual(delJson3.data.status, 'Cancelled', 'Trạng thái vé phải là Cancelled');
    assert.ok(delJson3.data.compensation_coupon, 'Phải có thông tin voucher bồi thường');
    assert.strictEqual(delJson3.data.compensation_coupon.discount_value, 50, 'Voucher bồi thường phải là 50%');

    console.log('✓ TEST 2 Passed: Hủy vé thành công!');
    console.log(`  - Vé #${delJson3.data.ticket_id} chuyển sang trạng thái: ${delJson3.data.status}`);
    console.log(`  - Đã giải phóng ghế: ${delJson3.data.released_seat}`);
    console.log(`  - Mã Voucher 50% bồi hoàn: ${delJson3.data.compensation_coupon.code} (Hạn 30 ngày)`);

    // =========================================================================
    // TEST 3: Bắt lỗi khi cố tình hủy lại vé đã bị hủy (Already Cancelled)
    // =========================================================================
    console.log('\n--- TEST 3: Bắt lỗi khi hủy lại vé đã CANCELLED ---');
    const delRes4 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}`, {
      method: 'DELETE',
      headers: { Cookie: user1Cookie },
    });
    const delJson4 = await delRes4.json();
    assert.strictEqual(delRes4.status, 400);
    assert.strictEqual(delJson4.code, 'TICKET_ALREADY_CANCELLED');
    console.log('✓ TEST 3 Passed: Bắt lỗi TICKET_ALREADY_CANCELLED thành công:', delJson4.message || delJson4.error);

    // =========================================================================
    // TEST 4: PATCH /api/tickets/[id]/mark-used - Phân quyền STAFF / ADMIN
    // =========================================================================
    console.log('\n--- TEST 4: Kiểm tra quyền STAFF khi soát vé ---');
    // 4.1 Khách hàng thông thường hoặc chưa đăng nhập
    const patchRes1 = await fetch(`${BASE_URL}/api/tickets/${staffTestTicket.id}/mark-used`, { method: 'PATCH' });
    assert.strictEqual(patchRes1.status, 401);
    console.log('✓ 4.1 Chặn thành công khi chưa đăng nhập (Status: 401)');

    // 4.1b Khách hàng có session CUSTOMER
    const patchRes1b = await fetch(`${BASE_URL}/api/tickets/${staffTestTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: { Cookie: user1Cookie },
    });
    assert.strictEqual(patchRes1b.status, 403);
    console.log('✓ 4.1b Chặn thành công người dùng vai trò CUSTOMER (Status: 403)');

    // =========================================================================
    // TEST 5: PATCH /api/tickets/[id]/mark-used - Nhân viên STAFF soát vé thành công
    // =========================================================================
    console.log('\n--- TEST 5: Nhân viên STAFF soát vé (VALID -> USED) ---');
    const patchRes2 = await fetch(`${BASE_URL}/api/tickets/${staffTestTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: { Cookie: staffCookie },
    });
    const patchJson2 = await patchRes2.json();

    assert.strictEqual(patchRes2.status, 200, 'Soát vé thành công phải là HTTP 200');
    assert.strictEqual(patchJson2.success, true);
    assert.strictEqual(patchJson2.data.status, 'Used', 'Trạng thái vé phải chuyển thành Used');

    console.log('✓ TEST 5 Passed: Soát vé thành công!');
    console.log(`  - Vé #${patchJson2.data.ticket_id} (Ghế ${patchJson2.data.seat_code}) đã chuyển sang: ${patchJson2.data.status}`);
    console.log(`  - Khách hàng: ${patchJson2.data.customer_name}`);
    console.log(`  - Thời điểm check-in: ${patchJson2.data.checked_in_at}`);

    // =========================================================================
    // TEST 6: Bắt lỗi khi soát lại vé đã USED (Chống gian lận vé vào rạp 2 lần)
    // =========================================================================
    console.log('\n--- TEST 6: Bắt lỗi khi quét lại vé đã qua sử dụng ---');
    const patchRes3 = await fetch(`${BASE_URL}/api/tickets/${staffTestTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: { Cookie: staffCookie },
    });
    const patchJson3 = await patchRes3.json();
    assert.strictEqual(patchRes3.status, 400);
    assert.strictEqual(patchJson3.code, 'TICKET_ALREADY_USED');
    console.log('✓ TEST 6 Passed: Chống quét vé trùng lặp thành công:', patchJson3.message || patchJson3.error);

    // =========================================================================
    // TEST 7: Bắt lỗi khi cố tình soát vé đã bị HỦY (Cancelled)
    // =========================================================================
    console.log('\n--- TEST 7: Chặn check-in vé đã bị hủy ---');
    const patchRes4 = await fetch(`${BASE_URL}/api/tickets/${cancelTestTicket.id}/mark-used`, {
      method: 'PATCH',
      headers: { Cookie: staffCookie },
    });
    const patchJson4 = await patchRes4.json();
    assert.strictEqual(patchRes4.status, 400);
    assert.strictEqual(patchJson4.code, 'TICKET_CANCELLED');
    console.log('✓ TEST 7 Passed: Chặn vé đã hủy thành công:', patchJson4.message || patchJson4.error);

    console.log('\n================================================================');
    console.log('🎉 TẤT CẢ TEST CASES CHO CÁC THAO TÁC TRẠNG THÁI VÉ ĐỀU PASSED!');
    console.log('================================================================\n');
  } finally {
    await prisma.$disconnect();
  }
}

runTicketStatusTests().catch(err => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
