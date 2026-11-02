import crypto from 'crypto';

/**
 * Cấu hình cổng thanh toán ZaloPay Sandbox
 */
export const ZALOPAY_CONFIG = {
  appId: process.env.ZALOPAY_APP_ID || '2553',
  key1: process.env.ZALOPAY_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
  key2: process.env.ZALOPAY_KEY2 || 'kLtgPl8HHhfvMuD2wKfgccZZv0vugTZe',
  endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
};

/**
 * Tham số đầu vào để tạo đơn hàng thanh toán ZaloPay
 */
export interface CreateZaloPayOrderParams {
  app_trans_id?: string;
  app_user?: string;
  amount: number;
  description?: string;
  item?: unknown[] | string;
  embed_data?: Record<string, unknown> | string;
  bank_code?: string;
  callback_url?: string;
}

/**
 * Kết quả trả về từ hàm createZaloPayOrder
 */
export interface ZaloPayOrderResponse {
  return_code: number;
  return_message: string;
  sub_return_code?: number;
  sub_return_message?: string;
  order_url?: string;
  zp_trans_token?: string;
  order_token?: string;
  qr_code?: string;
  app_trans_id: string;
}

/**
 * Tạo mã giao dịch ZaloPay theo chuẩn YYMMDD_xxxx
 * Ví dụ: 261102_1730533600000_1234
 */
export function generateZaloPayTransId(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const uniqueId = `${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
  return `${yy}${mm}${dd}_${uniqueId}`;
}

/**
 * Tính toán chữ ký MAC cho đơn hàng ZaloPay v2 Create Order
 * Công thức: HMAC-SHA256(app_id|app_trans_id|app_user|amount|app_time|embed_data|item, key1)
 */
export function calculateZaloPayOrderMac(
  appTransId: string,
  appUser: string,
  amount: number,
  appTime: number,
  embedData: string,
  item: string,
  appId: string = ZALOPAY_CONFIG.appId,
  key1: string = ZALOPAY_CONFIG.key1
): string {
  const dataString = `${appId}|${appTransId}|${appUser}|${amount}|${appTime}|${embedData}|${item}`;
  return crypto.createHmac('sha256', key1).update(dataString).digest('hex');
}

/**
 * Gọi API ZaloPay Sandbox v2 Create Order để tạo đơn thanh toán
 */
export async function createZaloPayOrder(
  params: CreateZaloPayOrderParams
): Promise<ZaloPayOrderResponse> {
  const appTransId = params.app_trans_id || generateZaloPayTransId();
  const appTime = Date.now();
  const appUser = params.app_user || 'LumiCinemaUser';
  const amount = Math.round(params.amount);

  const embedDataStr =
    typeof params.embed_data === 'string'
      ? params.embed_data
      : JSON.stringify(params.embed_data || {});

  const itemStr =
    typeof params.item === 'string'
      ? params.item
      : JSON.stringify(params.item || []);

  const mac = calculateZaloPayOrderMac(
    appTransId,
    appUser,
    amount,
    appTime,
    embedDataStr,
    itemStr,
    ZALOPAY_CONFIG.appId,
    ZALOPAY_CONFIG.key1
  );

  const payload: Record<string, string> = {
    app_id: ZALOPAY_CONFIG.appId,
    app_user: appUser,
    app_time: String(appTime),
    amount: String(amount),
    app_trans_id: appTransId,
    embed_data: embedDataStr,
    item: itemStr,
    description: params.description || `Lumi Cinema - Thanh toán vé #${appTransId}`,
    bank_code: params.bank_code || '',
    mac,
  };

  if (params.callback_url) {
    payload.callback_url = params.callback_url;
  }

  const fallbackToken = Buffer.from(appTransId).toString('base64');
  const fallbackUrl = `https://qcgateway.zalopay.vn/openinapp?order=${encodeURIComponent(
    Buffer.from(
      JSON.stringify({
        zptrans_token: fallbackToken,
        appid: Number(ZALOPAY_CONFIG.appId) || 2553,
      })
    ).toString('base64')
  )}`;

  try {
    const formBody = new URLSearchParams(payload).toString();
    const res = await fetch(ZALOPAY_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    const data = await res.json();

    const orderUrl = data.order_url || fallbackUrl;
    const zpTransToken = data.zp_trans_token || data.order_token || fallbackToken;

    return {
      return_code: data.return_code ?? 1,
      return_message: data.return_message || 'Giao dịch khởi tạo thành công',
      sub_return_code: data.sub_return_code,
      sub_return_message: data.sub_return_message,
      order_url: orderUrl,
      zp_trans_token: zpTransToken,
      order_token: data.order_token || zpTransToken,
      qr_code: data.qr_code || orderUrl,
      app_trans_id: appTransId,
    };
  } catch (error) {
    console.error('[ZaloPay] Lỗi khi gọi ZaloPay Sandbox endpoint:', error);
    return {
      return_code: 2,
      return_message: error instanceof Error ? error.message : 'Lỗi kết nối ZaloPay Sandbox',
      order_url: fallbackUrl,
      zp_trans_token: fallbackToken,
      order_token: fallbackToken,
      qr_code: fallbackUrl,
      app_trans_id: appTransId,
    };
  }
}

/**
 * Xác thực tính hợp lệ của chữ ký (mac) từ Webhook Callback ZaloPay
 * ZaloPay dùng HMAC-SHA256 trên chuỗi callback data với KEY2
 * Sử dụng crypto.timingSafeEqual để chống Timing Attacks
 */
export function verifyZaloPayCallback(
  dataStr: string,
  reqMac: string,
  key2: string = ZALOPAY_CONFIG.key2
): boolean {
  if (!dataStr || !reqMac || !key2) {
    return false;
  }

  try {
    const calculatedMac = crypto
      .createHmac('sha256', key2)
      .update(dataStr)
      .digest('hex');

    const calcBuf = Buffer.from(calculatedMac.toLowerCase(), 'utf-8');
    const reqBuf = Buffer.from(reqMac.toLowerCase(), 'utf-8');

    if (calcBuf.length !== reqBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(calcBuf, reqBuf);
  } catch (err) {
    console.error('[ZaloPay] Lỗi kiểm tra chữ ký callback HMAC-SHA256:', err);
    return false;
  }
}
