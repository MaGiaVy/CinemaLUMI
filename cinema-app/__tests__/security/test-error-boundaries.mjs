import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runErrorHandlingTests() {
  console.log('🧪 === BẮT ĐẦU KIỂM THỬ XỬ LÝ LỖI TOÀN HỆ THỐNG & QUY TẮC E-04 ===\n');

  // 1. Kiểm tra tồn tại và cấu trúc của app/error.tsx và app/global-error.tsx
  console.log('--- PHẦN 1: Kiểm tra Error Boundaries (Client Components) ---');
  const errorPath = path.resolve(__dirname, '../../src/app/error.tsx');
  const globalErrorPath = path.resolve(__dirname, '../../src/app/global-error.tsx');

  assert.ok(fs.existsSync(errorPath), 'src/app/error.tsx phải tồn tại');
  assert.ok(fs.existsSync(globalErrorPath), 'src/app/global-error.tsx phải tồn tại');

  const errorContent = fs.readFileSync(errorPath, 'utf-8');
  const globalErrorContent = fs.readFileSync(globalErrorPath, 'utf-8');

  assert.ok(errorContent.includes("'use client'"), 'error.tsx phải là Client Component');
  assert.ok(globalErrorContent.includes("'use client'"), 'global-error.tsx phải là Client Component');

  assert.ok(errorContent.includes('isDatabaseOrConnectionError'), 'error.tsx phải kiểm tra lỗi cơ sở dữ liệu (E-04)');
  assert.ok(globalErrorContent.includes('isDatabaseOrConnectionError'), 'global-error.tsx phải kiểm tra lỗi cơ sở dữ liệu (E-04)');

  assert.ok(errorContent.includes('Hệ thống đang bảo trì'), 'error.tsx phải chứa thông điệp "Hệ thống đang bảo trì" theo E-04');
  assert.ok(globalErrorContent.includes('Hệ thống đang bảo trì'), 'global-error.tsx phải chứa thông điệp "Hệ thống đang bảo trì" theo E-04');
  assert.ok(globalErrorContent.includes('<html') && globalErrorContent.includes('<body'), 'global-error.tsx phải chứa thẻ <html> và <body>');

  console.log('  ✅ [PASS] error.tsx và global-error.tsx đáp ứng 100% tiêu chuẩn Next.js & quy tắc E-04!\n');

  // 2. Kiểm thử logic của handleError và isDatabaseOrConnectionError
  console.log('--- PHẦN 2: Kiểm thử module handleError & nhận diện lỗi E-04 ---');
  const { handleError, AppError, isDatabaseOrConnectionError } = await import('../../src/lib/error.ts');

  // 2.1. Lỗi AppError nghiệp vụ thông thường
  const appErr = new AppError(400, 'Mã giảm giá đã hết hạn', 'COUPON_EXPIRED');
  const resAppErr = handleError(appErr);
  assert.equal(resAppErr.success, false);
  assert.equal(resAppErr.statusCode, 400);
  assert.equal(resAppErr.code, 'COUPON_EXPIRED');
  assert.equal(resAppErr.error, 'Mã giảm giá đã hết hạn');
  console.log('  ✅ [PASS] Xử lý AppError chuẩn xác (400, COUPON_EXPIRED)');

  // 2.2. Lỗi sập Database / Mất kết nối nghiêm trọng (Quy tắc E-04)
  const dbErrors = [
    new Error("Can't reach database server at `localhost:5432`"),
    new Error("connect ECONNREFUSED 127.0.0.1:5432"),
    new Error("Connection terminated unexpectedly"),
    { name: 'PrismaClientInitializationError', message: 'Database unreachable' },
    { code: 'P1001', message: 'Cannot reach database' },
    { code: 'P1017', message: 'Server closed connection' },
  ];

  for (const err of dbErrors) {
    assert.ok(isDatabaseOrConnectionError(err), `Phải nhận diện được lỗi DB: ${err.message || err.code}`);
    const res = handleError(err);
    assert.equal(res.success, false);
    assert.equal(res.statusCode, 503, 'Lỗi mất kết nối DB phải trả về HTTP 503 Service Unavailable');
    assert.equal(res.code, 'SYSTEM_MAINTENANCE', 'Mã lỗi phải là SYSTEM_MAINTENANCE');
    assert.ok(res.error.includes('bảo trì'), 'Thông điệp lỗi phải thể hiện bảo trì');
  }
  console.log('  ✅ [PASS] Quy tắc E-04 nhận diện và chuyển đổi 6 dạng lỗi sập Database thành HTTP 503 SYSTEM_MAINTENANCE!\n');

  // 2.3. Lỗi runtime generic thông thường
  const genericErr = new Error('Lỗi cú pháp nội bộ hoặc null pointer');
  const resGeneric = handleError(genericErr);
  assert.equal(resGeneric.success, false);
  assert.equal(resGeneric.statusCode, 500);
  assert.equal(resGeneric.code, 'INTERNAL_SERVER_ERROR');
  assert.equal(resGeneric.error, 'Lỗi cú pháp nội bộ hoặc null pointer');
  console.log('  ✅ [PASS] Xử lý Generic Error chuẩn xác (500, INTERNAL_SERVER_ERROR)\n');

  console.log('🎉 TOÀN BỘ CƠ CHẾ BẮT LỖI TOÀN CỤC VÀ E-04 ĐẠT CHUẨN 100%!');
}

runErrorHandlingTests().catch((err) => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
