/**
 * Trích xuất và chuẩn hóa Movie ID từ URL params hoặc slug.
 * Hỗ trợ các định dạng:
 * - Thuần số: "12" -> 12
 * - Tiền tố 'm': "m1" -> 1
 * - Hậu tố slug: "mai-99" -> 99, "abc-99" -> 99
 * - Chuỗi không hợp lệ: "invalid" -> null
 */
export function resolveMovieId(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const str = String(input).trim();
  if (!str) return null;

  // 1. Thuần số
  if (/^\d+$/.test(str)) {
    const val = Number.parseInt(str, 10);
    return Number.isFinite(val) && val > 0 ? val : null;
  }

  // 2. Tiền tố 'm' hoặc 'M' kèm số (vd: m1, M12)
  const mMatch = str.match(/^m(\d+)$/i);
  if (mMatch) {
    const val = Number.parseInt(mMatch[1], 10);
    return Number.isFinite(val) && val > 0 ? val : null;
  }

  // 3. Slug có ID ở cuối nối bằng gạch ngang (vd: lat-mat-7-15, abc-99)
  const slugMatch = str.match(/-(\d+)$/);
  if (slugMatch) {
    const val = Number.parseInt(slugMatch[1], 10);
    return Number.isFinite(val) && val > 0 ? val : null;
  }

  return null;
}
