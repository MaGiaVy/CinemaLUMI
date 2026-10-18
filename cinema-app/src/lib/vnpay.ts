import crypto from 'crypto';

/**
 * Cấu hình mặc định cho cổng thanh toán VNPay
 */
export const VNPAY_CONFIG = {
  tmnCode: process.env.VNP_TMN_CODE || process.env.VNPAY_TMN_CODE || '',
  hashSecret: process.env.VNP_HASH_SECRET || process.env.VNPAY_HASH_SECRET || '',
  vnpUrl: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
};

/**
 * Chuẩn hóa và tạo chuỗi ký HMAC-SHA512 từ danh sách tham số VNPay
 * Tuân thủ quy chuẩn mã hóa của cổng VNPay (Sắp xếp key theo alphabet, URL encoding)
 */
export function signVnpayParams(
  params: Record<string, string>,
  secretKey: string = VNPAY_CONFIG.hashSecret
): string {
  if (!secretKey) throw new Error('Chưa cấu hình VNPAY_HASH_SECRET');
  const sortedKeys = Object.keys(params)
    .filter(
      key =>
        key.startsWith('vnp_') &&
        key !== 'vnp_SecureHash' &&
        key !== 'vnp_SecureHashType' &&
        params[key] !== undefined &&
        params[key] !== null &&
        params[key] !== ''
    )
    .sort();

  const signData = new URLSearchParams(sortedKeys.map(key => [key, params[key]])).toString();

  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

export function createVnpayPaymentUrl(input: {
  paymentId: number;
  amount: number;
  returnUrl: string;
  ipAddress: string;
  expiresAt: Date;
}): string {
  if (!VNPAY_CONFIG.tmnCode || !VNPAY_CONFIG.hashSecret) {
    throw new Error('Chưa cấu hình VNPay');
  }
  const formatDate = (date: Date) => new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).reduce<Record<string, string>>((out, part) => {
    out[part.type] = part.value;
    return out;
  }, {});
  const stamp = (date: Date) => {
    const p = formatDate(date);
    return `${p.year}${p.month}${p.day}${p.hour}${p.minute}${p.second}`;
  };
  const params: Record<string, string> = {
    vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: VNPAY_CONFIG.tmnCode,
    vnp_Amount: String(Math.round(input.amount * 100)), vnp_CurrCode: 'VND',
    vnp_CreateDate: stamp(new Date()), vnp_ExpireDate: stamp(input.expiresAt),
    vnp_IpAddr: input.ipAddress, vnp_Locale: 'vn',
    vnp_OrderInfo: `Thanh toan ve phim don ${input.paymentId}`,
    vnp_OrderType: 'other', vnp_ReturnUrl: input.returnUrl,
    vnp_TxnRef: String(input.paymentId),
  };
  const url = new URL(VNPAY_CONFIG.vnpUrl);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('vnp_SecureHash', signVnpayParams(params));
  return url.toString();
}

/**
 * Xác thực tính hợp lệ của chữ ký (Secure Hash) được trả về từ VNPay
 * Sử dụng crypto.timingSafeEqual để chống tấn công Timing Attack
 */
export function verifyVnpaySignature(
  params: Record<string, string>,
  receivedHash: string | null | undefined,
  secretKey: string = VNPAY_CONFIG.hashSecret
): boolean {
  if (!receivedHash || !secretKey) {
    return false;
  }

  const calculatedHash = signVnpayParams(params, secretKey);

  try {
    const calcBuffer = Buffer.from(calculatedHash.toLowerCase(), 'utf-8');
    const recvBuffer = Buffer.from(receivedHash.toLowerCase(), 'utf-8');

    if (calcBuffer.length !== recvBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(calcBuffer, recvBuffer);
  } catch (err) {
    console.error('[VNPay] Lỗi kiểm tra chữ ký HMAC:', err);
    return false;
  }
}
