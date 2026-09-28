import { strict as assert } from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('🧪 Starting Phase 14 Email Service & QR Code tests...');

  // Import dynamic compiled or tsx module
  const emailModule = await import('../../src/lib/email.ts');
  const {
    transporter,
    sendTicketConfirmation,
    sendVoucherIssued,
    default: defaultExport,
  } = emailModule;

  // Test 1: Check exports and transporter
  console.log('  [Test 1] Verifying exports and transporter configuration...');
  assert.ok(transporter, 'transporter should be defined');
  assert.equal(typeof sendTicketConfirmation, 'function', 'sendTicketConfirmation must be a function');
  assert.equal(typeof sendVoucherIssued, 'function', 'sendVoucherIssued must be a function');
  assert.ok(defaultExport, 'default export must be defined');
  console.log('  ✅ [Test 1] Exports and transporter initialized correctly.');

  // Test 2: Test sendTicketConfirmation with rich payload
  console.log('  [Test 2] Testing sendTicketConfirmation with mock order & QR...');
  const orderDetails = {
    customerName: 'Gia Vỹ',
    ticketId: 108,
    ticketCode: 'LMC-TEST-9921',
    movieTitle: 'Dune: Part Two (Hành Tinh Cát)',
    room: 'Phòng Chiếu 01 (IMAX Laser)',
    screeningTime: '19:30 - 22:15',
    date: '28/09/2026',
    seats: 'F08, F09',
    combos: [
      { name: 'Combo Solo Bắp Phô Mai + Coca', quantity: 1 },
      { name: 'Bắp Rang Bơ Cỡ Lớn', quantity: 1 },
    ],
    totalAmount: 260000,
    paymentMethod: 'VNPay QR',
  };
  const qrData = 'https://lumicinema.vn/verify-ticket?code=LMC-TEST-9921&sig=abc123xyz';

  const ticketResult = await sendTicketConfirmation('giavyma265@gmail.com', orderDetails, qrData);
  console.log('    Ticket result:', ticketResult);
  assert.equal(ticketResult.success, true, 'sendTicketConfirmation must return success: true');
  assert.ok(ticketResult.messageId, 'sendTicketConfirmation must return messageId');
  console.log('  ✅ [Test 2] sendTicketConfirmation succeeded.');

  // Test 3: Test sendVoucherIssued for customer cancellation (Phase 10) & staff incident force-cancel (Phase 12 UC-15)
  console.log('  [Test 3] Testing sendVoucherIssued for ticket cancellation...');
  const voucherDiscountInfo = {
    customerName: 'Gia Vỹ',
    discountPercent: 100,
    discountAmount: 120000,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    reason: 'Sự cố phòng chiếu 01 - Bồi hoàn 100% theo quy chuẩn UC-15',
    ticketId: 108,
  };
  const couponCode = 'COMP100_108_9988';

  const voucherResult = await sendVoucherIssued('giavyma265@gmail.com', couponCode, voucherDiscountInfo);
  console.log('    Voucher result:', voucherResult);
  assert.equal(voucherResult.success, true, 'sendVoucherIssued must return success: true');
  assert.ok(voucherResult.messageId, 'sendVoucherIssued must return messageId');
  console.log('  ✅ [Test 3] sendVoucherIssued succeeded.');

  // Test 4: Verify root bridge lib/email.ts
  console.log('  [Test 4] Verifying root bridge lib/email.ts...');
  const bridgeModule = await import('../../lib/email.ts');
  assert.equal(typeof bridgeModule.sendTicketConfirmation, 'function', 'Root bridge should export sendTicketConfirmation');
  assert.equal(typeof bridgeModule.sendVoucherIssued, 'function', 'Root bridge should export sendVoucherIssued');
  console.log('  ✅ [Test 4] Root bridge exports verified.');

  console.log('\n🎉 ALL PHASE 14 EMAIL SERVICE TESTS PASSED SUCCESSFULLY! (4/4)');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
