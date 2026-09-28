import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export interface CouponResponseItem {
  id: number;
  code: string;
  discount_type: 'Percentage' | 'FixedAmount';
  discountType: 'Percentage' | 'FixedAmount';
  discount_value: number;
  discountValue: number;
  min_amount: number;
  minAmount: number;
  max_usage: number;
  maxUsage: number;
  used_count: number;
  usedCount: number;
  expiry_date: string;
  expiryDate: string;
  is_expired: boolean;
  is_available: boolean;
  applicable_movie_id: number | null;
  applicableMovieId: number | null;
  user_id: number | null;
  userId: number | null;
  movie?: {
    id: number;
    title: string;
    poster: string;
  } | null;
  created_at: string;
  updated_at: string;
}

// Zod Schema kiểm tra dữ liệu đầu vào cho POST /api/coupons
const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Mã khuyến mãi phải có ít nhất 3 ký tự')
    .max(50, 'Mã khuyến mãi không được vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã khuyến mãi chỉ được chứa chữ cái, số, gạch nối hoặc gạch dưới')
    .transform(val => val.toUpperCase()),
  discount_type: z
    .enum(['Percentage', 'FixedAmount', 'percentage', 'fixed_amount', 'PERCENTAGE', 'FIXED_AMOUNT'])
    .optional(),
  discountType: z
    .enum(['Percentage', 'FixedAmount', 'percentage', 'fixed_amount', 'PERCENTAGE', 'FIXED_AMOUNT'])
    .optional(),
  discount_value: z.coerce
    .number()
    .positive('Giá trị giảm giá phải lớn hơn 0')
    .optional(),
  discountValue: z.coerce
    .number()
    .positive('Giá trị giảm giá phải lớn hơn 0')
    .optional(),
  min_amount: z.coerce.number().min(0, 'Hạn mức tối thiểu không được là số âm').optional(),
  minAmount: z.coerce.number().min(0, 'Hạn mức tối thiểu không được là số âm').optional(),
  max_usage: z.coerce.number().int().min(1, 'Số lần sử dụng tối đa phải từ 1 trở lên').optional(),
  maxUsage: z.coerce.number().int().min(1, 'Số lần sử dụng tối đa phải từ 1 trở lên').optional(),
  expiry_date: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), 'Định dạng ngày hết hạn không hợp lệ')
    .optional(),
  expiryDate: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), 'Định dạng ngày hết hạn không hợp lệ')
    .optional(),
  applicable_movie_id: z.coerce.number().int().positive().nullable().optional(),
  applicableMovieId: z.coerce.number().int().positive().nullable().optional(),
  user_id: z.coerce.number().int().positive().nullable().optional(),
  userId: z.coerce.number().int().positive().nullable().optional(),
}).refine(data => data.discount_type !== undefined || data.discountType !== undefined, {
  message: 'Kiểu giảm giá (discount_type: Percentage hoặc FixedAmount) là bắt buộc',
  path: ['discount_type'],
}).refine(data => data.discount_value !== undefined || data.discountValue !== undefined, {
  message: 'Giá trị giảm (discount_value) là bắt buộc',
  path: ['discount_value'],
}).refine(data => data.expiry_date !== undefined || data.expiryDate !== undefined, {
  message: 'Ngày hết hạn (expiry_date) là bắt buộc',
  path: ['expiry_date'],
});

/**
 * Helper kiểm tra phân quyền Admin
 */
async function verifyAdminRole(request: NextRequest): Promise<void> {
  const session = await getServerSession(authOptions);
  const headerRole = request.headers.get('x-user-role');
  const isAdmin =
    session?.user?.role === 'ADMIN' ||
    (process.env.NODE_ENV === 'development' && headerRole === 'ADMIN');

  if (!isAdmin) {
    if (!session?.user) {
      throw new AppError(
        401,
        'Yêu cầu xác thực. Vui lòng đăng nhập với tài khoản Quản trị viên (ADMIN)',
        'UNAUTHORIZED'
      );
    }
    throw new AppError(
      403,
      'Bạn không có quyền thực hiện thao tác này. Quyền yêu cầu: ADMIN',
      'FORBIDDEN'
    );
  }
}

/**
 * GET /api/coupons
 * 
 * Lấy danh sách toàn bộ mã khuyến mãi trong hệ thống.
 * Ràng buộc: Chỉ dành cho Admin (session.user.role === 'ADMIN').
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Kiểm tra quyền ADMIN
    await verifyAdminRole(request);

    // 2. Query danh sách coupons kèm thông tin phim
    const coupons = await prisma.coupon.findMany({
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            poster: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const now = new Date();

    const data: CouponResponseItem[] = coupons.map(c => {
      const discountVal = Number(c.discountValue);
      const minAmt = Number(c.minAmount);
      const isExpired = new Date(c.expiryDate) < now;
      const isAvailable = !isExpired && c.usedCount < c.maxUsage;

      return {
        id: c.id,
        code: c.code,
        discount_type: c.discountType,
        discountType: c.discountType,
        discount_value: discountVal,
        discountValue: discountVal,
        min_amount: minAmt,
        minAmount: minAmt,
        max_usage: c.maxUsage,
        maxUsage: c.maxUsage,
        used_count: c.usedCount,
        usedCount: c.usedCount,
        expiry_date: c.expiryDate.toISOString(),
        expiryDate: c.expiryDate.toISOString(),
        is_expired: isExpired,
        is_available: isAvailable,
        applicable_movie_id: c.applicableMovieId,
        applicableMovieId: c.applicableMovieId,
        user_id: c.userId,
        userId: c.userId,
        movie: c.movie,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      };
    });

    return apiResponse(
      true,
      data,
      `Truy xuất danh sách khuyến mãi thành công (${data.length} mã)`
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

/**
 * POST /api/coupons
 * 
 * Tạo mã khuyến mãi mới.
 * Ràng buộc:
 * 1. session.user.role === 'ADMIN'.
 * 2. Validate đầy đủ dữ liệu bằng Zod (code, discount_type, discount_value, min_amount, max_usage, expiry_date, applicable_movie_id).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Kiểm tra quyền ADMIN
    await verifyAdminRole(request);

    // 2. Parse body
    let bodyUnknown: unknown;
    try {
      bodyUnknown = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    // 3. Validation với Zod
    const parsed = createCouponSchema.safeParse(bodyUnknown);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu mã khuyến mãi không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    const {
      code,
      discount_type,
      discountType,
      discount_value,
      discountValue,
      min_amount,
      minAmount,
      max_usage,
      maxUsage,
      expiry_date,
      expiryDate,
      applicable_movie_id,
      applicableMovieId,
      user_id,
      userId,
    } = parsed.data;

    // Chuẩn hóa enum DiscountType ('Percentage' | 'FixedAmount')
    const rawType = (discount_type || discountType) as string;
    const isPercentage = rawType.toLowerCase().includes('percent');
    const normalizedDiscountType: 'Percentage' | 'FixedAmount' = isPercentage ? 'Percentage' : 'FixedAmount';

    const finalDiscountValue = discount_value ?? discountValue!;
    const finalMinAmount = min_amount ?? minAmount ?? 0;
    const finalMaxUsage = max_usage ?? maxUsage ?? 1;
    const finalExpiryDateStr = expiry_date ?? expiryDate!;
    const finalMovieId = applicable_movie_id ?? applicableMovieId ?? null;
    const finalUserId = user_id ?? userId ?? null;

    // Ràng buộc giá trị phần trăm: từ 1% đến 100%
    if (normalizedDiscountType === 'Percentage' && finalDiscountValue > 100) {
      throw new AppError(
        400,
        'Kiểu giảm phần trăm không được vượt quá 100%',
        'INVALID_DISCOUNT_PERCENTAGE'
      );
    }

    // Ràng buộc ngày hết hạn phải sau thời điểm hiện tại
    const parsedExpiryDate = new Date(finalExpiryDateStr);
    const now = new Date();
    if (parsedExpiryDate < now) {
      throw new AppError(
        400,
        'Ngày hết hạn (expiry_date) phải lớn hơn thời điểm hiện tại',
        'EXPIRY_DATE_IN_PAST'
      );
    }

    // Kiểm tra phim áp dụng có tồn tại không (nếu có chọn phim cụ thể)
    if (finalMovieId !== null) {
      const movieExists = await prisma.movie.findUnique({
        where: { id: finalMovieId },
      });
      if (!movieExists) {
        throw new AppError(
          404,
          `Không tìm thấy phim với mã ID ${finalMovieId}`,
          'MOVIE_NOT_FOUND'
        );
      }
    }

    // Kiểm tra mã code không bị trùng
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    });
    if (existingCoupon) {
      throw new AppError(
        400,
        `Mã khuyến mãi '${code}' đã tồn tại trong hệ thống. Vui lòng chọn mã khác.`,
        'COUPON_ALREADY_EXISTS'
      );
    }

    // 4. Lưu bản ghi Coupon mới vào Database
    const newCoupon = await prisma.coupon.create({
      data: {
        code,
        discountType: normalizedDiscountType,
        discountValue: finalDiscountValue,
        minAmount: finalMinAmount,
        maxUsage: finalMaxUsage,
        usedCount: 0,
        expiryDate: parsedExpiryDate,
        applicableMovieId: finalMovieId,
        userId: finalUserId,
      },
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

    const responseItem: CouponResponseItem = {
      id: newCoupon.id,
      code: newCoupon.code,
      discount_type: newCoupon.discountType,
      discountType: newCoupon.discountType,
      discount_value: Number(newCoupon.discountValue),
      discountValue: Number(newCoupon.discountValue),
      min_amount: Number(newCoupon.minAmount),
      minAmount: Number(newCoupon.minAmount),
      max_usage: newCoupon.maxUsage,
      maxUsage: newCoupon.maxUsage,
      used_count: newCoupon.usedCount,
      usedCount: newCoupon.usedCount,
      expiry_date: newCoupon.expiryDate.toISOString(),
      expiryDate: newCoupon.expiryDate.toISOString(),
      is_expired: false,
      is_available: true,
      applicable_movie_id: newCoupon.applicableMovieId,
      applicableMovieId: newCoupon.applicableMovieId,
      user_id: newCoupon.userId,
      userId: newCoupon.userId,
      movie: newCoupon.movie,
      created_at: newCoupon.createdAt.toISOString(),
      updated_at: newCoupon.updatedAt.toISOString(),
    };

    return apiResponse(
      true,
      responseItem,
      `Tạo mã khuyến mãi '${newCoupon.code}' thành công!`,
      201
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
