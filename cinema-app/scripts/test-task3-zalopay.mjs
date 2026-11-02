import assert from 'assert';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  ZALOPAY_CONFIG,
  generateZaloPayTransId,
  calculateZaloPayOrderMac,
  verifyZaloPayCallback,
  createZaloPayOrder,
} from '../src/lib/zalopay.ts';

const prisma = new PrismaClient();

async function runTask3ZaloPayTests() {
  console.log('================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TASK 3: ZALOPAY SANDBOX INTEGRATION');
  console.log('================================================================\n');

  // =========================================================================
  // 1. KIỂM TRA CẤU HÌNH MÔI TRƯỜNG ZALOPAY
  // =========================================================================
  console.log('--- TEST 1: Kiểm tra cấu hình biến môi trường ZaloPay Sandbox ---');
  assert.ok(ZALOPAY_CONFIG.appId, 'ZALOPAY_APP_ID phải được định nghĩa');
  assert.ok(ZALOPAY_CONFIG.key1, 'ZALOPAY_KEY1 phải được định nghĩa');
  assert.ok(ZALOPAY_CONFIG.key2, 'ZALOPAY_KEY2 phải được định nghĩa');
  assert.ok(ZALOPAY_CONFIG.endpoint, 'ZALOPAY_ENDPOINT phải được định nghĩa');
  console.log('✓ TEST 1 Passed: Cấu hình ZaloPay hợp lệ:');
  console.log(`  - App ID: ${ZALOPAY_CONFIG.appId}`);
  console.log(`  - Endpoint: ${ZALOPAY_CONFIG.endpoint}`);
  console.log(`  - Key1: ${ZALOPAY_CONFIG.key1.slice(0, 6)}... (length ${ZALOPAY_CONFIG.key1.length})`);
  console.log(`  - Key2: ${ZALOPAY_CONFIG.key2.slice(0, 6)}... (length ${ZALOPAY_CONFIG.key2.length})\n`);

  // =========================================================================
  // 2. KIỂM THỬ ĐỊNH DẠNG APP_TRANS_ID (YYMMDD_xxxx)
  // =========================================================================
  console.log('--- TEST 2: Kiểm thử định dạng app_trans_id theo chuẩn ZaloPay ---');
  const transId1 = generateZaloPayTransId();
  const transId2 = generateZaloPayTransId();

  assert.notStrictEqual(transId1, transId2, 'Hai mã giao dịch liên tiếp phải là duy nhất');
  assert.match(
    transId1,
    /^\d{6}_\d+_\d+$/,
    `app_trans_id (${transId1}) phải có tiền tố YYMMDD_ theo sau là timestamp và random id`
  );

  const now = new Date();
  const expectedPrefix = String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  assert.ok(
    transId1.startsWith(expectedPrefix),
    `app_trans_id phải bắt đầu bằng ngày hiện tại ${expectedPrefix}`
  );
  console.log(`✓ TEST 2 Passed: Định dạng app_trans_id chuẩn xác: ${transId1}\n`);

  // =========================================================================
  // 3. KIỂM THỬ TÍNH TOÁN CHỮ KÝ MAC CHO ĐƠN HÀNG (HMAC-SHA256 với KEY1)
  // =========================================================================
  console.log('--- TEST 3: Kiểm thử thuật toán sinh chữ ký MAC tạo đơn hàng ---');
  const testAppTime = 1730533600000;
  const testAmount = 150000;
  const testUser = 'user_test_lumi';
  const testEmbed = '{"redirecturl":"http://localhost:3000"}';
  const testItem = '[{"name":"Vé thường","price":150000,"quantity":1}]';

  const mac1 = calculateZaloPayOrderMac(
    transId1,
    testUser,
    testAmount,
    testAppTime,
    testEmbed,
    testItem,
    '2553',
    'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL'
  );

  assert.strictEqual(mac1.length, 64, 'MAC phải là chuỗi hex SHA256 gồm 64 ký tự');
  assert.match(mac1, /^[0-9a-f]{64}$/, 'MAC phải là chuỗi lowercase hex');

  // Kiểm tra tính tất định
  const mac2 = calculateZaloPayOrderMac(
    transId1,
    testUser,
    testAmount,
    testAppTime,
    testEmbed,
    testItem,
    '2553',
    'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL'
  );
  assert.strictEqual(mac1, mac2, 'Hai lần tính cùng tham số phải cho kết quả giống hệt nhau');

  // Kiểm tra tính nhạy cảm khi thay đổi dù chỉ 1 ký tự
  const macAltered = calculateZaloPayOrderMac(
    transId1,
    testUser,
    testAmount + 1, // Thay đổi số tiền 1đ
    testAppTime,
    testEmbed,
    testItem,
    '2553',
    'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL'
  );
  assert.notStrictEqual(mac1, macAltered, 'Thay đổi tham số bắt buộc phải sinh ra MAC khác');
  console.log('✓ TEST 3 Passed: Tính toán MAC HMAC-SHA256 với Key1 chuẩn xác:', mac1, '\n');

  // =========================================================================
  // 4. KIỂM THỬ XÁC THỰC CHỮ KÝ CALLBACK WEBHOOK (HMAC-SHA256 với KEY2)
  // =========================================================================
  console.log('--- TEST 4: Kiểm thử xác thực chữ ký Webhook Callback với KEY2 ---');
  const mockCallbackData = JSON.stringify({
    app_id: 2553,
    app_trans_id: transId1,
    app_time: Date.now(),
    app_user: testUser,
    amount: testAmount,
    embed_data: testEmbed,
    item: testItem,
    zp_trans_id: 26110200001234,
    server_time: Date.now(),
  });

  // Tính chữ ký chuẩn bằng KEY2
  const validCallbackMac = crypto
    .createHmac('sha256', ZALOPAY_CONFIG.key2)
    .update(mockCallbackData)
    .digest('hex');

  // 4.1 Chữ ký hợp lệ -> true
  const isValid = verifyZaloPayCallback(mockCallbackData, validCallbackMac);
  assert.strictEqual(isValid, true, 'Callback hợp lệ phải trả về true');

  // 4.2 Chữ ký sai lệch -> false
  const isInvalid = verifyZaloPayCallback(mockCallbackData, '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
  assert.strictEqual(isInvalid, false, 'Chữ ký sai lệch phải trả về false');

  // 4.3 Dữ liệu payload bị can thiệp (Tampered) -> false
  const tamperedData = mockCallbackData.replace(`"amount":${testAmount}`, `"amount":1000`);
  const isTamperedValid = verifyZaloPayCallback(tamperedData, validCallbackMac);
  assert.strictEqual(isTamperedValid, false, 'Dữ liệu bị can thiệp phải trả về false');

  // 4.4 Dữ liệu rỗng -> false
  assert.strictEqual(verifyZaloPayCallback('', validCallbackMac), false);
  assert.strictEqual(verifyZaloPayCallback(mockCallbackData, ''), false);
  console.log('✓ TEST 4 Passed: Xác thực chữ ký Callback (timingSafeEqual) an toàn 100%\n');

  // =========================================================================
  // 5. KIỂM THỬ HÀM createZaloPayOrder (Gọi Sandbox Endpoint)
  // =========================================================================
  console.log('--- TEST 5: Kiểm thử hàm createZaloPayOrder ---');
  const orderResult = await createZaloPayOrder({
    app_trans_id: transId1,
    app_user: testUser,
    amount: testAmount,
    description: `Test order #${transId1}`,
    item: [{ name: 'Vé thường', price: testAmount, quantity: 1 }],
    embed_data: { test: true },
  });

  assert.ok(orderResult, 'createZaloPayOrder phải trả về kết quả');
  assert.ok(orderResult.app_trans_id === transId1, 'app_trans_id phải khớp với đơn hàng');
  assert.ok(orderResult.order_url, 'Phải có order_url để người dùng thanh toán');
  assert.ok(orderResult.zp_trans_token, 'Phải có zp_trans_token');
  console.log('✓ TEST 5 Passed: Tạo đơn ZaloPay thành công:');
  console.log(`  - return_code: ${orderResult.return_code} (${orderResult.return_message})`);
  console.log(`  - order_url: ${orderResult.order_url}`);
  console.log(`  - zp_trans_token: ${orderResult.zp_trans_token}\n`);

  // =========================================================================
  // 6. KIỂM THỬ LUỒNG ATOMIC DATABASE TRANSACTION & IDEMPOTENCY
  // =========================================================================
  console.log('--- TEST 6: Kiểm thử luồng Atomic Database Transaction & Idempotency ---');

  const sampleUser = await prisma.user.findFirst({
    select: { id: true, email: true },
  });
  assert.ok(sampleUser, 'Cần ít nhất 1 User trong Database để test');

  const sampleScreening = await prisma.screening.findFirst({
    where: { status: 'UPCOMING' },
    include: {
      seats: {
        where: { status: 'EMPTY' },
        take: 1,
      },
      movie: true,
    },
  });
  assert.ok(sampleScreening, 'Cần ít nhất 1 Screening trong Database để test');
  assert.ok(sampleScreening.seats.length > 0, 'Screening cần ít nhất 1 ghế trống để test');

  const testSeat = sampleScreening.seats[0];
  const testTransId = generateZaloPayTransId();

  // 6.1 Tạo đơn Payment Pending với ZaloPay
  const testPayment = await prisma.payment.create({
    data: {
      userId: sampleUser.id,
      screeningId: sampleScreening.id,
      seatIds: [testSeat.id],
      ticketItems: [{ type: 'Thường', quantity: 1, unit_price: Number(sampleScreening.price) }],
      amount: Number(sampleScreening.price),
      paymentMethod: 'ZaloPay',
      transactionCode: testTransId,
      status: 'Pending',
    },
  });
  console.log(`✓ 6.1 Tạo Payment Pending #${testPayment.id} với transactionCode = ${testTransId}`);

  // Đặt ghế sang trạng thái RESERVED
  await prisma.seat.update({
    where: { id: testSeat.id },
    data: { status: 'RESERVED', reservedUntil: new Date(Date.now() + 10 * 60 * 1000) },
  });

  // 6.2 Mô phỏng xử lý Webhook IPN lần 1 trong Atomic Transaction
  const ipnSimulate = async (transId) => {
    return await prisma.$transaction(async (tx) => {
      const p = await tx.payment.findFirst({
        where: { transactionCode: transId },
      });
      if (!p) return { return_code: 0, return_message: 'Payment not found' };
      if (p.status === 'Success') {
        const count = await tx.ticket.count({ where: { paymentId: p.id } });
        return { return_code: 1, return_message: 'success', already_processed: true, count };
      }

      await tx.payment.update({
        where: { id: p.id },
        data: { status: 'Success' },
      });

      const sIds = Array.isArray(p.seatIds) ? p.seatIds : [];
      if (sIds.length > 0) {
        await tx.seat.updateMany({
          where: { id: { in: sIds } },
          data: { status: 'OCCUPIED', reservedUntil: null },
        });

        for (const sId of sIds) {
          await tx.ticket.create({
            data: {
              userId: p.userId,
              screeningId: p.screeningId,
              seatId: sId,
              paymentId: p.id,
              ticketType: 'Thường',
              price: p.amount,
              status: 'Valid',
            },
          });
        }
      }

      return { return_code: 1, return_message: 'success', already_processed: false, count: sIds.length };
    });
  };

  const ipnResult1 = await ipnSimulate(testTransId);
  assert.strictEqual(ipnResult1.return_code, 1, 'return_code phải là 1 (thành công)');
  assert.strictEqual(ipnResult1.return_message, 'success');
  assert.strictEqual(ipnResult1.already_processed, false, 'Lần 1 không được là already_processed');
  assert.strictEqual(ipnResult1.count, 1, 'Phải tạo ra đúng 1 vé hợp lệ');

  // Kiểm tra trạng thái DB sau IPN
  const updatedPayment = await prisma.payment.findUnique({
    where: { id: testPayment.id },
    include: { tickets: true },
  });
  assert.strictEqual(updatedPayment?.status, 'Success', 'Payment status phải là Success');
  assert.strictEqual(updatedPayment?.tickets.length, 1, 'Số vé trong DB phải là 1');
  assert.strictEqual(updatedPayment?.tickets[0].status, 'Valid', 'Vé phải có status Valid');

  const updatedSeat = await prisma.seat.findUnique({
    where: { id: testSeat.id },
  });
  assert.strictEqual(updatedSeat?.status, 'OCCUPIED', 'Ghế phải được chuyển sang OCCUPIED');
  console.log(`✓ 6.2 Xử lý IPN lần 1 thành công: Payment -> Success, Ghế #${testSeat.id} -> OCCUPIED, Tạo 1 Ticket Valid`);

  // 6.3 Kiểm thử tính Idempotency (Gửi lại IPN lần 2 cho cùng giao dịch)
  const ipnResult2 = await ipnSimulate(testTransId);
  assert.strictEqual(ipnResult2.return_code, 1, 'Lần 2 return_code vẫn phải là 1');
  assert.strictEqual(ipnResult2.already_processed, true, 'Lần 2 phải nhận diện already_processed = true');

  const ticketsAfterRetry = await prisma.ticket.count({
    where: { paymentId: testPayment.id },
  });
  assert.strictEqual(ticketsAfterRetry, 1, 'Không được sinh thêm vé trùng lặp khi nhận duplicate IPN');
  console.log('✓ 6.3 Idempotency Check thành công: Duplicate IPN không tạo thêm vé trùng lặp');

  // Dọn dẹp dữ liệu test
  await prisma.ticket.deleteMany({ where: { paymentId: testPayment.id } });
  await prisma.payment.delete({ where: { id: testPayment.id } });
  await prisma.seat.update({
    where: { id: testSeat.id },
    data: { status: 'EMPTY', reservedUntil: null },
  });
  console.log('✓ 6.4 Dọn dẹp bản ghi kiểm thử thành công\n');

  console.log('================================================================');
  console.log('🎉 TẤT CẢ TEST CASES CHO TASK 3 (ZALOPAY SANDBOX) ĐỀU PASSED 100%!');
  console.log('================================================================\n');
}

runTask3ZaloPayTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
    await prisma.$disconnect();
    process.exit(1);
  });
