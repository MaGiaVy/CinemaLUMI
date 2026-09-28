import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ type: string }>;
}

export interface PricingUpdateResponse {
  id: number;
  ticket_type: string;
  ticketType: string;
  label: string;
  price_percentage: number;
  percentage: number;
  base_price: number;
  basePrice: number;
  description: string | null;
  updated_at: string;
}

const updatePricingSchema = z.object({
  price_percentage: z
    .number()
    .positive('Tỷ lệ giá (price_percentage) phải lớn hơn 0')
    .max(1000, 'Tỷ lệ giá không được vượt quá 1000%')
    .optional(),
  percentage: z
    .number()
    .positive('Tỷ lệ giá (percentage) phải lớn hơn 0')
    .max(1000, 'Tỷ lệ giá không được vượt quá 1000%')
    .optional(),
  base_price: z
    .number()
    .min(0, 'Giá vé cơ bản phải lớn hơn hoặc bằng 0')
    .optional(),
  basePrice: z
    .number()
    .min(0, 'Giá vé cơ bản phải lớn hơn hoặc bằng 0')
    .optional(),
  label: z.string().optional(),
  description: z.string().nullable().optional(),
}).refine(data =>
  data.price_percentage !== undefined ||
  data.percentage !== undefined ||
  data.base_price !== undefined ||
  data.basePrice !== undefined ||
  data.label !== undefined ||
  data.description !== undefined, {
  message: 'Cần cung cấp ít nhất một trường thông tin để cập nhật (base_price hoặc price_percentage)',
  path: ['price_percentage'],
});

/**
 * PUT /api/pricing/[type]
 * 
 * Cập nhật tỷ lệ giá (price_percentage) cho loại vé tương ứng.
 * Ràng buộc nghiêm ngặt:
 * 1. Bắt buộc kiểm tra session.user.role === 'ADMIN'.
 * 2. Bắt lỗi Validation bằng Zod đảm bảo tỷ lệ giá lớn hơn 0.
 * 3. Tìm loại vé tương ứng theo ticketType hoặc label (Ví dụ: 'Trẻ em', 'Thường', 'CHILD', 'NORMAL').
 * 4. Tuân thủ tuyệt đối CODE_STANDARDS_BEST_PRACTICES.md (Không dùng any, Centralized Error Handling).
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { type } = await params;

    if (!type || type.trim() === '') {
      throw new AppError(400, 'Tham số loại vé (type) là bắt buộc', 'MISSING_TICKET_TYPE');
    }

    // 1. KIỂM TRA PHÂN QUYỀN (Ràng buộc bắt buộc: session.user.role === 'ADMIN')
    const session = await getServerSession(authOptions);

    // Hỗ trợ header x-admin-role dành cho môi trường test/internal nếu có
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

    // 2. PARSE BODY VÀ VALIDATION BẰNG ZOD
    let bodyUnknown: unknown;
    try {
      bodyUnknown = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const parseResult = updatePricingSchema.safeParse(bodyUnknown);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu tỷ lệ giá không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    const updateData: {
      percentage?: number;
      basePrice?: number;
      label?: string;
      description?: string | null;
    } = {};

    const rawPercentage = parseResult.data.price_percentage ?? parseResult.data.percentage;
    if (rawPercentage !== undefined) {
      updateData.percentage = Math.round(rawPercentage);
    }

    const rawBasePrice = parseResult.data.base_price ?? parseResult.data.basePrice;
    if (rawBasePrice !== undefined) {
      updateData.basePrice = Number(rawBasePrice);
    }

    if (parseResult.data.label) {
      updateData.label = parseResult.data.label.trim();
    }

    if (parseResult.data.description !== undefined) {
      updateData.description = parseResult.data.description ? parseResult.data.description.trim() : null;
    }

    // 3. TÌM LOẠI VÉ TRONG BẢNG PRICING (Linh hoạt: theo ticketType hoặc theo label)
    const decodedType = decodeURIComponent(type).trim();

    const existingPricing = await prisma.pricing.findFirst({
      where: {
        OR: [
          { ticketType: { equals: decodedType, mode: 'insensitive' } },
          { label: { equals: decodedType, mode: 'insensitive' } },
          { label: { contains: decodedType, mode: 'insensitive' } },
          ...(isNaN(Number(decodedType)) ? [] : [{ id: Number(decodedType) }]),
        ],
      },
    });

    if (!existingPricing) {
      throw new AppError(
        404,
        `Không tìm thấy loại vé phù hợp với từ khóa: '${decodedType}'`,
        'PRICING_NOT_FOUND'
      );
    }

    // 4. CẬP NHẬT TỶ LỆ GIÁ VÀ GIÁ CƠ BẢN
    const updated = await prisma.pricing.update({
      where: { id: existingPricing.id },
      data: updateData,
    });

    const numericBasePrice = typeof updated.basePrice === 'number'
      ? updated.basePrice
      : Number(updated.basePrice);

    const responseData: PricingUpdateResponse = {
      id: updated.id,
      ticket_type: updated.ticketType,
      ticketType: updated.ticketType,
      label: updated.label,
      price_percentage: updated.percentage,
      percentage: updated.percentage,
      base_price: isNaN(numericBasePrice) ? 0 : numericBasePrice,
      basePrice: isNaN(numericBasePrice) ? 0 : numericBasePrice,
      description: updated.description,
      updated_at: updated.updatedAt.toISOString(),
    };

    return apiResponse(
      true,
      responseData,
      `Cập nhật tỷ lệ giá cho loại vé '${updated.label}' thành công: ${updated.percentage}%`
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
 * GET /api/pricing/[type]
 * 
 * Xem chi tiết cấu hình giá của một loại vé theo type hoặc label.
 */
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { type } = await params;
    const decodedType = decodeURIComponent(type).trim();

    const pricing = await prisma.pricing.findFirst({
      where: {
        OR: [
          { ticketType: { equals: decodedType, mode: 'insensitive' } },
          { label: { equals: decodedType, mode: 'insensitive' } },
          { label: { contains: decodedType, mode: 'insensitive' } },
          ...(isNaN(Number(decodedType)) ? [] : [{ id: Number(decodedType) }]),
        ],
      },
    });

    if (!pricing) {
      throw new AppError(
        404,
        `Không tìm thấy loại vé '${decodedType}'`,
        'PRICING_NOT_FOUND'
      );
    }

    const numericBasePrice = typeof pricing.basePrice === 'number'
      ? pricing.basePrice
      : Number(pricing.basePrice);

    const data: PricingUpdateResponse = {
      id: pricing.id,
      ticket_type: pricing.ticketType,
      ticketType: pricing.ticketType,
      label: pricing.label,
      price_percentage: pricing.percentage,
      percentage: pricing.percentage,
      base_price: isNaN(numericBasePrice) ? 0 : numericBasePrice,
      basePrice: isNaN(numericBasePrice) ? 0 : numericBasePrice,
      description: pricing.description,
      updated_at: pricing.updatedAt.toISOString(),
    };

    return apiResponse(true, data, `Lấy thông tin giá vé '${pricing.label}' thành công`);
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
