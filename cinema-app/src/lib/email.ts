import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

/**
 * Cấu hình SMTP từ các biến môi trường hệ thống
 */
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || '"LUMI CINEMA" <no-reply@lumicinema.vn>';

/**
 * Khởi tạo Transporter của Nodemailer
 */
export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Kiểm tra xem tài khoản SMTP có phải cấu hình thực hay placeholder
 */
const isRealSmtpConfigured = Boolean(
  SMTP_USER &&
  SMTP_PASS &&
  !SMTP_USER.includes('your_email') &&
  !SMTP_PASS.includes('your_gmail')
);

/**
 * Kiểu dữ liệu thông tin chi tiết đơn đặt vé phục vụ gửi email
 */
export interface OrderConfirmationDetails {
  customerName?: string;
  customer_name?: string;
  ticketId?: number | string;
  ticket_id?: number | string;
  ticketCode?: string;
  ticket_code?: string;
  movieTitle?: string;
  movie_title?: string;
  moviePoster?: string;
  movie_poster?: string;
  room?: string;
  screeningTime?: string;
  screening_time?: string;
  date?: string;
  seats?: string;
  seatCodes?: string[] | string;
  seat_codes?: string[] | string;
  totalAmount?: number;
  total_amount?: number;
  paymentMethod?: string;
  payment_method?: string;
  combos?: Array<{ name: string; quantity: number }>;
}

/**
 * Kiểu dữ liệu thông tin mã ưu đãi / voucher đền bù
 */
export interface VoucherDiscountInfo {
  customerName?: string;
  customer_name?: string;
  discountPercent?: number;
  discount_percent?: number;
  discountAmount?: number;
  discount_amount?: number;
  expiryDate?: string | Date;
  expiry_date?: string | Date;
  reason?: string;
  ticketId?: number | string;
  ticket_id?: number | string;
  message?: string;
}

/**
 * Kết quả trả về sau khi thực hiện gửi email
 */
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
}

/**
 * Gửi email xác nhận đặt vé thành công kèm mã QR Code
 * 
 * @param email Địa chỉ email người nhận (khách hàng)
 * @param orderDetails Thông tin chi tiết vé và suất chiếu
 * @param qrCodeData Chuỗi dữ liệu mã hóa để tạo QR Code soát vé
 */
export async function sendTicketConfirmation(
  email: string,
  orderDetails: OrderConfirmationDetails,
  qrCodeData: string
): Promise<SendEmailResult> {
  try {
    const customerName = orderDetails.customerName || orderDetails.customer_name || 'Quý khách';
    const movieTitle = orderDetails.movieTitle || orderDetails.movie_title || 'Phim rạp Lumi Cinema';
    const room = orderDetails.room || 'Phòng chiếu';
    const screeningTime = orderDetails.screeningTime || orderDetails.screening_time || 'Giờ chiếu';
    const date = orderDetails.date || 'Hôm nay';
    const ticketCode =
      orderDetails.ticketCode ||
      orderDetails.ticket_code ||
      `#LMC-${orderDetails.ticketId || orderDetails.ticket_id || '000000'}`;

    // Chuẩn hóa danh sách ghế ngồi
    let seatDisplay = 'Chưa chọn';
    if (orderDetails.seats) {
      seatDisplay = orderDetails.seats;
    } else if (orderDetails.seatCodes) {
      seatDisplay = Array.isArray(orderDetails.seatCodes)
        ? orderDetails.seatCodes.join(', ')
        : String(orderDetails.seatCodes);
    } else if (orderDetails.seat_codes) {
      seatDisplay = Array.isArray(orderDetails.seat_codes)
        ? orderDetails.seat_codes.join(', ')
        : String(orderDetails.seat_codes);
    }

    const totalAmount = orderDetails.totalAmount ?? orderDetails.total_amount ?? 0;
    const paymentMethod = orderDetails.paymentMethod || orderDetails.payment_method || 'VNPay';

    // Sinh ảnh QR Code dạng Buffer để đính kèm inline CID
    const qrBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 260,
      margin: 1,
      color: {
        dark: '#1A1A1A',
        light: '#FFFFFF',
      },
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Xác nhận đặt vé thành công</title>
</head>
<body style="margin: 0; padding: 0; background-color: #141414; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #141414; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #1E1E1E; border-radius: 16px; border: 1px solid #333333; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C62B36 0%, #E63946 100%); padding: 28px 24px; text-align: center;">
              <div style="font-size: 26px; font-weight: 900; letter-spacing: 1px; color: #FFFFFF; text-transform: uppercase;">
                LUMI CINEMA
              </div>
              <div style="font-size: 13px; color: #FFE5E7; margin-top: 4px; letter-spacing: 0.5px;">
                TRẢI NGHIỆM ĐIỆN ẢNH ĐỈNH CAO
              </div>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="padding: 24px 32px 10px 32px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(46, 204, 113, 0.15); border: 1px solid rgba(46, 204, 113, 0.4); border-radius: 30px; padding: 6px 18px; color: #2ECC71; font-weight: 700; font-size: 13px;">
                ✓ ĐẶT VÉ THÀNH CÔNG
              </div>
              <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 16px 0 6px 0;">
                Cảm ơn ${customerName}!
              </h1>
              <p style="color: #A3A3A3; font-size: 14px; margin: 0; line-height: 1.5;">
                Đơn đặt vé của bạn đã được thanh toán hoàn tất. Dưới đây là thông tin vé và mã QR soát vé tại quầy.
              </p>
            </td>
          </tr>

          <!-- QR Code Box -->
          <tr>
            <td align="center" style="padding: 20px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                <tr>
                  <td align="center">
                    <img src="cid:ticket_qrcode_image" alt="QR Code Vé Phim" width="220" height="220" style="display: block; border-radius: 8px;" />
                    <div style="color: #141414; font-family: monospace; font-size: 15px; font-weight: 800; margin-top: 10px; letter-spacing: 1.5px;">
                      ${ticketCode}
                    </div>
                  </td>
                </tr>
              </table>
              <div style="color: #FFB703; font-size: 12px; font-weight: 600; margin-top: 10px;">
                📱 Vui lòng xuất trình mã QR này cho nhân viên khi đến rạp
              </div>
            </td>
          </tr>

          <!-- Ticket Info Details -->
          <tr>
            <td style="padding: 10px 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #171717; border-radius: 12px; border: 1px solid #2B2B2B; padding: 18px;">
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px solid #2B2B2B;">
                    <div style="color: #737373; font-size: 11px; text-transform: uppercase; font-weight: 600;">Bộ phim</div>
                    <div style="color: #FFFFFF; font-size: 16px; font-weight: 800; margin-top: 2px;">${movieTitle}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #2B2B2B;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%">
                          <div style="color: #737373; font-size: 11px; text-transform: uppercase; font-weight: 600;">Phòng chiếu</div>
                          <div style="color: #FFFFFF; font-size: 14px; font-weight: 700; margin-top: 2px;">${room}</div>
                        </td>
                        <td width="50%">
                          <div style="color: #737373; font-size: 11px; text-transform: uppercase; font-weight: 600;">Vị trí ghế</div>
                          <div style="color: #FFB703; font-size: 15px; font-weight: 900; margin-top: 2px; font-family: monospace;">${seatDisplay}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #2B2B2B;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%">
                          <div style="color: #737373; font-size: 11px; text-transform: uppercase; font-weight: 600;">Suất chiếu</div>
                          <div style="color: #FFFFFF; font-size: 14px; font-weight: 600; margin-top: 2px;">${screeningTime}</div>
                        </td>
                        <td width="50%">
                          <div style="color: #737373; font-size: 11px; text-transform: uppercase; font-weight: 600;">Ngày chiếu</div>
                          <div style="color: #FFFFFF; font-size: 14px; font-weight: 600; margin-top: 2px;">${date}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${
                  orderDetails.combos && orderDetails.combos.length > 0
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #2B2B2B;">
                    <div style="color: #737373; font-size: 11px; text-transform: uppercase; font-weight: 600;">Bắp nước đã đặt</div>
                    <div style="color: #FFFFFF; font-size: 13px; margin-top: 4px;">
                      ${orderDetails.combos.map((c) => `🍿 ${c.name} x${c.quantity}`).join(' • ')}
                    </div>
                  </td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding-top: 14px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <div style="color: #737373; font-size: 11px; text-transform: uppercase; font-weight: 600;">Phương thức: ${paymentMethod}</div>
                          <div style="color: #2ECC71; font-size: 12px; margin-top: 2px;">✓ Đã thanh toán</div>
                        </td>
                        <td align="right">
                          <div style="color: #737373; font-size: 11px; text-transform: uppercase; font-weight: 600;">Tổng cộng</div>
                          <div style="color: #FFB703; font-size: 18px; font-weight: 900; margin-top: 2px;">${totalAmount.toLocaleString('vi-VN')} đ</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Notes -->
          <tr>
            <td style="background-color: #171717; border-top: 1px solid #2D2D2D; padding: 24px 32px; text-align: center;">
              <p style="color: #A3A3A3; font-size: 12px; line-height: 1.6; margin: 0 0 10px 0;">
                ⚠️ <strong>Lưu ý:</strong> Vui lòng có mặt tại rạp trước giờ chiếu ít nhất 15 phút để làm thủ tục nhận bắp nước và vào phòng chiếu thuận lợi nhất.
              </p>
              <p style="color: #737373; font-size: 11px; margin: 0;">
                Lumi Cinema • Hệ thống rạp chiếu phim hiện đại<br />
                Hotline hỗ trợ: 1900 8888 • Email: support@lumicinema.vn
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Nếu cấu hình SMTP thực tế, gửi email qua mạng
    if (isRealSmtpConfigured) {
      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: `[Lumi Cinema] Xác nhận đặt vé thành công: ${movieTitle} (${ticketCode})`,
        html: htmlContent,
        attachments: [
          {
            filename: `${ticketCode}-qr.png`,
            content: qrBuffer,
            cid: 'ticket_qrcode_image',
          },
        ],
      });

      console.info(`[EmailService] Ticket confirmation sent to ${email}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      // Môi trường phát triển / kiểm thử khi chưa cài App Password SMTP thật
      console.info(`[EmailService:Simulated] Ticket confirmation email for ${email} generated successfully (${ticketCode}).`);
      return {
        success: true,
        messageId: `mock_ticket_mail_${Date.now()}`,
        simulated: true,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown email error';
    console.error(`[EmailService] Failed to send ticket confirmation to ${email}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Gửi email thông báo cấp mã Voucher đền bù (khi vé bị hủy hoặc bồi hoàn sự cố UC-15)
 * 
 * @param email Địa chỉ email khách hàng
 * @param couponCode Mã coupon giảm giá đã tạo (Vd: COMP100_12_9501)
 * @param discountInfo Thông tin chi tiết mức giảm và thời hạn voucher
 */
export async function sendVoucherIssued(
  email: string,
  couponCode: string,
  discountInfo: VoucherDiscountInfo
): Promise<SendEmailResult> {
  try {
    const customerName = discountInfo.customerName || discountInfo.customer_name || 'Quý khách';
    const discountPercent = discountInfo.discountPercent ?? discountInfo.discount_percent ?? 100;
    const reason = discountInfo.reason || 'Xử lý sự cố / Đền bù hủy vé rạp';
    
    // Định dạng ngày hết hạn
    let expiryStr = '30 ngày kể từ hôm nay';
    if (discountInfo.expiryDate || discountInfo.expiry_date) {
      const rawDate = discountInfo.expiryDate || discountInfo.expiry_date;
      const parsedDate = new Date(rawDate!);
      if (!isNaN(parsedDate.getTime())) {
        expiryStr = parsedDate.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }
    }

    const discountHeadline =
      discountPercent === 100
        ? 'GIẢM 100% (MIỄN PHÍ 1 VÉ PHIM)'
        : `GIẢM ${discountPercent}% GIÁ VÉ`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thông báo cấp mã Voucher đền bù</title>
</head>
<body style="margin: 0; padding: 0; background-color: #141414; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #141414; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #1E1E1E; border-radius: 16px; border: 1px solid #333333; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1C2A38 0%, #0088FF 100%); padding: 28px 24px; text-align: center;">
              <div style="font-size: 26px; font-weight: 900; letter-spacing: 1px; color: #FFFFFF; text-transform: uppercase;">
                LUMI CINEMA
              </div>
              <div style="font-size: 13px; color: #D6ECFF; margin-top: 4px; letter-spacing: 0.5px;">
                CHĂM SÓC KHÁCH HÀNG & BỒI HOÀN ĐẶC QUYỀN
              </div>
            </td>
          </tr>

          <!-- Apology and Greeting -->
          <tr>
            <td style="padding: 28px 32px 10px 32px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255, 183, 3, 0.15); border: 1px solid rgba(255, 183, 3, 0.4); border-radius: 30px; padding: 6px 18px; color: #FFB703; font-weight: 700; font-size: 13px;">
                🎁 QUÀ TẶNG BỒI HOÀN
              </div>
              <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 16px 0 6px 0;">
                Kính gửi ${customerName},
              </h1>
              <p style="color: #D4D4D4; font-size: 14px; margin: 0; line-height: 1.6;">
                Lumi Cinema chân thành cáo lỗi cùng bạn vì sự bất tiện liên quan đến đơn vé của bạn (${reason}). 
                Để đảm bảo quyền lợi tốt nhất, chúng tôi xin gửi tặng bạn một mã Voucher ưu đãi đặc quyền cho lần xem phim tiếp theo.
              </p>
            </td>
          </tr>

          <!-- Voucher Code Highlight Box -->
          <tr>
            <td align="center" style="padding: 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #17241D 0%, #1A3826 100%); border-radius: 16px; border: 2px dashed #2ECC71; padding: 24px; text-align: center;">
                <tr>
                  <td>
                    <div style="color: #2ECC71; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                      MÃ VOUCHER ƯU ĐÃI CỦA BẠN
                    </div>
                    <div style="background-color: #141414; border: 1px solid rgba(46, 204, 113, 0.3); border-radius: 10px; display: inline-block; padding: 12px 28px; margin: 14px 0; color: #FFFFFF; font-family: monospace; font-size: 26px; font-weight: 900; letter-spacing: 2px;">
                      ${couponCode}
                    </div>
                    <div style="color: #FFB703; font-size: 16px; font-weight: 800;">
                      ${discountHeadline}
                    </div>
                    <div style="color: #A3A3A3; font-size: 12px; margin-top: 6px;">
                      ⏰ Hạn sử dụng: <strong>${expiryStr}</strong> (Áp dụng cho mọi bộ phim & suất chiếu)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- How to use -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #171717; border-radius: 12px; border: 1px solid #2B2B2B; padding: 18px;">
                <tr>
                  <td>
                    <div style="color: #FFFFFF; font-size: 13px; font-weight: 700; margin-bottom: 8px;">
                      📌 Cách thức áp dụng mã:
                    </div>
                    <div style="color: #A3A3A3; font-size: 12px; line-height: 1.6;">
                      1. <strong>Đặt vé Online:</strong> Chọn suất chiếu trên website Lumi Cinema, tại bước Thanh toán, nhập mã <strong>${couponCode}</strong> vào ô "Mã giảm giá".<br />
                      2. <strong>Tại quầy vé:</strong> Đọc mã voucher này cho nhân viên bán vé để được áp dụng giảm giá trực tiếp.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #171717; border-top: 1px solid #2D2D2D; padding: 20px 32px; text-align: center;">
              <p style="color: #737373; font-size: 11px; margin: 0; line-height: 1.5;">
                Chúng tôi rất mong được đón tiếp và phục vụ bạn trong những buổi chiếu phim sắp tới.<br />
                Lumi Cinema • Hotline: 1900 8888 • Hỗ trợ: support@lumicinema.vn
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (isRealSmtpConfigured) {
      const info = await transporter.sendMail({
        from: EMAIL_FROM,
        to: email,
        subject: `[Lumi Cinema] Tặng bạn mã ưu đãi đền bù ${discountHeadline} (${couponCode})`,
        html: htmlContent,
      });

      console.info(`[EmailService] Voucher issued email sent to ${email}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.info(`[EmailService:Simulated] Voucher email for ${email} generated successfully (${couponCode}).`);
      return {
        success: true,
        messageId: `mock_voucher_mail_${Date.now()}`,
        simulated: true,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown email error';
    console.error(`[EmailService] Failed to send voucher email to ${email}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

const emailService = {
  transporter,
  sendTicketConfirmation,
  sendVoucherIssued,
};

export default emailService;
