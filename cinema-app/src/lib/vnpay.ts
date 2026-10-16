import crypto from 'crypto';

/**
 * Cấu hình mặc định cho cổng thanh toán VNPay
 */
export const VNPAY_CONFIG = {
  tmnCode: process.env.VNP_TMN_CODE || process.env.VNPAY_TMN_CODE || 'LUMICINE',
  hashSecret: process.env.VNP_HASH_SECRET || process.env.VNPAY_HASH_SECRET || 'LUMI_CINEMA_VNPAY_SECRET_KEY_2026',
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

  const signData = sortedKeys
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
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
