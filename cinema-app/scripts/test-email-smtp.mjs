/**
 * LumiCinema - Công Cụ Kiểm Tra Kết Nối Email SMTP Tự Động
 * 
 * Cách chạy từ PowerShell:
 *   cd d:\cinema_project\cinema-app
 *   node scripts/test-email-smtp.mjs [email_nhận_tùy_chọn]
 * 
 * Ví dụ:
 *   node scripts/test-email-smtp.mjs
 *   node scripts/test-email-smtp.mjs your_email@gmail.com
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(appDir, '..');

// 1. Tìm và nạp file .env theo thứ tự ưu tiên
let loadedEnvPath = null;
const candidates = [
  path.join(appDir, '.env.local'),
  path.join(appDir, '.env'),
  path.join(rootDir, '.env.local'),
  path.join(rootDir, '.env'),
];

for (const p of candidates) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedEnvPath = p;
    break;
  }
}

console.log('='.repeat(70));
console.log('   🚀 LUMICINEMA - CÔNG CỤ CHẨN ĐOÁN & KIỂM TRA EMAIL SMTP');
console.log('='.repeat(70));
console.log(`📁 File cấu hình được nạp: ${loadedEnvPath || 'Không tìm thấy file .env (dùng biến hệ thống)'}`);

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '';
const EMAIL_FROM = process.env.EMAIL_FROM || `"LUMI CINEMA" <${SMTP_USER || 'no-reply@lumicinema.vn'}>`;

// Nhận email người nhận từ tham số dòng lệnh hoặc mặc định gửi về chính SMTP_USER
const targetRecipient = process.argv[2] || SMTP_USER;

// Hàm che mật khẩu để hiển thị an toàn
function maskPassword(pass) {
  if (!pass) return '(chưa cấu hình)';
  if (pass.length <= 6) return '******';
  return `${pass.slice(0, 4)}****${pass.slice(-4)}`;
}

console.log('\n📋 THÔNG SỐ CẤU HÌNH PHÁT HIỆN:');
console.log(`  - SMTP_HOST : ${SMTP_HOST}`);
console.log(`  - SMTP_PORT : ${SMTP_PORT} (${SMTP_PORT === 465 ? 'SSL/TLS' : 'STARTTLS'})`);
console.log(`  - SMTP_USER : ${SMTP_USER || '❌ TRỐNG'}`);
console.log(`  - SMTP_PASS : ${maskPassword(SMTP_PASS)} (độ dài: ${SMTP_PASS.length} ký tự)`);
console.log(`  - EMAIL_FROM: ${EMAIL_FROM}`);
console.log(`  - Người nhận: ${targetRecipient || '❌ TRỐNG (vui lòng truyền email hoặc điền SMTP_USER)'}`);

// Kiểm tra sơ bộ các lỗi định dạng thường gặp
let hasConfigError = false;
if (!SMTP_USER || SMTP_USER.includes('your_email')) {
  console.error('\n❌ LỖI: SMTP_USER chưa được điền hoặc vẫn mang giá trị mẫu (your_email@gmail.com)!');
  hasConfigError = true;
}
if (!SMTP_PASS || SMTP_PASS.includes('your_gmail')) {
  console.error('\n❌ LỖI: SMTP_PASSWORD chưa được điền hoặc vẫn mang giá trị mẫu (your_gmail_app_password)!');
  hasConfigError = true;
}
if (SMTP_PASS && SMTP_PASS.replace(/\s+/g, '').length !== 16 && SMTP_HOST.includes('gmail')) {
  console.warn('\n⚠️ CẢNH BÁO: Mật khẩu ứng dụng Gmail thường có độ dài chuẩn là 16 ký tự!');
  console.warn('   Nếu bạn đang dùng mật khẩu đăng nhập Gmail thông thường, Google sẽ từ chối kết nối.');
}

if (hasConfigError) {
  console.log('\n💡 HƯỚNG DẪN NHANH:');
  console.log('   Mở file cinema-app/.env và cập nhật:');
  console.log('   SMTP_USER="dia_chi_gmail_cua_ban@gmail.com"');
  console.log('   SMTP_PASSWORD="mat_khau_ung_dung_16_ky_tu"');
  process.exit(1);
}

// 2. Khởi tạo transporter với chế độ debug
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS.replace(/\s+/g, ''), // Tự động loại bỏ khoảng trắng nếu có
  },
  debug: true, // In chi tiết handshake
  logger: false,
});

async function runDiagnostic() {
  console.log('\n🔄 [BƯỚC 1/2] Bắt đầu bắt tay (Handshake & Verify) với máy chủ SMTP...');

  try {
    await transporter.verify();
    console.log('  ✅ KẾT NỐI SMTP THÀNH CÔNG! Tài khoản và Mật khẩu ứng dụng hợp lệ.');
  } catch (verifyErr) {
    console.error('\n❌ XÁC THỰC SMTP THẤT BẠI!');
    console.error(`  Mã lỗi: ${verifyErr.code || 'UNKNOWN'}`);
    console.error(`  Chi tiết: ${verifyErr.message}`);

    console.log('\n🔍 NGUYÊN NHÂN VÀ CÁCH KHẮC PHỤC:');
    if (verifyErr.message.includes('535') || verifyErr.message.includes('Username and Password not accepted')) {
      console.log('  1. Bạn đang dùng Mật khẩu đăng nhập Gmail thông thường thay vì MẬT KHẨU ỨNG DỤNG.');
      console.log('  2. Tài khoản Google chưa bật Xác minh 2 bước (2-Step Verification).');
      console.log('  3. Mật khẩu ứng dụng 16 ký tự bị gõ sai hoặc đã bị xóa trên Google Account.');
    } else if (verifyErr.code === 'ESOCKET' || verifyErr.code === 'ETIMEDOUT' || verifyErr.code === 'ECONNREFUSED') {
      console.log('  1. Cổng mạng (Port 587/465) bị chặn bởi tường lửa mạng công ty hoặc phần mềm diệt virus.');
      console.log('  2. Máy tính mất kết nối Internet.');
    }
    process.exit(1);
  }

  console.log(`\n📧 [BƯỚC 2/2] Đang gửi thử Email Bồi Hoàn Voucher thực tế đến: ${targetRecipient}...`);

  const demoCouponCode = `TEST_COMP100_${Math.floor(1000 + Math.random() * 9000)}`;
  const nowStr = new Date().toLocaleDateString('vi-VN');

  const testHtml = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <div style="max-width: 600px; margin: 30px auto; background-color: #12101C; border-radius: 16px; border: 1px solid #33274A; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #E11D48 0%, #881337 100%); padding: 24px; text-align: center;">
      <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">LUMI CINEMA</h1>
      <p style="color: #FFE4E6; margin: 4px 0 0 0; font-size: 13px;">HỆ THỐNG KIỂM TRA EMAIL TỰ ĐỘNG</p>
    </div>
    <div style="padding: 28px 24px; text-align: center;">
      <span style="background: rgba(46, 204, 113, 0.2); border: 1px solid #2ECC71; color: #2ECC71; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 12px;">
        ✓ KẾT NỐI SMTP THÀNH CÔNG
      </span>
      <h2 style="color: #FFFFFF; margin: 18px 0 8px 0;">Xin chào Người Quản Trị / Khách Hàng!</h2>
      <p style="color: #CBD5E1; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
        Nếu bạn đọc được bức thư này trong hộp thư đến (Inbox), chức năng gửi email bồi hoàn và xác nhận vé của hệ thống <strong>LumiCinema</strong> đã hoạt động hoàn hảo 100%!
      </p>
      
      <div style="background: rgba(225, 29, 72, 0.08); border: 2px dashed #E11D48; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <div style="color: #FDA4AF; font-size: 12px; font-weight: bold; text-transform: uppercase;">MÃ VOUCHER ĐỀN BÙ MẪU (TEST)</div>
        <div style="color: #FFFFFF; font-family: monospace; font-size: 26px; font-weight: 900; letter-spacing: 2px; margin: 10px 0;">
          ${demoCouponCode}
        </div>
        <div style="color: #FFB703; font-weight: bold; font-size: 15px;">GIẢM 100% GIÁ VÉ (ĐỀN BÙ SỰ CỐ)</div>
        <div style="color: #94A3B8; font-size: 12px; margin-top: 6px;">Hạn dùng: 30 ngày kể từ ${nowStr}</div>
      </div>
    </div>
    <div style="background-color: #0A0A0C; padding: 16px; text-align: center; border-top: 1px solid #241A38;">
      <p style="color: #64748B; font-size: 11px; margin: 0;">
        LumiCinema System Diagnostic Tool • Gửi từ: ${SMTP_USER}
      </p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: targetRecipient,
      subject: `[Lumi Cinema] Xác nhận kết nối Email thành công - Mã Voucher test: ${demoCouponCode}`,
      text: `Xin chào! Kết nối SMTP LumiCinema thành công. Mã voucher test: ${demoCouponCode}`,
      html: testHtml,
    });

    console.log('  🎉 GỬI EMAIL THÀNH CÔNG RỰC RỠ!');
    console.log(`  - Message ID: ${info.messageId}`);
    console.log(`  - Server Response: ${info.response}`);
    console.log(`\n👉 Hãy mở ngay Hộp thư đến (Inbox) của ${targetRecipient} để kiểm tra email!`);
    console.log('   (Nếu không thấy ở Hộp thư chính, vui lòng kiểm tra thêm mục Spam/Thư rác)');
    console.log('='.repeat(70));
  } catch (sendErr) {
    console.error('\n❌ GỬI EMAIL THẤT BẠI!');
    console.error(`  Chi tiết: ${sendErr.message}`);
    process.exit(1);
  }
}

runDiagnostic();
