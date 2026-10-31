#!/usr/bin/env node

/**
 * Lumi Cinema - Unified Test Runner
 *
 * Chạy kiểm thử tự động toàn diện cho hệ thống Lumi Cinema:
 * 1. Chạy Unit Tests (pricing, business logic).
 * 2. Kiểm tra trạng thái máy chủ (http://localhost:3000).
 * 3. Nếu máy chủ đang chạy: chạy tuần tự các bài kiểm thử tích hợp (integration tests)
 *    và tổng hợp báo cáo.
 * 4. Nếu máy chủ chưa chạy: đưa ra hướng dẫn rõ ràng và thoát với exit code 0
 *    (khi các unit tests đều pass).
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const APP_ROOT = path.resolve(__dirname, '..');

// Cấu hình màu ANSI
const useColors = !process.env.NO_COLOR && (process.stdout.isTTY || process.env.FORCE_COLOR || process.env.CI);
const c = {
  reset: useColors ? '\x1b[0m' : '',
  bold: useColors ? '\x1b[1m' : '',
  dim: useColors ? '\x1b[2m' : '',
  red: useColors ? '\x1b[31m' : '',
  green: useColors ? '\x1b[32m' : '',
  yellow: useColors ? '\x1b[33m' : '',
  blue: useColors ? '\x1b[34m' : '',
  magenta: useColors ? '\x1b[35m' : '',
  cyan: useColors ? '\x1b[36m' : '',
  gray: useColors ? '\x1b[90m' : '',
};

// Phân tích tham số dòng lệnh
const args = process.argv.slice(2);
const isVerbose = args.includes('--verbose') || args.includes('-v');
const isUnitOnly = args.includes('--unit-only') || args.includes('-u');
const filterArg = args.find((a) => a.startsWith('--filter='));
const filterPattern = filterArg ? filterArg.split('=')[1] : null;
const urlArg = args.find((a) => a.startsWith('--url='));
const TARGET_URL = urlArg ? urlArg.split('=')[1] : (process.env.TEST_BASE_URL || 'http://localhost:3000');

function printBanner() {
  console.log(`${c.cyan}${c.bold}================================================================================${c.reset}`);
  console.log(`${c.cyan}${c.bold}  🎬  LUMI CINEMA - UNIFIED TEST RUNNER${c.reset}`);
  console.log(`${c.cyan}${c.bold}================================================================================${c.reset}\n`);
}

function normalizePath(p) {
  return p.split(path.sep).join('/');
}

/**
 * Quét đệ quy tìm tất cả file kiểm thử .mjs trong thư mục
 */
function findTestFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTestFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.mjs')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Kiểm tra kết nối tới máy chủ kiểm thử tích hợp (timeout 1.5s)
 */
async function checkServerReachable(url, timeoutMs = 1500) {
  try {
    let signal;
    let timer;
    if (typeof AbortSignal.timeout === 'function') {
      signal = AbortSignal.timeout(timeoutMs);
    } else {
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), timeoutMs);
      signal = controller.signal;
    }

    await fetch(url, { signal, method: 'GET' });
    if (timer) clearTimeout(timer);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Chạy một script kiểm thử bằng Node.js
 */
function runTestScript(filePath) {
  const relPath = normalizePath(path.relative(APP_ROOT, filePath));
  const startTime = Date.now();

  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', filePath],
    {
      cwd: APP_ROOT,
      env: { ...process.env, FORCE_COLOR: '1' },
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  const duration = Date.now() - startTime;
  return {
    filePath,
    relPath,
    success: result.status === 0,
    exitCode: result.status,
    duration,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

async function main() {
  printBanner();

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  const results = [];

  // =========================================================================
  // BƯỚC 1: Chạy Unit Tests
  // =========================================================================
  console.log(`${c.bold}${c.blue}📦 [PHASE 1] CHẠY KIỂM THỬ ĐƠN VỊ (UNIT TESTS)${c.reset}`);
  console.log(`${c.gray}--------------------------------------------------------------------------------${c.reset}`);

  const unitRunnerPath = path.join(APP_ROOT, '__tests__', 'lib', 'runner.mjs');
  if (!fs.existsSync(unitRunnerPath)) {
    console.error(`${c.red}❌ Không tìm thấy bộ kiểm thử đơn vị tại: ${unitRunnerPath}${c.reset}`);
    process.exit(1);
  }

  const unitRelPath = normalizePath(path.relative(APP_ROOT, unitRunnerPath));
  console.log(`▶ Đang chạy: ${c.bold}${unitRelPath}${c.reset} ...`);
  const unitResult = runTestScript(unitRunnerPath);

  if (unitResult.success) {
    totalPassed++;
    results.push({ name: unitRelPath, status: 'PASS', duration: unitResult.duration, type: 'UNIT' });
    console.log(`${c.green}✅ [PASS] Unit Tests thành công (${unitResult.duration}ms)${c.reset}`);
    if (isVerbose && unitResult.stdout) {
      console.log(`${c.dim}${unitResult.stdout.trim()}${c.reset}\n`);
    } else {
      // In kết quả tóm tắt từ output của runner
      const lines = unitResult.stdout.split('\n').filter((l) => l.includes('Passed') || l.includes('KẾT QUẢ'));
      lines.forEach((l) => console.log(`   ${c.gray}${l.trim()}${c.reset}`));
      console.log('');
    }
  } else {
    totalFailed++;
    results.push({ name: unitRelPath, status: 'FAIL', duration: unitResult.duration, type: 'UNIT' });
    console.error(`${c.red}❌ [FAIL] Unit Tests thất bại với mã lỗi ${unitResult.exitCode}!${c.reset}`);
    if (unitResult.stderr) console.error(`${c.red}${unitResult.stderr}${c.reset}`);
    if (unitResult.stdout) console.log(unitResult.stdout);
    console.error(`\n${c.red}${c.bold}Dừng kiểm thử vì Unit Tests không vượt qua.${c.reset}`);
    process.exit(1);
  }

  if (isUnitOnly) {
    console.log(`${c.yellow}ℹ️  Đã chỉ định cờ --unit-only. Bỏ qua kiểm tra máy chủ và integration tests.${c.reset}\n`);
    printSummary(results, totalPassed, totalFailed, totalSkipped);
    process.exit(0);
  }

  // =========================================================================
  // BƯỚC 2: Kiểm tra trạng thái máy chủ kiểm thử tích hợp
  // =========================================================================
  console.log(`${c.bold}${c.blue}🌐 [PHASE 2] KIỂM TRA MÁY CHỦ KIỂM THỬ TÍCH HỢP (${TARGET_URL})${c.reset}`);
  console.log(`${c.gray}--------------------------------------------------------------------------------${c.reset}`);

  const isServerOnline = await checkServerReachable(TARGET_URL);

  // Tìm tất cả integration test files
  const testsDir = path.join(APP_ROOT, '__tests__');
  const allTestFiles = findTestFiles(testsDir);
  let integrationFiles = allTestFiles.filter((f) => {
    const rel = normalizePath(path.relative(APP_ROOT, f));
    return !rel.includes('__tests__/lib/runner.mjs');
  });

  if (filterPattern) {
    integrationFiles = integrationFiles.filter((f) =>
      normalizePath(f).toLowerCase().includes(filterPattern.toLowerCase())
    );
  }

  integrationFiles.sort();

  if (!isServerOnline) {
    totalSkipped = integrationFiles.length;
    console.log(`${c.yellow}${c.bold}⚠️  CẢNH BÁO: Máy chủ không phản hồi tại ${TARGET_URL}.${c.reset}`);
    console.log(`${c.yellow}ℹ️  Các bài kiểm thử tích hợp (${integrationFiles.length} suites) yêu cầu Next.js server đang chạy.${c.reset}`);
    console.log(`${c.cyan}👉  Để chạy toàn bộ kiểm thử tích hợp:${c.reset}`);
    console.log(`    1. Khởi động máy chủ:   ${c.bold}npm run dev${c.reset}`);
    console.log(`    2. Trong terminal khác: ${c.bold}npm run test:all${c.reset}\n`);

    printSummary(results, totalPassed, totalFailed, totalSkipped);
    console.log(`${c.green}${c.bold}✨ Tất cả unit tests khả dụng đều ĐẠT CHUẨN 100%. Thoát sạch (exit code 0).${c.reset}\n`);
    process.exit(0);
  }

  // =========================================================================
  // BƯỚC 3: Máy chủ Online - Chạy tuần tự các bài kiểm thử tích hợp
  // =========================================================================
  console.log(`${c.green}✅ Máy chủ đang HOẠT ĐỘNG tại ${TARGET_URL}.${c.reset}`);
  console.log(`🚀 Bắt đầu thực thi ${integrationFiles.length} bài kiểm thử tích hợp...\n`);

  for (let i = 0; i < integrationFiles.length; i++) {
    const file = integrationFiles[i];
    const rel = normalizePath(path.relative(APP_ROOT, file));
    const indexStr = `[${String(i + 1).padStart(2, '0')}/${String(integrationFiles.length).padStart(2, '0')}]`;

    process.stdout.write(`${c.gray}${indexStr}${c.reset} Đang chạy: ${rel} ... `);

    const testRes = runTestScript(file);

    if (testRes.success) {
      totalPassed++;
      results.push({ name: rel, status: 'PASS', duration: testRes.duration, type: 'INTEGRATION' });
      console.log(`${c.green}✅ PASS${c.reset} ${c.gray}(${testRes.duration}ms)${c.reset}`);
      if (isVerbose && testRes.stdout) {
        console.log(`${c.dim}${testRes.stdout.trim()}${c.reset}\n`);
      }
    } else {
      totalFailed++;
      results.push({ name: rel, status: 'FAIL', duration: testRes.duration, type: 'INTEGRATION' });
      console.log(`${c.red}❌ FAIL${c.reset} ${c.gray}(exit code: ${testRes.exitCode})${c.reset}`);
      if (testRes.stderr) {
        console.error(`${c.red}${testRes.stderr.trim()}${c.reset}`);
      }
      if (testRes.stdout) {
        const preview = testRes.stdout
          .split('\n')
          .slice(-8)
          .join('\n');
        console.log(`${c.gray}${preview.trim()}${c.reset}`);
      }
    }
  }

  console.log('');
  printSummary(results, totalPassed, totalFailed, totalSkipped);

  if (totalFailed > 0) {
    console.error(`${c.red}${c.bold}❌ Kết thúc kiểm thử: Có ${totalFailed} suite thất bại!${c.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${c.green}${c.bold}🎉 TẤT CẢ CÁC BỘ KIỂM THỬ ĐỀU VƯỢT QUA XUẤT SẮC!${c.reset}\n`);
    process.exit(0);
  }
}

function printSummary(results, passed, failed, skipped) {
  console.log(`${c.cyan}${c.bold}================================================================================${c.reset}`);
  console.log(`${c.cyan}${c.bold}📊  BÁO CÁO TỔNG HỢP KẾT QUẢ KIỂM THỬ${c.reset}`);
  console.log(`${c.cyan}${c.bold}================================================================================${c.reset}`);

  for (const r of results) {
    const icon = r.status === 'PASS' ? `${c.green}✅ PASS${c.reset}` : `${c.red}❌ FAIL${c.reset}`;
    const badge = r.type === 'UNIT' ? `${c.cyan}[UNIT]${c.reset}` : `${c.blue}[INTG]${c.reset}`;
    console.log(` ${badge} ${icon}  ${r.name.padEnd(55)} ${c.gray}${r.duration}ms${c.reset}`);
  }

  console.log(`${c.gray}--------------------------------------------------------------------------------${c.reset}`);
  console.log(` 🏆 Tổng số bài kiểm thử: ${c.bold}${passed + failed + skipped}${c.reset}`);
  console.log(`    ${c.green}✔ Thành công (Passed): ${passed}${c.reset}`);
  if (failed > 0) {
    console.log(`    ${c.red}✖ Thất bại (Failed):  ${failed}${c.reset}`);
  }
  if (skipped > 0) {
    console.log(`    ${c.yellow}⊘ Bỏ qua (Skipped):   ${skipped} (yêu cầu server chạy)${c.reset}`);
  }
  console.log(`${c.cyan}${c.bold}================================================================================${c.reset}\n`);
}

main().catch((err) => {
  console.error(`${c.red}Lỗi không mong muốn trong test runner:${c.reset}`, err);
  process.exit(1);
});
