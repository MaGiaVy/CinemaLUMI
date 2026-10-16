// __tests__/integration/run-integration-tests.mjs
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootTestsDir = path.resolve(__dirname, '..');

const INTEGRATION_TEST_FILES = [
  'integration/test-user-id-bypass.mjs',
  'integration/test-checkin-qr-verification.mjs',
  'integration/test-seat-concurrency.mjs',
  'integration/test-soft-delete-and-audit.mjs',
  'tickets/test-ticket-status.mjs',
  'security/test-middleware.mjs',
  'payments/test-payment-initiate.mjs',
  'payments/test-payment-callbacks.mjs',
  'staff/test-staff-ticket-search.mjs',
  'admin/test-admin-reports-revenue.mjs',
];

async function runSingleTest(file, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await new Promise((resolve) => {
      const fullPath = path.resolve(rootTestsDir, file);
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

async function ensureServerRunning() {
  const checkHealth = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/health', {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  if (await checkHealth()) {
    console.log('⚡ Next.js server đã sẵn sàng tại http://localhost:3000\n');
    return null;
  }

  console.log('⚠️ Không phát hiện máy chủ Next.js đang chạy trên cổng 3000.');
  console.log('🚀 Đang tự động khởi chạy Next.js server ngầm trên cổng 3000...');

  const appDir = path.resolve(rootTestsDir, '..');
  let proc = spawn('npx', ['next', 'start', '-p', '3000'], {
    cwd: appDir,
    stdio: 'ignore',
  });

  let ready = false;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkHealth()) {
      ready = true;
      break;
    }
  }

  if (!ready) {
    try { proc.kill(); } catch {}
    console.log('⏳ Thử khởi chạy với Next.js dev server...');
    proc = spawn('npx', ['next', 'dev', '-p', '3000'], {
      cwd: appDir,
      stdio: 'ignore',
    });
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      if (await checkHealth()) {
        ready = true;
        break;
      }
    }
  }

  if (!ready) {
    try { proc.kill(); } catch {}
    throw new Error('❌ Không thể tự khởi động máy chủ Next.js! Vui lòng chạy "npm run dev" trong terminal khác.');
  }

  console.log('✅ Next.js server đã khởi động và sẵn sàng thực thi test suites!\n');
  return proc;
}

async function main() {
  console.log('========================================================================');
  console.log('🔗 CINEMALUMI - BỘ KIỂM THỬ TÍCH HỢP HỆ THỐNG (INTEGRATION TEST SUITE)');
  console.log('========================================================================\n');

  let serverProc = null;
  try {
    serverProc = await ensureServerRunning();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const results = [];
  const startTime = Date.now();

  try {
    for (let i = 0; i < INTEGRATION_TEST_FILES.length; i++) {
      const file = INTEGRATION_TEST_FILES[i];
      process.stdout.write(`[${i + 1}/${INTEGRATION_TEST_FILES.length}] Đang chạy ${file}... `);
      const res = await runSingleTest(file);
      if (res.success) {
        console.log('✅ PASSED');
      } else {
        console.log('❌ FAILED');
        console.error(res.stderr || res.stdout);
      }
      results.push(res);
    }
  } finally {
    if (serverProc) {
      console.log('\n🧹 Đang dừng máy chủ Next.js test runner tự khởi tạo...');
      try {
        serverProc.kill();
      } catch {}
    }
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const passedCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  console.log('\n========================================================================');
  console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ TÍCH HỢP (INTEGRATION TESTS)');
  console.log('========================================================================');
  console.table(
    results.map((r) => ({
      'Bài kiểm thử tích hợp': r.file,
      'Trạng thái': r.success ? '✅ PASS' : '❌ FAIL',
      'Mã thoát': r.code,
    }))
  );

  console.log(`\nThời gian thực thi: ${durationSec}s`);
  console.log(`Tổng kết: ${passedCount} thành công, ${failedCount} thất bại.`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error during integration tests:', err);
  process.exit(1);
});
