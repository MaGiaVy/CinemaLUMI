import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { CouponResponseItem } from '../route';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Zod Schema cho cập nhật Coupon (các trường tùy chọn)
const updateCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Mã khuyến mãi phải có ít nhất 3 ký tự')
    .max(50, 'Mã khuyến mãi không được vượt quá 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã khuyến mãi chỉ được chứa chữ cái, số, gạch nối hoặc gạch dưới')
    .transform(val => val.toUpperCase())
    .optional(),
  discount_type: z
    .enum(['Percentage', 'FixedAmount', 'percentage', 'fixed_amount', 'PERCENTAGE', 'FIXED_AMOUNT'])
    .optional(),
  discountType: z
    .enum(['Percentage', 'FixedAmount', 'percentage', 'fixed_amount', 'PERCENTAGE', 'FIXED_AMOUNT'])
    .optional(),
  discount_value: z.coerce.number().positive('Giá trị giảm giá phải lớn hơn 0').optional(),
  discountValue: z.coerce.number().positive('Giá trị giảm giá phải lớn hơn 0').optional(),
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
 * GET /api/coupons/[id]
 * 
 * Lấy chi tiết một mã khuyến mãi theo ID.
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    await verifyAdminRole(request);

    const { id } = await params;
    const couponId = parseInt(id, 10);
    if (isNaN(couponId) || couponId <= 0) {
      throw new AppError(400, 'Mã định danh coupon (id) không hợp lệ', 'INVALID_ID');
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
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
      throw new AppError(404, `Không tìm thấy mã giảm giá với ID ${couponId}`, 'COUPON_NOT_FOUND');
    }

    const now = new Date();
    const discountVal = Number(coupon.discountValue);
    const minAmt = Number(coupon.minAmount);
    const isExpired = new Date(coupon.expiryDate) < now;
    const isAvailable = !isExpired && coupon.usedCount < coupon.maxUsage;

    const data: CouponResponseItem = {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discountType,
      discountType: coupon.discountType,
      discount_value: discountVal,
      discountValue: discountVal,
      min_amount: minAmt,
      minAmount: minAmt,
      max_usage: coupon.maxUsage,
      maxUsage: coupon.maxUsage,
      used_count: coupon.usedCount,
      usedCount: coupon.usedCount,
      expiry_date: coupon.expiryDate.toISOString(),
      expiryDate: coupon.expiryDate.toISOString(),
      is_expired: isExpired,
      is_available: isAvailable,
      applicable_movie_id: coupon.applicableMovieId,
      applicableMovieId: coupon.applicableMovieId,
      user_id: coupon.userId,
      userId: coupon.userId,
      movie: coupon.movie,
      created_at: coupon.createdAt.toISOString(),
      updated_at: coupon.updatedAt.toISOString(),
    };

    return apiResponse(true, data, `Lấy thông tin mã khuyến mãi '${coupon.code}' thành công`);
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
 * PUT /api/coupons/[id]
 * 
 * Sửa thông tin mã khuyến mãi.
 * Ràng buộc:
 * 1. session.user.role === 'ADMIN'.
 * 2. Validate dữ liệu bằng Zod.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. Kiểm tra quyền ADMIN
    await verifyAdminRole(request);

    // 2. Validate id
    const { id } = await params;
    const couponId = parseInt(id, 10);
    if (isNaN(couponId) || couponId <= 0) {
      throw new AppError(400, 'Mã định danh coupon (id) không hợp lệ', 'INVALID_ID');
    }

    // 3. Kiểm tra coupon có tồn tại không
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!existingCoupon) {
      throw new AppError(404, `Không tìm thấy mã giảm giá với ID ${couponId}`, 'COUPON_NOT_FOUND');
    }

    // 4. Parse body & validate Zod
    let bodyUnknown: unknown;
    try {
      bodyUnknown = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const parsed = updateCouponSchema.safeParse(bodyUnknown);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu cập nhật không hợp lệ';
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
    } = parsed.data;

    // Chuẩn bị payload cập nhật
    const updateData: {
      code?: string;
      discountType?: 'Percentage' | 'FixedAmount';
      discountValue?: number;
      minAmount?: number;
      maxUsage?: number;
      expiryDate?: Date;
      applicableMovieId?: number | null;
    } = {};

    // Kiểm tra code nếu có thay đổi
    if (code && code !== existingCoupon.code) {
      const codeConflict = await prisma.coupon.findUnique({
        where: { code },
      });
      if (codeConflict) {
        throw new AppError(
          400,
          `Mã khuyến mãi '${code}' đã được sử dụng bởi coupon khác`,
          'COUPON_ALREADY_EXISTS'
        );
      }
      updateData.code = code;
    }

    // Kiểu giảm giá
    const rawType = discount_type || discountType;
    if (rawType) {
      const isPercentage = rawType.toLowerCase().includes('percent');
      updateData.discountType = isPercentage ? 'Percentage' : 'FixedAmount';
    }

    // Giá trị giảm giá
    const newDiscountValue = discount_value ?? discountValue;
    if (newDiscountValue !== undefined) {
      const effectiveType = updateData.discountType || existingCoupon.discountType;
      if (effectiveType === 'Percentage' && newDiscountValue > 100) {
        throw new AppError(
          400,
          'Kiểu giảm phần trăm không được vượt quá 100%',
          'INVALID_DISCOUNT_PERCENTAGE'
        );
      }
      updateData.discountValue = newDiscountValue;
    }

    // Hạn mức tối thiểu
    const newMinAmount = min_amount ?? minAmount;
    if (newMinAmount !== undefined) {
      updateData.minAmount = newMinAmount;
    }

    // Số lần dùng tối đa
    const newMaxUsage = max_usage ?? maxUsage;
    if (newMaxUsage !== undefined) {
      if (newMaxUsage < existingCoupon.usedCount) {
        throw new AppError(
          400,
          `Số lần sử dụng tối đa không thể nhỏ hơn số lượt đã dùng hiện tại (${existingCoupon.usedCount})`,
          'INVALID_MAX_USAGE'
        );
      }
      updateData.maxUsage = newMaxUsage;
    }

    // Ngày hết hạn
    const newExpiryDateStr = expiry_date ?? expiryDate;
    if (newExpiryDateStr) {
      updateData.expiryDate = new Date(newExpiryDateStr);
    }

    // Phim áp dụng
    const newMovieId = applicable_movie_id ?? applicableMovieId;
    if (newMovieId !== undefined) {
      if (newMovieId !== null) {
        const movieExists = await prisma.movie.findUnique({
          where: { id: newMovieId },
        });
        if (!movieExists) {
          throw new AppError(404, `Không tìm thấy phim với mã ID ${newMovieId}`, 'MOVIE_NOT_FOUND');
        }
      }
      updateData.applicableMovieId = newMovieId;
    }

    // 5. Cập nhật vào DB
    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
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

    const now = new Date();
    const isExpired = new Date(updatedCoupon.expiryDate) < now;
    const isAvailable = !isExpired && updatedCoupon.usedCount < updatedCoupon.maxUsage;

    const responseItem: CouponResponseItem = {
      id: updatedCoupon.id,
      code: updatedCoupon.code,
      discount_type: updatedCoupon.discountType,
      discountType: updatedCoupon.discountType,
      discount_value: Number(updatedCoupon.discountValue),
      discountValue: Number(updatedCoupon.discountValue),
      min_amount: Number(updatedCoupon.minAmount),
      minAmount: Number(updatedCoupon.minAmount),
      max_usage: updatedCoupon.maxUsage,
      maxUsage: updatedCoupon.maxUsage,
      used_count: updatedCoupon.usedCount,
      usedCount: updatedCoupon.usedCount,
      expiry_date: updatedCoupon.expiryDate.toISOString(),
      expiryDate: updatedCoupon.expiryDate.toISOString(),
      is_expired: isExpired,
      is_available: isAvailable,
      applicable_movie_id: updatedCoupon.applicableMovieId,
      applicableMovieId: updatedCoupon.applicableMovieId,
      user_id: updatedCoupon.userId,
      userId: updatedCoupon.userId,
      movie: updatedCoupon.movie,
      created_at: updatedCoupon.createdAt.toISOString(),
      updated_at: updatedCoupon.updatedAt.toISOString(),
    };

    return apiResponse(
      true,
      responseItem,
      `Cập nhật mã khuyến mãi '${updatedCoupon.code}' thành công!`
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
 * DELETE /api/coupons/[id]
 * 
 * Xóa một mã khuyến mãi khỏi hệ thống.
 * Ràng buộc: session.user.role === 'ADMIN'.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    // 1. Kiểm tra quyền ADMIN
    await verifyAdminRole(request);

    // 2. Validate id
    const { id } = await params;
    const couponId = parseInt(id, 10);
    if (isNaN(couponId) || couponId <= 0) {
      throw new AppError(400, 'Mã định danh coupon (id) không hợp lệ', 'INVALID_ID');
    }

    // 3. Kiểm tra coupon có tồn tại không
    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!existingCoupon) {
      throw new AppError(404, `Không tìm thấy mã giảm giá với ID ${couponId}`, 'COUPON_NOT_FOUND');
    }

    // 4. Xóa coupon
    await prisma.coupon.delete({
      where: { id: couponId },
    });

    return apiResponse(
      true,
      {
        id: couponId,
        code: existingCoupon.code,
        deleted: true,
      },
      `Đã xóa thành công mã khuyến mãi '${existingCoupon.code}'`
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
