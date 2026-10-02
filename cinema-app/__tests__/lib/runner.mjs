import { calculateTicketPrice } from '../../src/lib/pricing.ts';
import { resolveMovieId } from '../../src/lib/movie-id.ts';
import assert from 'assert';

console.log('=== CHẠY BỘ KIỂM THỬ: calculateTicketPrice ===');

// 1. Kiểm tra vé thường
const p1 = calculateTicketPrice(100000, 'Thường', 1);
assert.strictEqual(p1, 100000, 'Vé thường 100% phải có giá 100.000đ');
console.log('✓ Test 1 Passed: calculateTicketPrice(100000, "Thường", 1) =', p1);

// 2. Kiểm tra vé trẻ em (50%)
const p2 = calculateTicketPrice(100000, 'Trẻ em', 1);
assert.strictEqual(p2, 50000, 'Vé trẻ em 50% phải có giá 50.000đ');
console.log('✓ Test 2 Passed: calculateTicketPrice(100000, "Trẻ em", 1) =', p2);

// 3. Kiểm tra mua nhiều vé (quantity = 2)
const p3 = calculateTicketPrice(100000, 'Thường', 2);
assert.strictEqual(p3, 200000, '2 vé thường phải có giá 200.000đ');
console.log('✓ Test 3 Passed: calculateTicketPrice(100000, "Thường", 2) =', p3);

// 4. Kiểm tra với tỷ lệ phần trăm số (pricePercentage = 50, quantity = 3)
const p4 = calculateTicketPrice(120000, 50, 3);
assert.strictEqual(p4, 180000, '120.000 x 50% x 3 = 180.000đ');
console.log('✓ Test 4 Passed: calculateTicketPrice(120000, 50, 3) =', p4);

// 5. Kiểm tra vé VIP (120%) & Vé Ghế đôi (180%)
const pVip = calculateTicketPrice(100000, 120, 1);
assert.strictEqual(pVip, 120000, 'Vé VIP 120% = 120.000đ');
const pCouple = calculateTicketPrice(100000, 'Ghế đôi', 1);
assert.strictEqual(pCouple, 180000, 'Vé Ghế đôi 180% = 180.000đ');
console.log('✓ Test 5 Passed: VIP =', pVip, ', Couple =', pCouple);

// 6. Kiểm tra validation bắt lỗi số âm
assert.throws(() => calculateTicketPrice(-100000, 100, 1), /basePrice/);
assert.throws(() => calculateTicketPrice(100000, 100, -2), /quantity/);
assert.throws(() => calculateTicketPrice(100000, -50, 1), /pricePercentage/);
console.log('✓ Test 6 Passed: Validation bắt lỗi số âm hoạt động chính xác');

// 7. Kiểm tra parse id phim từ URL dạng /movies/m1, /movies/12, /movies/abc-99
assert.strictEqual(resolveMovieId('m1'), 1, 'URL /movies/m1 phải map về movie id 1');
assert.strictEqual(resolveMovieId('12'), 12, 'URL /movies/12 phải map về movie id 12');
assert.strictEqual(resolveMovieId('abc-99'), 99, 'URL /movies/abc-99 phải map về movie id 99');
assert.strictEqual(resolveMovieId('invalid'), null, 'ID không hợp lệ phải trả về null');
console.log('✓ Test 7 Passed: resolveMovieId xử lý đúng URL phim và ID không hợp lệ');

console.log('\n>>> KẾT QUẢ: TẤT CẢ 7 TEST CASES ĐỀU ĐẠT CHUẨN 100%! <<<\n');
