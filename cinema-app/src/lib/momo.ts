import crypto from 'crypto';

const partnerCode = process.env.MOMO_PARTNER_CODE || '';
const accessKey = process.env.MOMO_ACCESS_KEY || '';
const secretKey = process.env.MOMO_SECRET_KEY || '';
const createUrl = process.env.MOMO_CREATE_URL || 'https://test-payment.momo.vn/v2/gateway/api/create';

function hmac(message: string): string {
  if (!secretKey) throw new Error('Chưa cấu hình MOMO_SECRET_KEY');
  return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
}

export function isMomoConfigured(): boolean {
  return Boolean(partnerCode && accessKey && secretKey &&
    (process.env.NODE_ENV !== 'production' || process.env.MOMO_CREATE_URL));
}

export async function createMomoPayment(input: {
  paymentId: number;
  amount: number;
  baseUrl: string;
}): Promise<string> {
  if (!isMomoConfigured()) throw new Error('Chưa cấu hình MoMo');
  const orderId = String(input.paymentId);
  const requestId = `LMC${input.paymentId}${Date.now()}`;
  const orderInfo = `Thanh toan ve phim don ${orderId}`;
  const redirectUrl = new URL('/api/payments/momo-return', input.baseUrl).toString();
  const ipnUrl = new URL('/api/payments/momo-ipn', input.baseUrl).toString();
  const amount = String(Math.round(input.amount));
  const extraData = '';
  const requestType = 'captureWallet';
  const raw = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const response = await fetch(createUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      partnerCode, requestId, amount, orderId, orderInfo, redirectUrl, ipnUrl,
      requestType, extraData, lang: 'vi', signature: hmac(raw),
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const result = await response.json() as { resultCode?: number; payUrl?: string; orderId?: string; amount?: number };
  if (!response.ok || result.resultCode !== 0 || result.orderId !== orderId || Number(result.amount) !== Number(amount) || !result.payUrl?.startsWith('https://')) {
    throw new Error('MoMo không thể tạo giao dịch');
  }
  return result.payUrl;
}

export function verifyMomoCallback(data: Record<string, unknown>): boolean {
  if (!isMomoConfigured() || data.partnerCode !== partnerCode || typeof data.signature !== 'string') return false;
  const keys = ['amount', 'extraData', 'message', 'orderId', 'orderInfo', 'orderType', 'partnerCode', 'payType', 'requestId', 'responseTime', 'resultCode', 'transId'];
  if (keys.some(key => data[key] === undefined || data[key] === null)) return false;
  const raw = `accessKey=${accessKey}&${keys.map(key => `${key}=${String(data[key])}`).join('&')}`;
  const expected = Buffer.from(hmac(raw), 'hex');
  const received = Buffer.from(data.signature, 'hex');
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}
