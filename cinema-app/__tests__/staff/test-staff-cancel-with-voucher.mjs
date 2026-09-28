// __tests__/staff/test-staff-cancel-with-voucher.mjs
import { PrismaClient, TicketStatus, SeatStatus } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🚀 === BẮT ĐẦU KIỂM THỬ API STAFF TICKET FORCE-CANCEL (UC-15) ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Chuẩn bị dữ liệu kiểm thử trong DB
    // 1. Lấy một screening đang có
    const screening = await prisma.screening.findFirst({
      where: { status: 'UPCOMING' },
      include: { seats: true },
    });

    if (!screening) {
      throw new Error('Không tìm thấy suất chiếu nào trong DB để test');
    }

    // Lấy 1 ghế trống hoặc cập nhật thành OCCUPIED cho test
    let testSeat = await prisma.seat.findFirst({
      where: { screeningId: screening.id, status: 'EMPTY' },
    });

    if (!testSeat) {
      testSeat = await prisma.seat.create({
        data: {
          screeningId: screening.id,
          room: screening.room,
          row: 'Z',
          number: 99,
          code: 'Z99',
          status: 'OCCUPIED',
        },
      });
    } else {
      testSeat = await prisma.seat.update({
        where: { id: testSeat.id },
        data: { status: 'OCCUPIED' },
      });
    }

    // Lấy user khách hàng
    const customer = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
    });

    // Lấy hoặc tạo payment
    let payment = await prisma.payment.findFirst({
      where: { userId: customer.id },
    });

    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          userId: customer.id,
          amount: 150000,
          paymentMethod: 'Cash',
          status: 'Success',
        },
      });
    }

    // Tạo ticket test
    const testTicket = await prisma.ticket.create({
      data: {
        userId: customer.id,
        screeningId: screening.id,
        seatId: testSeat.id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 150000,
        status: TicketStatus.Valid,
      },
    });

    console.log(`Đã tạo vé test #${testTicket.id} cho ghế ${testSeat.code} (Status: Valid, Seat: OCCUPIED)\n`);

    // TEST 1: Chưa đăng nhập -> 401 UNAUTHENTICATED
    console.log('--- TEST 1: Bắt lỗi 401 khi chưa đăng nhập ---');
    const res1 = await fetchJson(`/api/staff/tickets/${testTicket.id}/cancel-with-voucher`, {
      method: 'POST',
    });
    assert(
      res1.status === 401 && res1.data.code === 'UNAUTHENTICATED',
      `Chặn thành công truy cập chưa đăng nhập (Status: ${res1.status}, Code: ${res1.data.code})`
    );

    // TEST 2: Người dùng CUSTOMER -> 403 FORBIDDEN
    console.log('\n--- TEST 2: Bắt lỗi 403 khi role là CUSTOMER ---');
    const res2 = await fetchJson(`/api/staff/tickets/${testTicket.id}/cancel-with-voucher?role=CUSTOMER`, {
      method: 'POST',
    });
    assert(
      res2.status === 403 && res2.data.code === 'FORBIDDEN',
      `Chặn thành công vai trò khách hàng (Status: ${res2.status}, Code: ${res2.data.code})`
    );

    // TEST 3: Vé không tồn tại -> 404 TICKET_NOT_FOUND
    console.log('\n--- TEST 3: Bắt lỗi 404 khi mã vé không tồn tại ---');
    const res3 = await fetchJson(`/api/staff/tickets/9999999/cancel-with-voucher?role=STAFF`, {
      method: 'POST',
    });
    assert(
      res3.status === 404 && res3.data.code === 'TICKET_NOT_FOUND',
      `Báo lỗi 404 chính xác khi vé không tồn tại (Status: ${res3.status}, Code: ${res3.data.code})`
    );

    // TEST 4: Nhân viên STAFF thực hiện ép hủy vé và hoàn tiền 100% (UC-15)
    console.log('\n--- TEST 4: Nhân viên STAFF thực hiện ép hủy vé và hoàn tiền 100% ---');
    const res4 = await fetchJson(`/api/staff/tickets/${testTicket.id}/cancel-with-voucher?role=STAFF`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Sự cố máy chiếu tại rạp Cinema 01',
        issue_voucher: true,
        notes: 'Đền bù khách VIP theo quy trình UC-15',
      }),
    });

    assert(
      res4.status === 200 && res4.data.success === true,
      `STAFF hủy vé thành công (Status: ${res4.status}, Message: ${res4.data.message})`
    );

    const data4 = res4.data.data;
    assert(
      data4.status === 'Cancelled',
      `Trạng thái vé trả về là Cancelled (Status: ${data4.status})`
    );
    assert(
      data4.refund_percentage === 100 && data4.refund_amount === 150000,
      `Ghi nhận hoàn tiền 100%: ${data4.refund_percentage}%, Số tiền: ${data4.refund_amount}đ`
    );
    assert(
      data4.compensation_voucher && data4.compensation_voucher.discount_value === 100,
      `Voucher bồi hoàn 100% được tạo thành công: ${data4.compensation_voucher?.code}`
    );
    assert(
      data4.audit_log && data4.audit_log.action === 'STAFF_FORCE_CANCEL_TICKET_UC15',
      `Log kiểm toán được ghi nhận: ${data4.audit_log?.reason}`
    );

    // TEST 5: Kiểm tra tính toàn vẹn cơ sở dữ liệu sau Transaction
    console.log('\n--- TEST 5: Kiểm tra tính toàn vẹn cơ sở dữ liệu sau Transaction ---');
    const dbTicket = await prisma.ticket.findUnique({
      where: { id: testTicket.id },
    });
    assert(
      dbTicket?.status === TicketStatus.Cancelled,
      `Cơ sở dữ liệu: Vé #${testTicket.id} có trạng thái Cancelled`
    );

    const dbSeat = await prisma.seat.findUnique({
      where: { id: testSeat.id },
    });
    assert(
      dbSeat?.status === SeatStatus.EMPTY,
      `Cơ sở dữ liệu: Ghế ${testSeat.code} đã được giải phóng về trạng thái EMPTY`
    );

    const dbCoupon = await prisma.coupon.findUnique({
      where: { code: data4.compensation_voucher.code },
    });
    assert(
      dbCoupon && Number(dbCoupon.discountValue) === 100 && dbCoupon.userId === customer.id,
      `Cơ sở dữ liệu: Voucher ${dbCoupon?.code} giảm 100% cho userId=${dbCoupon?.userId}`
    );

    // TEST 6: Cố gắng hủy lại vé đã Cancelled -> 400 TICKET_ALREADY_CANCELLED
    console.log('\n--- TEST 6: Bắt lỗi khi cố gắng hủy lại vé đã bị Cancelled ---');
    const res6 = await fetchJson(`/api/staff/tickets/${testTicket.id}/cancel-with-voucher?role=STAFF`, {
      method: 'POST',
    });
    assert(
      res6.status === 400 && res6.data.code === 'TICKET_ALREADY_CANCELLED',
      `Chặn thành công việc hủy lại vé đã Cancelled (Status: ${res6.status}, Code: ${res6.data.code})`
    );

    // TEST 7: Quản trị viên (ADMIN) cũng có toàn quyền thực hiện hủy vé
    console.log('\n--- TEST 7: Quản trị viên (ADMIN) thực hiện hủy vé ---');
    // Tạo vé test thứ 2
    const testTicket2 = await prisma.ticket.create({
      data: {
        userId: customer.id,
        screeningId: screening.id,
        seatId: testSeat.id,
        paymentId: payment.id,
        ticketType: 'Thường',
        price: 120000,
        status: TicketStatus.Valid,
      },
    });

    const res7 = await fetchJson(`/api/staff/tickets/${testTicket2.id}/cancel-with-voucher?role=ADMIN`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'Admin phê duyệt xử lý hoàn vé khẩn cấp',
      }),
    });

    assert(
      res7.status === 200 && res7.data.success === true,
      `ADMIN hủy vé thành công (Status: ${res7.status})`
    );

  } catch (err) {
    console.error('Lỗi kiểm thử:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n=============================================`);
  console.log(`KẾT QUẢ: ${passed} PASS, ${failed} FAIL`);
  console.log(`=============================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
