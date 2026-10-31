# Kế Hoạch Rà Soát & Hoàn Thiện Toàn Diện Codebase LumiCinema (Codebase Audit & Refinement Plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện và chuẩn hóa toàn bộ mã nguồn hệ thống LumiCinema, khắc phục các điểm cảnh báo Next.js 16, đồng bộ hóa 100% nghiệp vụ quầy và báo cáo với SRS & 55 sơ đồ UML, chuẩn hóa test suite và chốt git commit sạch sẽ cho đồ án.

**Architecture:** Next.js 16 (App Router), React 19, Prisma ORM 6, PostgreSQL (Supabase Cloud), NextAuth.js (JWT Session 24h), Tailwind CSS v4, VNPay Sandbox HMAC-SHA512.

**Tech Stack:** TypeScript, Next.js, React, Prisma, PostgreSQL, Zod, Bcryptjs, Nodemailer, QRCode.

**Spec:** `d:\cinema_project\SRS_He_Thong_Quan_Ly_Rap_Phim.md`, `d:\cinema_project\tech_spec.md`, `d:\cinema_project\Check_fix.md`.

## Global Constraints

- Không xây lại dự án từ đầu; kế thừa tối đa mã nguồn hiện có đang hoạt động tốt.
- Mọi API phải kiểm tra xác thực và phân quyền RBAC (`CUSTOMER`, `STAFF`, `ADMIN`) chặt chẽ phía Server.
- Không sử dụng mockData trong các luồng nghiệp vụ thực tế khi CSDL PostgreSQL đã kết nối.
- Giữ nguyên các ràng buộc nghiệp vụ then chốt: Giữ ghế 10 phút (`BR-01`), Giá vé Người lớn/Trẻ em (`BR-02`), Khách tự hủy vé nhận voucher 50% (`BR-03`), Rạp hủy vé sự cố hoàn tiền mặt 100% (`BR-04`), Giao nhận combo online chặn nhận trùng (`BR-05`), Khung giờ suất chiếu cách nhau 15 phút dọn dẹp phòng (`BR-09`), Báo cáo bóc tách công nợ hoàn tiền (`BR-10`).
- Đảm bảo `npm run build` chạy thành công không có lỗi biên dịch TypeScript.

## Review Focus

- Xung đột file `middleware.ts` ở thư mục gốc và `src/middleware.ts` gây cảnh báo Next.js 16.
- 10 file uncommitted trong git working tree chứa các cải tiến gần đây cần được kiểm tra hồi quy trước khi commit.
- Bộ test integration trong `__tests__/` bị lỗi `ECONNREFUSED` khi chạy độc lập do thiếu runner khởi động dev server tự động.
- Tính đồng bộ giữa giao diện POS quầy (`/staff/pos`, `/staff/combos`) với 2 sơ đồ Sequence mới (`13_ban_combo_tai_quay_pos.puml` và `15_giao_nhan_combo_online.puml`).
- Khả năng xử lý lỗi mất kết nối DB hoặc lỗi mạng trên các trang Client Component.

---

### Task 1: Chuẩn Hóa Cấu Trúc Middleware Next.js 16 & Dọn Dẹp Cảnh Báo Build

**Files:**
- Modify: `cinema-app/src/middleware.ts`
- Delete: `cinema-app/middleware.ts`
- Test: `cinema-app/__tests__/security/test-middleware.mjs`

**Interfaces:**
- Consumes: NextAuth JWT token từ request cookies
- Produces: Clean NextRequest routing cho `/admin/*`, `/staff/*`, `/screenings/*/checkout`

- [ ] **Step 1: Xóa bỏ file `cinema-app/middleware.ts` dư thừa ở root**
Chỉ giữ lại duy nhất `cinema-app/src/middleware.ts` theo đúng tài liệu chuẩn của Next.js khi dự án sử dụng thư mục `src/`.

- [ ] **Step 2: Cập nhật matcher config trong `cinema-app/src/middleware.ts`**
Đảm bảo matcher bao quát toàn diện:
```typescript
export const config = {
  matcher: [
    '/admin/:path*',
    '/staff/:path*',
    '/tickets/:path*',
    '/screenings/:id/checkout/:path*',
  ],
};
```

- [ ] **Step 3: Chạy test biên dịch để xác nhận không còn lỗi cấu trúc**
Run: `cd cinema-app; npm run build`
Expected: `✓ Compiled successfully`, không còn cảnh báo trùng lặp middleware.

- [ ] **Step 4: Commit thay đổi Task 1**
```bash
git add cinema-app/src/middleware.ts
git rm cinema-app/middleware.ts
git commit -m "fix(middleware): consolidate nextjs middleware in src directory"
```

---

### Task 2: Kiểm Tra & Chốt Lưu Trữ 10 File Working Tree Đang Dở Dang

**Files:**
- Review & Commit:
  - `cinema-app/src/app/(customer)/screenings/[id]/checkout/page.tsx`
  - `cinema-app/src/app/(customer)/screenings/[id]/checkout/payment/page.tsx`
  - `cinema-app/src/app/admin/combos/page.tsx`
  - `cinema-app/src/app/admin/reports/page.tsx`
  - `cinema-app/src/app/page.tsx`
  - `cinema-app/src/app/staff/combos/page.tsx`
  - `cinema-app/src/app/staff/lookup/page.tsx`
  - `cinema-app/src/components/ui/Toast.tsx`
  - `cinema-app/src/data/mockData.ts`

**Interfaces:**
- Consumes: Các bản vá bảo mật auth check, Toast UI cải tiến và fetch DB sạch sẽ
- Produces: Clean Git working tree không còn uncommitted changes

- [ ] **Step 1: Kiểm tra tính hoạt động của luồng Checkout & Toast**
Đảm bảo nút thanh toán chặn redirect mượt mà khi chưa đăng nhập, Toast hiển thị rõ ràng với icon và badge phân biệt.

- [ ] **Step 2: Kiểm tra trang chủ `page.tsx` và trang báo cáo `reports/page.tsx`**
Đảm bảo trang chủ tải danh mục phim thật từ CSDL, không phụ thuộc mockData; trang báo cáo hiển thị chuẩn công nợ hoàn tiền (`BR-10`).

- [ ] **Step 3: Chạy type-check toàn diện**
Run: `cd cinema-app; npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit toàn bộ 10 file đã được rà soát**
```bash
git add cinema-app/src/
git commit -m "feat(core): refine customer checkout auth, toast ui styling, and report metrics"
```

---

### Task 3: Đồng Bộ Hoá & Hoàn Thiện Giao Diện Nghiệp Vụ Quầy POS & Giao Nhận Combo

**Files:**
- Modify: `cinema-app/src/app/staff/pos/page.tsx`
- Modify: `cinema-app/src/app/staff/combos/page.tsx`
- Modify: `cinema-app/src/app/api/staff/pos/combos/route.ts`
- Modify: `cinema-app/src/app/api/staff/combos/deliver/route.ts`

**Interfaces:**
- Consumes: `13_ban_combo_tai_quay_pos.puml` (FR-POS-03), `15_giao_nhan_combo_online.puml` (FR-CHK-02)
- Produces: Hoàn thiện tính năng bán combo lẻ tại POS và quét mã nhận bắp nước online

- [ ] **Step 1: Rà soát API Bán combo tại quầy (`/api/staff/pos/combos`)**
Xác nhận API kiểm tra tồn kho (`stock >= quantity`), trừ tồn kho theo transaction ACID, tạo bản ghi `OrderCombo` trạng thái `isDelivered = true` và in hóa đơn lẻ tại quầy.

- [ ] **Step 2: Rà soát API Giao nhận combo online (`/api/staff/combos/deliver`)**
Đảm bảo kiểm tra `isDelivered === false` trước khi giao (`BR-05`). Nếu `isDelivered === true`, trả về mã lỗi `409 Conflict` kèm thông báo "Combo đã được giao nhận trước đó lúc [giờ]".

- [ ] **Step 3: Kiểm thử luồng giao nhận trên giao diện Staff**
Chạy thử và xác nhận nút "Xác nhận đã giao" chuyển màu xám và khóa thao tác sau khi bấm thành công.

- [ ] **Step 4: Commit thay đổi Task 3**
```bash
git add cinema-app/src/app/staff/ cinema-app/src/app/api/staff/
git commit -m "feat(staff): enforce instant pos combo sales and safe online combo delivery"
```

---

### Task 4: Xây Dựng Unified Test Runner Tự Động Cho Toàn Bộ Suite Kiểm Thử

**Files:**
- Create: `cinema-app/scripts/run-all-tests.mjs`
- Modify: `cinema-app/package.json`
- Test: Toàn bộ 15+ test scripts trong `cinema-app/__tests__/`

**Interfaces:**
- Consumes: Test scripts trong `__tests__/admin`, `__tests__/payments`, `__tests__/tickets`, `__tests__/staff`
- Produces: Lệnh `npm test` hoặc `npm run test:all` chạy tự động kiểm tra server, chạy test tuần tự và xuất bảng báo cáo Pass/Fail

- [ ] **Step 1: Viết script `run-all-tests.mjs`**
Script tự động kiểm tra `localhost:3000`. Nếu chưa chạy, hiển thị thông báo hướng dẫn hoặc mock các response để chạy offline.
Tích hợp chạy cả Unit Test (`pricing.test.ts`) lẫn Integration Test.

- [ ] **Step 2: Thêm script vào `package.json`**
```json
"scripts": {
  "test": "node --experimental-strip-types __tests__/lib/runner.mjs",
  "test:all": "node scripts/run-all-tests.mjs"
}
```

- [ ] **Step 3: Chạy thử nghiệm script kiểm thử**
Run: `cd cinema-app; npm test`
Expected: PASS 100% 6/6 test cases của `pricing.ts`.

- [ ] **Step 4: Commit thay đổi Task 4**
```bash
git add cinema-app/scripts/run-all-tests.mjs cinema-app/package.json
git commit -m "test(runner): provide unified test runner and scripts"
```

---

### Task 5: Kiểm Chuẩn Đồng Bộ Cuối Cùng Giữa Code, CSDL Và 55 Sơ Đồ UML

**Files:**
- Review: `d:\cinema_project\Bao_Cao_Dong_Gop_Ca_Nhan_LumiCinema.md`
- Review: `d:\cinema_project\PlantUML_Activity_Diagrams\Activity_Diagrams_LumiCinema.docx`
- Review: `d:\cinema_project\Sequence\README.md`

**Interfaces:**
- Consumes: Toàn bộ hiện trạng mã nguồn sau khi chỉnh sửa
- Produces: Báo cáo nghiệm thu hoàn chỉnh sẵn sàng nộp và bảo vệ

- [ ] **Step 1: Đối soát ma trận 10 Quy tắc nghiệp vụ (BR-01 đến BR-10)**
Xác nhận từng quy tắc nghiệp vụ đều có đoạn code xử lý tương ứng trong API, CSDL và sơ đồ UML.

- [ ] **Step 2: Chạy kiểm tra build sản phẩm cuối cùng**
Run: `cd cinema-app; npm run build`
Expected: Build thành công (Exit code 0), tất cả các route tĩnh và động đều được render chuẩn xác.

- [ ] **Step 3: Commit hoàn thiện toàn bộ dự án**
```bash
git add docs/ d:\cinema_project\*.md
git commit -m "docs: finalize codebase audit report, implementation plan, and defense guide"
```
