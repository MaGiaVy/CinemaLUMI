import crypto from 'crypto';

export interface VnpayParams {
  [key: string]: string | number | undefined;
}

/**
 * Sắp xếp các tham số VNPay theo thứ tự bảng chữ cái và tạo chuỗi truy vấn URL an toàn
 */
export function sortObject(obj: Record<string, string | number>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sorted[encodeURIComponent(key)] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
    }
  }

  return sorted;
}

/**
 * Tạo chữ ký số HMAC-SHA512 theo chuẩn VNPay
 */
export function generateVnpaySignature(params: Record<string, string | number>, secretKey: string): string {
  // Loại bỏ các tham số chữ ký nếu đã có sẵn
  const cleanParams: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType' && v !== undefined && v !== null && v !== '') {
      cleanParams[k] = v;
    }
  }

  const sorted = sortObject(cleanParams);
  const signData = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

/**
 * Kiểm tra tính hợp lệ của chữ ký VNPay từ IPN hoặc Return Callback
 */
export function verifyVnpaySignature(
  params: Record<string, string | number | undefined>,
  secretKey: string
): boolean {
  if (!secretKey) return false;

  const secureHash = params['vnp_SecureHash'];
  if (!secureHash || typeof secureHash !== 'string') {
    return false;
  }

  const cleanParams: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (
      k !== 'vnp_SecureHash' &&
      k !== 'vnp_SecureHashType' &&
      v !== undefined &&
      v !== null &&
      v !== ''
    ) {
      cleanParams[k] = v;
    }
  }

  const expectedHash = generateVnpaySignature(cleanParams, secretKey);
  return secureHash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Tạo URL thanh toán VNPay Sandbox hoặc Mock
 */
export function createVnpayPaymentUrl({
  paymentId,
  amount,
  orderInfo,
  ipAddr = '127.0.0.1',
  returnUrl,
  tmnCode = process.env.VNP_TMN_CODE || 'DEMOCL01',
  secretKey = process.env.VNP_HASH_SECRET || 'DEMOHASHSECRET1234567890123456',
  vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  isMock = false,
}: {
  paymentId: number;
  amount: number;
  orderInfo?: string;
  ipAddr?: string;
  returnUrl: string;
  tmnCode?: string;
  secretKey?: string;
  vnpUrl?: string;
  isMock?: boolean;
}): string {
  // Nếu là môi trường Mock nội bộ có kiểm soát
  if (isMock) {
    const mockUrl = new URL('/payments/vnpay-mock', returnUrl);
    mockUrl.searchParams.set('payment_id', String(paymentId));
    mockUrl.searchParams.set('amount', String(amount));
    mockUrl.searchParams.set('order_info', orderInfo || `Thanh toan don hang Lumi Cinema #${paymentId}`);
    return mockUrl.toString();
  }

  const date = new Date();
  const createDate = formatDateToVnpay(date);
  const vnpAmount = Math.round(amount * 100); // VNPay yêu cầu nhân 100

  const vnpParams: Record<string, string | number> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(paymentId),
    vnp_OrderInfo: orderInfo || `Thanh toan don hang #${paymentId}`,
    vnp_OrderType: 'other',
    vnp_Amount: vnpAmount,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  const secureHash = generateVnpaySignature(vnpParams, secretKey);
  const sorted = sortObject(vnpParams);

  const queryString = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  return `${vnpUrl}?${queryString}&vnp_SecureHash=${secureHash}`;
}

function formatDateToVnpay(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : String(n));
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${year}${month}${day}${hour}${minute}${second}`;
}
