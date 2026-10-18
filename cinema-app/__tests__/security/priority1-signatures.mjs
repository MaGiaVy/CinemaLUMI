import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.VNPAY_TMN_CODE = 'TEST1234';
process.env.VNPAY_HASH_SECRET = 'test-secret';
process.env.MOMO_PARTNER_CODE = 'TEST_MOMO';
process.env.MOMO_ACCESS_KEY = 'test-access';
process.env.MOMO_SECRET_KEY = 'test-secret';
process.env.MOMO_CREATE_URL = 'https://test-payment.momo.vn/v2/gateway/api/create';

const { createVnpayPaymentUrl, verifyVnpaySignature } = await import('../../src/lib/vnpay.ts');
const { verifyMomoCallback } = await import('../../src/lib/momo.ts');

const url = new URL(createVnpayPaymentUrl({
  paymentId: 42,
  amount: 125000,
  returnUrl: 'https://example.test/api/payments/vnpay-return',
  ipAddress: '127.0.0.1',
  expiresAt: new Date(Date.now() + 600000),
}));
const params = Object.fromEntries(url.searchParams);
assert.equal(params.vnp_Amount, '12500000');
assert.equal(params.vnp_TxnRef, '42');
assert.ok(verifyVnpaySignature(params, params.vnp_SecureHash));
assert.equal(verifyVnpaySignature({ ...params, vnp_Amount: '100' }, params.vnp_SecureHash), false);

const callback = {
  amount: 125000, extraData: '', message: 'Successful.', orderId: '42',
  orderInfo: 'Thanh toan ve phim don 42', orderType: 'momo_wallet',
  partnerCode: 'TEST_MOMO', payType: 'qr', requestId: 'REQ42',
  responseTime: 1234567890, resultCode: 0, transId: 1234,
};
const raw = `accessKey=test-access&${Object.entries(callback).map(([key, value]) => `${key}=${value}`).join('&')}`;
const signature = crypto.createHmac('sha256', 'test-secret').update(raw).digest('hex');
assert.ok(verifyMomoCallback({ ...callback, signature }));
assert.equal(verifyMomoCallback({ ...callback, amount: 1, signature }), false);

console.log('Priority 1 payment signatures: 6 assertions passed');
