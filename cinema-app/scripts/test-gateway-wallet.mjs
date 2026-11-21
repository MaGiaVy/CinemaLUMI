import assert from 'assert';
import {
  getThirdPartyAccounts,
  topupThirdPartyAccount,
  resetThirdPartyAccount,
  debitThirdPartyAccountIfSufficient,
} from '../src/lib/third-party-accounts.ts';

const testUser = { id: 9999, name: 'Test User', phone: '0909123456', email: 'test@lumi.vn' };

// 1. Lấy tài khoản từ bên thứ 3 cho cả 2 gateway
const zpAccounts = getThirdPartyAccounts('zalopay', testUser);
const vnpAccounts = getThirdPartyAccounts('vnpay', testUser);
assert.strictEqual(zpAccounts.length, 3, 'ZaloPay phải có 3 tài khoản bên thứ 3');
assert.strictEqual(vnpAccounts.length, 3, 'VNPay phải có 3 tài khoản bên thứ 3');

// 2. Tài khoản Starter mặc định 50.000đ -> Thanh toán 120.000đ phải bị chặn
const starter = zpAccounts.find((a) => a.id === 'zp-starter');
assert.ok(starter && starter.balance === 50000);
const failDebit = debitThirdPartyAccountIfSufficient('zalopay', testUser, 'zp-starter', 120000);
assert.strictEqual(failDebit.ok, false, 'Không đủ tiền phải bị chặn thanh toán');
assert.strictEqual(failDebit.missing, 70000, 'Phải báo chính xác số tiền thiếu 70.000đ');

// 3. Nạp thêm 100.000đ -> Tổng 150.000đ -> Thanh toán 120.000đ phải thành công, còn 30.000đ
const topped = topupThirdPartyAccount('zalopay', testUser, 'zp-starter', 100000);
assert.strictEqual(topped?.balance, 150000);
const okDebit = debitThirdPartyAccountIfSufficient('zalopay', testUser, 'zp-starter', 120000);
assert.strictEqual(okDebit.ok, true, 'Đủ tiền phải thanh toán thành công');
assert.strictEqual(okDebit.newBalance, 30000, 'Số dư sau trừ phải còn 30.000đ');

// 4. Kiểm tra reset VNPay
topupThirdPartyAccount('vnpay', testUser, 'vnp-linked', 200000);
const resetVnp = resetThirdPartyAccount('vnpay', testUser, 'vnp-linked');
assert.strictEqual(resetVnp?.balance, 500000, 'Reset phải khôi phục về số dư mặc định 500.000đ');

console.log('✓ ALL THIRD-PARTY GATEWAY WALLET TESTS PASSED (ZaloPay + VNPay)!');
