// __tests__/run-all-tests.mjs
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FILES = [
  'unit/run-unit-tests.mjs',
  'integration/test-user-id-bypass.mjs',
  'integration/test-checkin-qr-verification.mjs',
  'integration/test-seat-concurrency.mjs',
  'integration/test-soft-delete-and-audit.mjs',
  'lib/runner.mjs',
  'security/test-middleware.mjs',
  'security/test-error-boundaries.mjs',
  'payments/test-payment-initiate.mjs',
  'payments/test-payment-callbacks.mjs',
  'tickets/test-tickets-api.mjs',
  'tickets/test-ticket-status.mjs',
  'tickets/test-tickets-ui.mjs',
  'staff/test-staff-ticket-search.mjs',
  'staff/test-staff-cancel-with-voucher.mjs',
  'staff/test-staff-ui.mjs',
  'admin/test-admin-dashboard.mjs',
  'admin/test-admin-reports-revenue.mjs',
  'admin/test-admin-ui.mjs',
  'reviews/test-reviews-api.mjs',
  'reviews/test-review-delete-api.mjs',
  'reviews/test-reviews-ui.mjs',
  'email/test-email-service.mjs',
  'email/test-email-integration.mjs',
];

async function runSingleTest(file, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await new Promise((resolve) => {
      const fullPath = path.resolve(__dirname, file);
      const proc = spawn('node', ['--experimental-strip-types', fullPath], {
        stdio: 'pipe',
        env: process.env,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        resolve({
          file,
          code,
          success: code === 0,
          stdout,
          stderr,
        });
      });
    });

    if (res.success || attempt === maxRetries) {
      return res;
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
}

async function main() {
  console.log('========================================================================');
  console.log('🚀 CINEMALUMI - CHẠY TOÀN BỘ HỆ THỐNG KIỂM THỬ TỰ ĐỘNG (FULL TEST SUITE)');
  console.log('========================================================================\n');

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < TEST_FILES.length; i++) {
    const file = TEST_FILES[i];
    process.stdout.write(`[${i + 1}/${TEST_FILES.length}] Đang chạy ${file}... `);
    const res = await runSingleTest(file);
    if (res.success) {
      console.log('✅ PASSED');
    } else {
      console.log('❌ FAILED');
      console.error(res.stderr || res.stdout);
    }
    results.push(res);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const passedCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  console.log('\n========================================================================');
  console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ CINEMALUMI');
  console.log('========================================================================');
  console.table(
    results.map((r) => ({
      'Bài kiểm thử': r.file,
      'Trạng thái': r.success ? '✅ PASS' : '❌ FAIL',
      'Mã thoát': r.code,
    }))
  );

  console.log(`\nThời gian thực thi: ${durationSec}s`);
  console.log(`Tổng số test suites: ${TEST_FILES.length}`);
  console.log(`Số test suites ĐẠT (PASS): ${passedCount}`);
  console.log(`Số test suites HỎNG (FAIL): ${failedCount}`);
  console.log(`Tỷ lệ thành công: ${((passedCount / TEST_FILES.length) * 100).toFixed(1)}%`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main();
