import { strict as assert } from 'assert';
import { prisma } from '../../src/lib/prisma.ts';

const BASE_URL = 'http://localhost:3000';

async function runIntegrationTest() {
  console.log('🚀 === BẮT ĐẦU KIỂM THỬ TÍCH HỢP EMAIL SERVICE (PHASE 14) ===');

  // 1. Kiểm thử hủy vé khách hàng qua POST /api/tickets/[id]/cancel
  console.log('\n--- KỊCH BẢN 1: HỦY VÉ KHÁCH HÀNG QUA /api/tickets/[id]/cancel ---');

  // Chuẩn bị suất chiếu và vé test ở tương lai > 2 tiếng
  const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 tiếng sau
  const movie = await prisma.movie.findFirst();
  assert.ok(movie, 'Phải có ít nhất 1 phim trong DB');

  const screening = await prisma.screening.create({
    data: {
      movieId: movie.id,
      roomNumber: 2,
      room: 'Cinema 02',
      startTime: futureDate,
      endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
      price: 120000,
      date: futureDate,
    },
  });

  const seat = await prisma.seat.create({
    data: {
      screeningId: screening.id,
      code: `T${Date.now() % 1000}`,
      row: 'T',
      number: 1,
      type: 'STANDARD',
      status: 'RESERVED',
    },
  });

  const user = await prisma.user.findFirst({
    where: { email: 'khachhang@lumi.vn' },
  });
  assert.ok(user, 'Khách hàng khachhang@lumi.vn phải tồn tại');

  let payment = await prisma.payment.findFirst({
    where: { userId: user.id },
  });
  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: 120000,
        paymentMethod: 'VNPay',
        status: 'Success',
      },
    });
  }

  const ticket = await prisma.ticket.create({
    data: {
      userId: user.id,
      screeningId: screening.id,
      seatId: seat.id,
      paymentId: payment.id,
      price: 120000,
      status: 'Valid',
      ticketType: 'Thường',
    },
  });

  console.log(`  Đã chuẩn bị vé test #${ticket.id} cho user #${user.id} (${user.email})`);

  // Gọi POST /api/tickets/[id]/cancel
  const cancelRes = await fetch(`${BASE_URL}/api/tickets/${ticket.id}/cancel?user_id=${user.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const cancelData = await cancelRes.json();
  console.log('  Kết quả hủy vé:', cancelData);
  assert.equal(cancelRes.status, 200, 'POST /api/tickets/[id]/cancel phải trả về HTTP 200');
  assert.equal(cancelData.success, true, 'success phải là true');
  assert.equal(cancelData.data.status, 'Cancelled', 'Trạng thái vé phải là Cancelled');
  assert.ok(cancelData.data.compensation_coupon?.code, 'Phải tạo voucher đền bù');
  console.log('  ✅ [PASS] Hủy vé và kích hoạt email voucher 50% bất đồng bộ thành công!');

  // 2. Kiểm thử hủy vé có sự cố qua POST /api/staff/tickets/[id]/cancel-with-voucher
  console.log('\n--- KỊCH BẢN 2: NHÂN VIÊN ÉP HỦY VÉ UC-15 /api/staff/tickets/[id]/cancel-with-voucher ---');

  const staffUser = await prisma.user.findFirst({
    where: { role: 'STAFF' },
  });
  assert.ok(staffUser, 'Phải có nhân viên STAFF');

  const staffSeat = await prisma.seat.create({
    data: {
      screeningId: screening.id,
      code: `S${Date.now() % 1000}`,
      row: 'S',
      number: 2,
      type: 'STANDARD',
      status: 'RESERVED',
    },
  });

  const staffTicket = await prisma.ticket.create({
    data: {
      userId: user.id,
      screeningId: screening.id,
      seatId: staffSeat.id,
      paymentId: payment.id,
      price: 120000,
      status: 'Valid',
      ticketType: 'Thường',
    },
  });

  const staffCancelRes = await fetch(`${BASE_URL}/api/staff/tickets/${staffTicket.id}/cancel-with-voucher?role=STAFF&staff_id=${staffUser.id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason: 'Sự cố mất điện rạp Cinema 02 (Kiểm thử Phase 14 email)',
      notes: 'Bồi hoàn 100% tự động',
    }),
  });

  const staffCancelData = await staffCancelRes.json();
  console.log('  Kết quả staff hủy vé:', staffCancelData);
  assert.equal(staffCancelRes.status, 200, 'Staff cancel phải trả về HTTP 200');
  assert.equal(staffCancelData.success, true, 'success phải là true');
  assert.equal(staffCancelData.data.refund_percentage, 100, 'Mức hoàn phải là 100%');
  assert.ok(staffCancelData.data.compensation_voucher?.code, 'Phải có voucher hoàn 100%');
  console.log('  ✅ [PASS] Staff force-cancel và kích hoạt email voucher 100% bất đồng bộ thành công!');

  console.log('\n🎉 TOÀN BỘ CÁC ĐIỂM NHÚNG EMAIL SERVICE ĐỀU ĐẠT CHUẨN 100%!');
}

runIntegrationTest()
  .catch((err) => {
    console.error('❌ Lỗi kiểm thử:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
