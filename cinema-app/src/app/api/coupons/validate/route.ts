import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Interface cấu trúc dữ liệu kết quả trả về khi kiểm tra và áp dụng mã giảm giá
 */
export interface CouponValidateResult {
  coupon_id: number;
  couponId: number;
  code: string;
  discount_type: 'Percentage' | 'FixedAmount';
  discountType: 'Percentage' | 'FixedAmount';
  discount_value: number;
  discountValue: number;
  discount_amount: number;
  discountAmount: number;
  original_amount: number;
  originalAmount: number;
  final_amount: number;
  finalAmount: number;
  min_amount: number;
  minAmount: number;
  applicable_movie_id: number | null;
  applicableMovieId: number | null;
  movie?: {
    id: number;
    title: string;
    poster: string;
  } | null;
}

// Zod Schema kiểm tra dữ liệu đầu vào cho POST /api/coupons/validate
const validateCouponSchema = z
  .object({
    coupon_code: z.string().trim().min(1, 'Vui lòng nhập mã giảm giá').optional(),
    code: z.string().trim().min(1, 'Vui lòng nhập mã giảm giá').optional(),
    couponCode: z.string().trim().min(1, 'Vui lòng nhập mã giảm giá').optional(),
    total_amount: z.coerce
      .number()
      .min(0, 'Tổng tiền phải lớn hơn hoặc bằng 0')
      .optional(),
    totalAmount: z.coerce
      .number()
      .min(0, 'Tổng tiền phải lớn hơn hoặc bằng 0')
      .optional(),
    movie_id: z.coerce.number().int().positive().nullable().optional(),
    movieId: z.coerce.number().int().positive().nullable().optional(),
  })
  .refine(data => Boolean(data.coupon_code || data.code || data.couponCode), {
    message: 'Vui lòng cung cấp mã giảm giá (coupon_code hoặc code)',
    path: ['coupon_code'],
  })
  .refine(data => data.total_amount !== undefined || data.totalAmount !== undefined, {
    message: 'Vui lòng cung cấp tổng số tiền đơn hàng (total_amount hoặc totalAmount)',
    path: ['total_amount'],
  });

/**
 * POST /api/coupons/validate
 * Khách hàng sử dụng/kiểm tra mã giảm giá trước khi thanh toán.
 * 
 * Logic kiểm tra:
 * 1. Mã giảm giá có tồn tại trong hệ thống không
 * 2. Mã đã hết hạn sử dụng chưa
 * 3. Mã đã đạt giới hạn số lần sử dụng tối đa chưa
 * 4. Giá trị đơn hàng có đạt hạn mức tối thiểu (min_amount) không
 * 5. Mã có áp dụng cho phim cụ thể này không (nếu có chỉ định phim)
 * 6. Mã có bị giới hạn riêng cho người dùng cụ thể không (nếu có userId)
 * 
 * Trả về:
 * - Lỗi: Ném AppError rõ ràng (404 / 400 / 401 / 403)
 * - Thành công: Tính toán discount_amount và final_amount, trả về thông tin chi tiết
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu yêu cầu không hợp lệ (không thể parse JSON)', 'INVALID_JSON');
    }

    const parsed = validateCouponSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu đầu vào không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    const {
      coupon_code,
      code,
      couponCode,
      total_amount,
      totalAmount,
      movie_id,
      movieId,
    } = parsed.data;

    // Chuẩn hóa dữ liệu đầu vào
    const rawCode = coupon_code || code || couponCode!;
    const normalizedCode = rawCode.trim().toUpperCase();
    const finalTotalAmount = (total_amount ?? totalAmount)!;
    const finalMovieId = movie_id ?? movieId ?? null;

    // 1. Kiểm tra mã giảm giá có tồn tại không
    const coupon = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            poster: true,
          },
        },
      },
    });

    if (!coupon) {
      throw new AppError(
        404,
        `Mã giảm giá '${normalizedCode}' không tồn tại hoặc đã bị gỡ bỏ`,
        'COUPON_NOT_FOUND'
      );
    }

    // 2. Kiểm tra hạn sử dụng của mã
    const now = new Date();
    const expiryDate = new Date(coupon.expiryDate);
    // Ngày hết hạn trong DB thường lưu theo Date (00:00:00 UTC).
    // Đảm bảo mã có giá trị sử dụng đến hết 23:59:59.999 của ngày hết hạn đó.
    const expiryEndOfDay = new Date(expiryDate);
    expiryEndOfDay.setHours(23, 59, 59, 999);

    if (expiryEndOfDay < now) {
      const formattedExpiry = expiryDate.toLocaleDateString('vi-VN');
      throw new AppError(
        400,
        `Mã giảm giá '${normalizedCode}' đã hết hạn sử dụng vào ngày ${formattedExpiry}`,
        'COUPON_EXPIRED'
      );
    }

    // 3. Kiểm tra số lượt dùng đã vượt giới hạn chưa
    if (coupon.usedCount >= coupon.maxUsage) {
      throw new AppError(
        400,
        `Mã giảm giá '${normalizedCode}' đã hết lượt sử dụng (${coupon.usedCount}/${coupon.maxUsage})`,
        'COUPON_USAGE_LIMIT_EXCEEDED'
      );
    }

    // 4. Kiểm tra tổng tiền có đạt hạn mức tối thiểu min_amount không
    const minAmount = Number(coupon.minAmount);
    if (finalTotalAmount < minAmount) {
      throw new AppError(
        400,
        `Đơn hàng chưa đạt giá trị tối thiểu (${minAmount.toLocaleString('vi-VN')} đ) để áp dụng mã này`,
        'MIN_AMOUNT_NOT_REACHED'
      );
    }

    // 5. Kiểm tra mã có đúng cho phim này không
    if (coupon.applicableMovieId !== null) {
      if (finalMovieId === null) {
        const movieTitle = coupon.movie?.title ? `phim "${coupon.movie.title}"` : 'một phim cụ thể';
        throw new AppError(
          400,
          `Mã giảm giá này chỉ áp dụng riêng cho ${movieTitle}. Vui lòng cung cấp mã phim (movie_id).`,
          'COUPON_NOT_APPLICABLE_TO_MOVIE'
        );
      }

      if (coupon.applicableMovieId !== finalMovieId) {
        const targetMovie = coupon.movie?.title ? `phim "${coupon.movie.title}"` : `mã phim #${coupon.applicableMovieId}`;
        throw new AppError(
          400,
          `Mã giảm giá này chỉ áp dụng cho ${targetMovie}, không áp dụng cho phim bạn đã chọn`,
          'COUPON_NOT_APPLICABLE_TO_MOVIE'
        );
      }
    }

    // 6. Kiểm tra giới hạn cá nhân (nếu là voucher dành riêng cho 1 user)
    if (coupon.userId !== null) {
      const session = await getServerSession(authOptions);
      const currentUserId = session?.user?.id ? Number(session.user.id) : null;

      if (!currentUserId) {
        throw new AppError(
          401,
          'Mã giảm giá này là voucher cá nhân. Vui lòng đăng nhập để áp dụng.',
          'UNAUTHORIZED'
        );
      }

      if (coupon.userId !== currentUserId) {
        throw new AppError(
          403,
          'Mã giảm giá này chỉ dành riêng cho tài khoản được cấp, không thể sử dụng cho tài khoản khác',
          'COUPON_USER_RESTRICTED'
        );
      }
    }

    // 7. Tính toán giá trị giảm giá và số tiền thanh toán cuối cùng
    const discountValue = Number(coupon.discountValue);
    let discountAmount = 0;

    if (coupon.discountType === 'Percentage') {
      // Giảm theo %: (total_amount * discount_value) / 100
      discountAmount = Math.round((finalTotalAmount * discountValue) / 100);
    } else {
      // Giảm theo số tiền cố định (FixedAmount)
      discountAmount = discountValue;
    }

    // Không được giảm vượt quá tổng giá trị ban đầu của đơn hàng
    discountAmount = Math.min(discountAmount, finalTotalAmount);
    const finalAmount = Math.max(0, finalTotalAmount - discountAmount);

    const resultData: CouponValidateResult = {
      coupon_id: coupon.id,
      couponId: coupon.id,
      code: coupon.code,
      discount_type: coupon.discountType,
      discountType: coupon.discountType,
      discount_value: discountValue,
      discountValue: discountValue,
      discount_amount: discountAmount,
      discountAmount: discountAmount,
      original_amount: finalTotalAmount,
      originalAmount: finalTotalAmount,
      final_amount: finalAmount,
      finalAmount: finalAmount,
      min_amount: minAmount,
      minAmount: minAmount,
      applicable_movie_id: coupon.applicableMovieId,
      applicableMovieId: coupon.applicableMovieId,
      movie: coupon.movie
        ? {
            id: coupon.movie.id,
            title: coupon.movie.title,
            poster: coupon.movie.poster,
          }
        : null,
    };

    return apiResponse(
      true,
      resultData,
      `Áp dụng mã giảm giá '${coupon.code}' thành công! Giảm ${discountAmount.toLocaleString('vi-VN')} đ.`,
      200
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return apiResponse(
      false,
      undefined,
      errorResponse.error,
      errorResponse.statusCode,
      errorResponse.code,
      errorResponse.error
    );
  }
}
