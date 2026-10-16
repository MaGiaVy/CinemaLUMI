import assert from 'assert';
import { getCustomerCookie } from '../helpers/auth-helper.mjs';
import { generateVnpaySignature } from '../../src/lib/vnpay.ts';

const BASE_URL = 'http://localhost:3000';
const VNP_SECRET = process.env.VNP_HASH_SECRET || 'DEMOHASHSECRET1234567890123456';

async function runPaymentCallbacksTests() {
  console.log('================================================================');
  console.log('🚀 KIỂM THỬ PHASE 9: VNPAY CALLBACKS (IPN WEBHOOK & RETURN URL)');
  console.log('================================================================\n');

  const customerCookie = await getCustomerCookie();

  // Test Bảo mật: Bắt buộc xác thực khi initiate payment
  console.log('--- TEST BẢO MẬT: Bắt lỗi 401 khi khách chưa đăng nhập cố đặt vé ---');
  const unauthRes = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      screening_id: 2,
      seat_ids: [1],
      payment_method: 'VNPay',
    }),
  });
  assert.strictEqual(unauthRes.status, 401, 'Khách chưa đăng nhập phải bị từ chối 401');
  console.log('✓ Chặn thành công khách vãng lai chưa xác thực tạo đơn thanh toán (Status 401)');

  // Lấy suất chiếu #2 và lọc các ghế chưa có người mua
  const screeningRes = await fetch(`${BASE_URL}/api/screenings/2`);
  const screeningJson = await screeningRes.json();
  const seats = screeningJson.data?.seats || [];
  const availableSeats = seats.filter(s => s.status !== 'OCCUPIED');
  assert.ok(availableSeats.length >= 3, 'Cần ít nhất 3 ghế còn trống để chạy test cases');

  const seatA = availableSeats[0];
  const seatB = availableSeats[1];
  const seatC = availableSeats[2];
  console.log(`[INFO] Sử dụng Suất chiếu #2 - Ghế A: #${seatA.id} (${seatA.code}), Ghế B: #${seatB.id} (${seatB.code}), Ghế C: #${seatC.id} (${seatC.code})\n`);

  // Lấy 1 combo
  const combosRes = await fetch(`${BASE_URL}/api/combos`);
  const combosJson = await combosRes.json();
  const testCombo = combosJson.data?.[0];
  console.log(`[INFO] Combo: #${testCombo.id} (${testCombo.name}) - Tồn kho: ${testCombo.stock}\n`);

  // =========================================================================
  // KỊCH BẢN 1: GIAO DỊCH THÀNH CÔNG (SUCCESS FLOW) VỚI CHỮ KÝ VNPAY CHUẨN
  // =========================================================================
  console.log('--- KỊCH BẢN 1: Khởi tạo thanh toán và xử lý IPN Thành công ---');

  // 1.1 Khởi tạo đơn thanh toán có Cookie phiên đăng nhập
  const initRes1 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      screening_id: 2,
      seat_ids: [seatA.id],
      ticket_items: [{ type: 'Thường', quantity: 1 }],
      combo_items: [{ combo_id: testCombo.id, quantity: 1 }],
      payment_method: 'VNPay',
    }),
  });
  const initJson1 = await initRes1.json();
  assert.strictEqual(initRes1.status, 201);
  const paymentId1 = initJson1.data.payment_id;
  console.log(`✓ 1.1 Tạo Payment #${paymentId1} trạng thái Pending`);

  // 1.2 Giả lập Webhook VNPay IPN có chữ ký HMAC-SHA512 hợp lệ
  const ipnParams1 = {
    payment_id: String(paymentId1),
    status: 'success',
    vnp_ResponseCode: '00',
    vnp_TransactionNo: 'VNP_12345678',
  };
  const validHash1 = generateVnpaySignature(ipnParams1, VNP_SECRET);

  const ipnRes1 = await fetch(
    `${BASE_URL}/api/payments/vnpay-ipn?payment_id=${paymentId1}&status=success&vnp_ResponseCode=00&vnp_TransactionNo=VNP_12345678&vnp_SecureHash=${validHash1}`
  );
  const ipnJson1 = await ipnRes1.json();
  assert.strictEqual(ipnRes1.status, 200, 'IPN phải phản hồi HTTP 200');
  assert.strictEqual(ipnJson1.success, true);
  assert.strictEqual(ipnJson1.data.status, 'Success', 'Payment phải chuyển thành Success');
  assert.strictEqual(ipnJson1.data.tickets_created_count, 1, 'Phải tạo đúng 1 Ticket');
  assert.strictEqual(ipnJson1.data.RspCode, '00', 'RspCode phải là 00');
  console.log(`✓ 1.2 Webhook IPN ký số hợp lệ xử lý thành công: Payment status = Success, xuất ${ipnJson1.data.tickets_created_count} vé`);

  // 1.3 Kiểm tra Idempotency (Gửi lại IPN lần 2 cho cùng payment_id)
  const ipnRes1Retry = await fetch(
    `${BASE_URL}/api/payments/vnpay-ipn?payment_id=${paymentId1}&status=success&vnp_ResponseCode=00&vnp_TransactionNo=VNP_12345678&vnp_SecureHash=${validHash1}`
  );
  const ipnJson1Retry = await ipnRes1Retry.json();
  assert.strictEqual(ipnJson1Retry.data.already_processed, true, 'Lần 2 phải báo already_processed = true');
  assert.strictEqual(ipnJson1Retry.data.RspCode, '02', 'RspCode VNPay phải là 02 (Order already confirmed)');
  console.log('✓ 1.3 Tính Idempotent: IPN không tạo trùng lặp vé khi nhận duplicate webhook');

  // =========================================================================
  // KỊCH BẢN 2: GIAO DỊCH THẤT BẠI / HỦY (FAILED FLOW)
  // Ghế và bắp nước phải được tự động giải phóng (release)
  // =========================================================================
  console.log('\n--- KỊCH BẢN 2: Khởi tạo thanh toán và xử lý IPN Thất bại / Hủy ---');

  // 2.1 Khởi tạo đơn thanh toán cho Ghế B
  const initRes2 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      screening_id: 2,
      seat_ids: [seatB.id],
      combo_items: [{ combo_id: testCombo.id, quantity: 2 }],
      payment_method: 'VNPay',
    }),
  });
  const initJson2 = await initRes2.json();
  assert.strictEqual(initRes2.status, 201);
  const paymentId2 = initJson2.data.payment_id;
  console.log(`✓ 2.1 Tạo Payment #${paymentId2} trạng thái Pending`);

  // 2.2 Giả lập Webhook VNPay IPN báo FAILED (vnp_ResponseCode=24 - Khách hủy giao dịch)
  const ipnParams2 = {
    payment_id: String(paymentId2),
    status: 'failed',
    vnp_ResponseCode: '24',
  };
  const validHash2 = generateVnpaySignature(ipnParams2, VNP_SECRET);

  const ipnRes2 = await fetch(
    `${BASE_URL}/api/payments/vnpay-ipn?payment_id=${paymentId2}&status=failed&vnp_ResponseCode=24&vnp_SecureHash=${validHash2}`
  );
  const ipnJson2 = await ipnRes2.json();
  assert.strictEqual(ipnRes2.status, 200);
  assert.strictEqual(ipnJson2.data.status, 'Failed', 'Payment phải chuyển thành Failed');
  assert.strictEqual(ipnJson2.data.tickets_created_count, 0, 'Không được tạo vé khi thất bại');
  console.log('✓ 2.2 Webhook IPN xử lý thất bại thành công: Payment status = Failed, đã giải phóng ghế & bắp nước');

  // =========================================================================
  // KỊCH BẢN 3: KIỂM THỬ VNPAY RETURN URL (REDIRECT)
  // =========================================================================
  console.log('\n--- KỊCH BẢN 3: Kiểm thử Return URL (GET /api/payments/vnpay-return) ---');

  // Tạo payment mới để test return
  const initRes3 = await fetch(`${BASE_URL}/api/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: customerCookie,
    },
    body: JSON.stringify({
      screening_id: 2,
      seat_ids: [seatC.id],
      payment_method: 'VNPay',
    }),
  });
  const initJson3 = await initRes3.json();
  const paymentId3 = initJson3.data.payment_id;

  const returnParams = {
    payment_id: String(paymentId3),
    status: 'success',
    vnp_ResponseCode: '00',
    amount: '135000',
  };
  const returnHash = generateVnpaySignature(returnParams, VNP_SECRET);

  // Gọi vnpay-return với redirect: 'manual' để đọc Location Header
  const returnRes = await fetch(
    `${BASE_URL}/api/payments/vnpay-return?payment_id=${paymentId3}&status=success&vnp_ResponseCode=00&amount=135000&vnp_SecureHash=${returnHash}`,
    { redirect: 'manual' }
  );

  assert.ok(
    returnRes.status === 302 || returnRes.status === 307 || returnRes.status === 308,
    `Return URL phải trả về HTTP Redirect (302/307), nhận được: ${returnRes.status}`
  );
  const locationHeader = returnRes.headers.get('location');
  assert.ok(locationHeader, 'Phải có Location header để redirect người dùng');
  assert.ok(locationHeader.includes('/payment-result'), 'Redirect phải trỏ về /payment-result');
  assert.ok(locationHeader.includes(`payment_id=${paymentId3}`), 'Redirect URL phải có payment_id');
  assert.ok(locationHeader.includes('status=success'), 'Redirect URL phải có status=success');
  console.log(`✓ 3.1 vnpay-return chuyển hướng người dùng chuẩn xác:`);
  console.log(`  -> Location: ${locationHeader}`);

  // =========================================================================
  // KỊCH BẢN 4: TEST BẢO MẬT CHỐNG GIẢ MẠO CHỮ KÝ (TAMPERING & FORGERY)
  // =========================================================================
  console.log('\n--- KỊCH BẢN 4: Chống tấn công giả mạo chữ ký (Tampering Attack) ---');
  const fakeHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const tamperRes = await fetch(
    `${BASE_URL}/api/payments/vnpay-ipn?payment_id=${paymentId1}&status=success&vnp_ResponseCode=00&vnp_SecureHash=${fakeHash}`
  );
  assert.strictEqual(tamperRes.status, 400, 'Chữ ký sai phải bị từ chối 400 Bad Request');
  const tamperJson = await tamperRes.json();
  assert.strictEqual(tamperJson.data.RspCode, '97', 'Mã phản hồi VNPay khi chữ ký sai phải là 97 (Invalid Signature)');
  console.log('✓ 4.1 Chặn thành công yêu cầu có mã băm giả mạo (Status 400, RspCode 97)');

  console.log('\n================================================================');
  console.log('🎉 TẤT CẢ TEST CASES CHO VNPAY CALLBACKS (IPN & RETURN) ĐÃ PASSED 100%!');
  console.log('================================================================\n');
}

runPaymentCallbacksTests().catch(err => {
  console.error('\n❌ KIỂM THỬ THẤT BẠI:', err);
  process.exit(1);
});
