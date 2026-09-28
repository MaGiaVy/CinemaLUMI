import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { ComboResponseItem } from '../route';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Zod Schema cho dữ liệu cập nhật Combo (PUT /api/combos/[id])
const updateComboSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên combo không được để trống')
    .max(100, 'Tên combo không được vượt quá 100 ký tự')
    .optional(),
  description: z.string().trim().nullable().optional(),
  price: z.coerce
    .number()
    .positive('Giá combo phải lớn hơn 0')
    .optional(),
  stock_quantity: z.coerce
    .number()
    .int('Số lượng tồn kho phải là số nguyên')
    .min(0, 'Số lượng tồn kho không được là số âm')
    .optional(),
  stock: z.coerce
    .number()
    .int('Số lượng tồn kho phải là số nguyên')
    .min(0, 'Số lượng tồn kho không được là số âm')
    .optional(),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'active', 'inactive'])
    .optional(),
  image: z.string().trim().nullable().optional(),
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
    throw new AppError(
      403,
      'Bạn không có quyền thực hiện hành động này. Yêu cầu quyền ADMIN.',
      'FORBIDDEN'
    );
  }
}

/**
 * Helper format bản ghi Combo trả về
 */
function formatCombo(c: {
  id: number;
  name: string;
  description: string | null;
  price: { toString(): string } | number;
  image: string | null;
  stock: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}): ComboResponseItem {
  const priceNum = Number(c.price);
  const isAvail = c.status === 'ACTIVE' && c.stock > 0;

  return {
    id: c.id,
    name: c.name,
    description: c.description,
    price: priceNum,
    image: c.image,
    stock: c.stock,
    stock_quantity: c.stock,
    stockQuantity: c.stock,
    status: c.status,
    is_available: isAvail,
    isAvailable: isAvail,
    created_at: c.createdAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

/**
 * GET /api/combos/[id]
 * Lấy thông tin chi tiết một combo theo ID.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const comboId = parseInt(id, 10);

    if (isNaN(comboId) || comboId <= 0) {
      throw new AppError(400, 'Mã combo (id) không hợp lệ', 'INVALID_ID');
    }

    const combo = await prisma.combo.findUnique({
      where: { id: comboId },
    });

    if (!combo) {
      throw new AppError(404, `Không tìm thấy combo với ID #${comboId}`, 'COMBO_NOT_FOUND');
    }

    return apiResponse(true, formatCombo(combo), 'Lấy thông tin combo thành công', 200);
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
 * PUT /api/combos/[id]
 * 
 * Cập nhật thông tin combo (giá, tồn kho, tên, trạng thái...):
 * - Ràng buộc: Bắt buộc kiểm tra session.user.role === 'ADMIN'.
 * - Validate dữ liệu đầu vào bằng Zod.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Kiểm tra quyền ADMIN
    await verifyAdminRole(request);

    // 2. Kiểm tra combo ID
    const { id } = await params;
    const comboId = parseInt(id, 10);

    if (isNaN(comboId) || comboId <= 0) {
      throw new AppError(400, 'Mã combo (id) không hợp lệ', 'INVALID_ID');
    }

    // 3. Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu yêu cầu không hợp lệ (không thể parse JSON)', 'INVALID_JSON');
    }

    // 4. Validate dữ liệu với Zod
    const parsed = updateComboSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu cập nhật combo không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    const {
      name,
      description,
      price,
      stock_quantity,
      stock,
      status,
      image,
    } = parsed.data;

    // 5. Kiểm tra combo có tồn tại không
    const existing = await prisma.combo.findUnique({
      where: { id: comboId },
    });

    if (!existing) {
      throw new AppError(
        404,
        `Không tìm thấy combo với ID #${comboId} để cập nhật`,
        'COMBO_NOT_FOUND'
      );
    }

    // 6. Chuẩn bị dữ liệu cập nhật
    const updateData: {
      name?: string;
      description?: string | null;
      price?: number;
      stock?: number;
      status?: 'ACTIVE' | 'INACTIVE';
      image?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (stock_quantity !== undefined) updateData.stock = stock_quantity;
    else if (stock !== undefined) updateData.stock = stock;
    if (status !== undefined) {
      updateData.status = status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    }
    if (image !== undefined) updateData.image = image;

    // 7. Cập nhật vào DB
    const updated = await prisma.combo.update({
      where: { id: comboId },
      data: updateData,
    });

    return apiResponse(
      true,
      formatCombo(updated),
      `Cập nhật combo '${updated.name}' thành công!`,
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

/**
 * DELETE /api/combos/[id]
 * 
 * Xóa combo bắp nước:
 * - Ràng buộc: Bắt buộc kiểm tra session.user.role === 'ADMIN'.
 * - Kiểm tra ràng buộc kho dữ liệu: Nếu đã có đơn hàng từng mua combo này, báo lỗi không cho xóa (khuyến nghị chuyển INACTIVE).
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // 1. Kiểm tra quyền ADMIN
    await verifyAdminRole(request);

    // 2. Kiểm tra combo ID
    const { id } = await params;
    const comboId = parseInt(id, 10);

    if (isNaN(comboId) || comboId <= 0) {
      throw new AppError(400, 'Mã combo (id) không hợp lệ', 'INVALID_ID');
    }

    // 3. Kiểm tra combo có tồn tại không
    const existing = await prisma.combo.findUnique({
      where: { id: comboId },
    });

    if (!existing) {
      throw new AppError(
        404,
        `Không tìm thấy combo với ID #${comboId} để xóa`,
        'COMBO_NOT_FOUND'
      );
    }

    // 4. Kiểm tra combo có liên kết với lịch sử đơn hàng nào chưa
    const orderComboCount = await prisma.orderCombo.count({
      where: { comboId },
    });

    if (orderComboCount > 0) {
      throw new AppError(
        400,
        `Không thể xóa combo '${existing.name}' vì đã có ${orderComboCount} đơn hàng từng mua combo này. Bạn hãy chuyển trạng thái sang 'INACTIVE' để ngừng kinh doanh thay vì xóa.`,
        'COMBO_HAS_ORDERS'
      );
    }

    // 5. Xóa khỏi Database
    await prisma.combo.delete({
      where: { id: comboId },
    });

    return apiResponse(
      true,
      { id: comboId, name: existing.name },
      `Đã xóa combo '${existing.name}' thành công!`,
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
