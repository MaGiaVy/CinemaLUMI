import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

// This test writes fixtures and must never point at the shared Supabase database.
const url = new URL(process.env.DATABASE_URL || '');
if (process.env.E2E_LOCAL_COPY !== '1' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
  throw new Error('Run only against an isolated local PostgreSQL copy with E2E_LOCAL_COPY=1');
}
const base = process.env.E2E_BASE_URL || 'http://127.0.0.1:3001';
const db = new PrismaClient();
const suffix = crypto.randomBytes(5).toString('hex');
const password = `Qa-${suffix}-password`;
const logs = [];

async function call(path, { method = 'GET', body, cookie } = {}) {
  const response = await fetch(base + path, {
    method,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json, response };
}

function expect(actual, status, label) {
  assert.equal(actual.status, status, `${label}: ${JSON.stringify(actual.json)}`);
  logs.push(`${label}: HTTP ${status}`);
  return actual.json.data;
}

async function login(email) {
  const cookies = new Map();
  const merge = response => {
    for (const line of response.headers.getSetCookie()) {
      const first = line.split(';')[0];
      const cut = first.indexOf('=');
      cookies.set(first.slice(0, cut), first.slice(cut + 1));
    }
  };
  const header = () => [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  const csrf = await fetch(base + '/api/auth/csrf', { headers: { cookie: header() } });
  merge(csrf);
  const token = (await csrf.json()).csrfToken;
  const form = new URLSearchParams({ csrfToken: token, email, password, callbackUrl: base + '/', json: 'true' });
  const result = await fetch(base + '/api/auth/callback/credentials', {
    method: 'POST', headers: { cookie: header(), 'content-type': 'application/x-www-form-urlencoded' },
    body: form, redirect: 'manual',
  });
  merge(result);
  assert.ok(cookies.has('next-auth.session-token'), `Login failed for fixture role (${result.status})`);
  return header();
}

function signedIpn(paymentId, amount, success = true) {
  const params = {
    vnp_Amount: String(Math.round(amount * 100)), vnp_ResponseCode: success ? '00' : '24',
    vnp_TmnCode: 'LOCALTEST', vnp_TransactionNo: `LOCAL-${paymentId}`,
    vnp_TransactionStatus: success ? '00' : '02', vnp_TxnRef: String(paymentId),
  };
  const sorted = Object.keys(params).sort();
  const payload = new URLSearchParams(sorted.map(key => [key, params[key]])).toString();
  params.vnp_SecureHash = crypto.createHmac('sha512', 'local-signature-test-key').update(payload).digest('hex');
  return new URLSearchParams(params).toString();
}

try {
  const customerEmail = `qa-customer-${suffix}@example.test`;
  const customer2Email = `qa-other-${suffix}@example.test`;
  const staffEmail = `qa-staff-${suffix}@example.test`;
  const adminEmail = `qa-admin-${suffix}@example.test`;
  expect(await call('/api/auth/signup', { method: 'POST', body: { email: customerEmail, password, full_name: 'QA Customer', phone: `09${suffix.slice(0, 8)}` } }), 201, 'signup customer');
  expect(await call('/api/auth/signup', { method: 'POST', body: { email: customer2Email, password, full_name: 'QA Other', phone: `08${suffix.slice(0, 8)}` } }), 201, 'signup second customer');
  expect(await call('/api/auth/signup', { method: 'POST', body: { email: `qa-invalid-${suffix}@example.test`, password: '123', full_name: 'No phone' } }), 400, 'signup validation');
  const hash = await bcrypt.hash(password, 10);
  await db.user.createMany({ data: [
    { email: staffEmail, password: hash, name: 'QA Staff', role: 'STAFF' },
    { email: adminEmail, password: hash, name: 'QA Admin', role: 'ADMIN' },
  ] });
  const customer = await login(customerEmail);
  const other = await login(customer2Email);
  const staff = await login(staffEmail);
  const admin = await login(adminEmail);
  const customerUser = await db.user.findUniqueOrThrow({ where: { email: customerEmail } });
  const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const movie = await db.movie.create({ data: {
    title: `QA Movie ${suffix}`, duration: 120, releaseDate: new Date(), poster: '/qa-poster.jpg',
    genre: 'Test', status: 'SHOWING', ticketPrice: 100000, ageRating: 'P',
  } });
  const screening = await db.screening.create({ data: {
    movieId: movie.id, room: 'Cinema 05', roomNumber: 5, startTime: start,
    endTime: new Date(start.getTime() + 120 * 60000), date: start, price: 100000,
  } });
  await db.seat.createMany({ data: Array.from({ length: 50 }, (_, i) => ({
    screeningId: screening.id, room: 'Cinema 05', row: 'ABCDE'[Math.floor(i / 10)], number: i % 10 + 1,
    code: `${'ABCDE'[Math.floor(i / 10)]}${i % 10 + 1}`, type: 'STANDARD',
  })) });
  const seats = await db.seat.findMany({ where: { screeningId: screening.id }, orderBy: { id: 'asc' } });
  const combo = await db.combo.create({ data: { name: `QA Combo ${suffix}`, price: 20000, stock: 5 } });
  const promo = await db.coupon.create({ data: {
    code: `QA20_${suffix}`.toUpperCase(), discountType: 'Percentage', discountValue: 20,
    expiryDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), maxUsage: 1,
  } });
  expect(await call('/api/movies'), 200, 'movie list');
  expect(await call(`/api/screenings/${screening.id}`), 200, 'screening and seats');
  expect(await call('/api/seats/reserve', { method: 'POST', cookie: customer, body: { screening_id: screening.id, seat_ids: [seats[0].id, seats[1].id] } }), 200, 'hold two seats');
  expect(await call('/api/seats/reserve', { method: 'POST', cookie: other, body: { screening_id: screening.id, seat_ids: [seats[0].id] } }), 400, 'reject second hold');
  expect(await call('/api/staff/pos/tickets', { method: 'POST', cookie: staff, body: { screening_id: screening.id, seat_ids: [seats[0].id], customer_name: 'QA', payment_method: 'Cash' } }), 409, 'reject POS sale of held seat');
  expect(await call('/api/staff/pos/tickets', { method: 'POST', cookie: customer, body: { screening_id: screening.id, seat_ids: [seats[2].id] } }), 403, 'reject customer POS access');
  const reserved = expect(await call('/api/combos/reserve', { method: 'POST', cookie: customer, body: { combo_items: [{ combo_id: combo.id, quantity: 1 }] } }), 200, 'hold combo');
  const reservationId = reserved.items[0].reservation_id;
  assert.equal((await db.combo.findUniqueOrThrow({ where: { id: combo.id } })).stock, 4);
  expect(await call('/api/combos/release', { method: 'POST', cookie: other, body: { reservation_ids: [reservationId] } }), 409, 'reject other customer releasing combo');
  const order = expect(await call('/api/payments/initiate', { method: 'POST', cookie: customer, body: {
    screening_id: screening.id, seat_ids: [seats[0].id, seats[1].id],
    ticket_items: [{ type: 'Thường', quantity: 2 }],
    combo_items: [{ combo_id: combo.id, quantity: 1, reservation_id: reservationId }],
    coupon_code: promo.code, payment_method: 'VNPay',
  } }), 201, 'initiate order with promo and combo');
  assert.equal(order.amount, 180000);
  expect(await call('/api/combos/release', { method: 'POST', cookie: customer, body: { reservation_ids: [reservationId] } }), 409, 'reject release of attached combo');
  expect(await call(`/api/payments/vnpay-ipn?${signedIpn(order.payment_id, order.amount + 1)}`), 400, 'reject wrong paid amount');
  expect(await call(`/api/payments/vnpay-ipn?${signedIpn(order.payment_id, order.amount)}`), 200, 'signed local callback success');
  expect(await call(`/api/payments/vnpay-ipn?${signedIpn(order.payment_id, order.amount)}`), 200, 'callback retry');
  assert.equal(await db.ticket.count({ where: { paymentId: order.payment_id } }), 2);
  assert.equal((await db.combo.findUniqueOrThrow({ where: { id: combo.id } })).stock, 4, 'combo must be deducted exactly once');
  assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: promo.id } })).usedCount, 1);
  const tickets = await db.ticket.findMany({ where: { paymentId: order.payment_id }, orderBy: { id: 'asc' } });
  assert.ok(tickets.every(ticket => Number(ticket.paidPrice) === 80000));
  expect(await call(`/api/tickets/${tickets[0].id}/cancel`, { method: 'POST', cookie: customer }), 200, 'customer cancels one ticket');
  expect(await call(`/api/tickets/${tickets[0].id}/cancel`, { method: 'POST', cookie: customer }), 409, 'reject repeat cancellation');
  assert.equal((await db.ticket.findUniqueOrThrow({ where: { id: tickets[1].id } })).status, 'Valid');
  const voucher = await db.coupon.findUniqueOrThrow({ where: { sourceTicketId: tickets[0].id } });
  assert.equal(voucher.maxUsage, 1);
  const delivered = await db.orderCombo.findFirstOrThrow({ where: { paymentId: order.payment_id } });
  expect(await call('/api/staff/combos/deliver', { method: 'POST', cookie: staff, body: { orderComboId: delivered.id } }), 200, 'deliver combo after partial ticket cancellation');
  expect(await call('/api/staff/combos/deliver', { method: 'POST', cookie: staff, body: { orderComboId: delivered.id } }), 400, 'reject duplicate combo delivery');
  expect(await call(`/api/staff/tickets/${tickets[1].id}/cancel-with-voucher`, { method: 'POST', cookie: staff, body: { fault: 'CINEMA', reason: 'QA projector fault' } }), 200, 'record cinema-fault refund');
  const refund = await db.ticketRefund.findUniqueOrThrow({ where: { ticketId: tickets[1].id } });
  assert.equal(Number(refund.amount), 80000);
  expect(await call(`/api/staff/tickets/${tickets[1].id}/confirm-refund`, { method: 'POST', cookie: staff }), 200, 'confirm cash refund');
  expect(await call(`/api/staff/tickets/${tickets[1].id}/confirm-refund`, { method: 'POST', cookie: staff }), 409, 'reject duplicate refund');
  assert.equal((await db.orderCombo.findUniqueOrThrow({ where: { id: delivered.id } })).isDelivered, true);
  expect(await call('/api/seats/reserve', { method: 'POST', cookie: customer, body: { screening_id: screening.id, seat_ids: [seats[2].id] } }), 200, 'hold seat for compensation voucher');
  const failedOrder = expect(await call('/api/payments/initiate', { method: 'POST', cookie: customer, body: {
    screening_id: screening.id, seat_ids: [seats[2].id], coupon_code: voucher.code, payment_method: 'VNPay',
  } }), 201, 'initiate voucher order');
  expect(await call(`/api/payments/vnpay-ipn?${signedIpn(failedOrder.payment_id, failedOrder.amount, false)}`), 200, 'locally signed failed payment');
  assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: voucher.id } })).usedCount, 0);
  assert.equal((await db.seat.findUniqueOrThrow({ where: { id: seats[2].id } })).status, 'EMPTY');
  expect(await call('/api/seats/reserve', { method: 'POST', cookie: customer, body: { screening_id: screening.id, seat_ids: [seats[2].id] } }), 200, 'hold again after failed payment');
  const voucherOrder = expect(await call('/api/payments/initiate', { method: 'POST', cookie: customer, body: {
    screening_id: screening.id, seat_ids: [seats[2].id], coupon_code: voucher.code, payment_method: 'VNPay',
  } }), 201, 'reuse restored voucher');
  assert.equal(voucherOrder.amount, 50000);
  expect(await call(`/api/payments/vnpay-ipn?${signedIpn(voucherOrder.payment_id, voucherOrder.amount)}`), 200, 'confirm voucher order locally');
  const voucherTicket = await db.ticket.findFirstOrThrow({ where: { paymentId: voucherOrder.payment_id } });
  assert.equal(Number(voucherTicket.paidPrice), 50000);
  expect(await call(`/api/tickets/${voucherTicket.id}/mark-used`, { method: 'PATCH', cookie: staff }), 400, 'reject check-in too early');
  await db.screening.update({ where: { id: screening.id }, data: { startTime: new Date(Date.now() + 20 * 60000), endTime: new Date(Date.now() + 140 * 60000) } });
  expect(await call(`/api/tickets/${voucherTicket.id}/mark-used`, { method: 'PATCH', cookie: staff }), 200, 'check in valid ticket in allowed window');
  expect(await call(`/api/tickets/${voucherTicket.id}/mark-used`, { method: 'PATCH', cookie: staff }), 400, 'reject repeated check-in');
  expect(await call(`/api/tickets/${voucherTicket.id}/cancel`, { method: 'POST', cookie: customer }), 409, 'reject cancelling used ticket');
  const posSale = expect(await call('/api/staff/pos/tickets', { method: 'POST', cookie: staff, body: {
    screening_id: screening.id, seat_ids: [seats[3].id], payment_method: 'Cash', customer_name: 'QA Walk-in',
  } }), 201, 'sell available seat at POS');
  assert.equal(posSale.ticket_count, 1);
  const posTicket = await db.ticket.findFirstOrThrow({ where: { seatId: seats[3].id, screeningId: screening.id }, include: { payment: true } });
  assert.ok(posTicket.payment.soldById !== null);
  expect(await call('/api/staff/pos/tickets', { method: 'POST', cookie: staff, body: {
    screening_id: screening.id, seat_ids: [seats[3].id], payment_method: 'Cash', customer_name: 'QA Walk-in',
  } }), 409, 'reject duplicate POS seat sale');
  const comboSale = expect(await call('/api/staff/pos/combos', { method: 'POST', cookie: staff, body: {
    items: [{ combo_id: combo.id, quantity: 1 }], payment_method: 'Cash', customer_name: 'QA Walk-in',
  } }), 201, 'sell standalone combo at POS');
  assert.equal(comboSale.items.length, 1);
  const posComboPayment = await db.payment.findFirstOrThrow({ where: { transactionCode: { startsWith: 'POS_COMBO_' }, soldById: posTicket.payment.soldById }, orderBy: { id: 'desc' } });
  assert.equal((await db.orderCombo.findFirstOrThrow({ where: { paymentId: posComboPayment.id } })).isDelivered, true);
  const race = await Promise.all([
    call('/api/seats/reserve', { method: 'POST', cookie: customer, body: { screening_id: screening.id, seat_ids: [seats[5].id] } }),
    call('/api/seats/reserve', { method: 'POST', cookie: other, body: { screening_id: screening.id, seat_ids: [seats[5].id] } }),
  ]);
  assert.deepEqual(race.map(result => result.status).sort(), [200, 400], 'exactly one customer may hold a seat');
  logs.push('concurrent seat hold: one HTTP 200, one HTTP 400');
  const expiringCoupon = await db.coupon.create({ data: {
    code: `QAEXPIRE_${suffix}`.toUpperCase(), discountType: 'FixedAmount', discountValue: 10000,
    expiryDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), maxUsage: 1,
  } });
  expect(await call('/api/seats/reserve', { method: 'POST', cookie: customer, body: { screening_id: screening.id, seat_ids: [seats[6].id] } }), 200, 'hold seat for expiry test');
  const expiringOrder = expect(await call('/api/payments/initiate', { method: 'POST', cookie: customer, body: {
    screening_id: screening.id, seat_ids: [seats[6].id], coupon_code: expiringCoupon.code, payment_method: 'VNPay',
  } }), 201, 'initiate order before hold expiry');
  await db.seat.update({ where: { id: seats[6].id }, data: { reservedUntil: new Date(Date.now() - 1000) } });
  expect(await call(`/api/seats?screening_id=${screening.id}`), 200, 'lazy expiry releases order');
  assert.equal((await db.payment.findUniqueOrThrow({ where: { id: expiringOrder.payment_id } })).status, 'Failed');
  assert.equal((await db.coupon.findUniqueOrThrow({ where: { id: expiringCoupon.id } })).usedCount, 0);
  assert.equal((await db.seat.findUniqueOrThrow({ where: { id: seats[6].id } })).status, 'EMPTY');
  expect(await call(`/api/payments/vnpay-ipn?${signedIpn(expiringOrder.payment_id, expiringOrder.amount)}`), 409, 'reject late success callback');
  expect(await call('/api/admin/reports/revenue', { cookie: customer }), 403, 'reject customer report access');
  const report = expect(await call('/api/admin/reports/revenue', { cookie: admin }), 200, 'admin report access');
  const row = report.find(item => item.screening_id === screening.id);
  assert.equal(row.refunded_amount, 80000, 'customer voucher cancellation is not a cash refund');
  assert.equal(row.pending_refund_amount, 0);
  assert.equal(row.combo_revenue, 20000, 'independent POS combo has no screening allocation');
  assert.equal(row.net_revenue, row.gross_revenue - row.refunded_amount);
  console.log(logs.join('\n'));
  console.log('LOCAL_API_FLOW_PASS; gateway confirmation is local signed simulation, not provider sandbox verification.');
} catch (error) {
  console.log(logs.join('\n'));
  console.error(error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
