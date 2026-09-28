import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

/**
 * Interface cấu trúc dữ liệu Combo trả về cho Frontend
 */
export interface ComboResponseItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  stock_quantity: number;
  stockQuantity: number;
  status: 'ACTIVE' | 'INACTIVE';
  is_available: boolean;
  isAvailable: boolean;
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
}

// Zod Schema cho dữ liệu tạo Combo mới (POST /api/combos)
const createComboSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Tên combo không được để trống')
      .max(100, 'Tên combo không được vượt quá 100 ký tự'),
    description: z.string().trim().nullable().optional(),
    price: z.coerce
      .number()
      .positive('Giá combo phải lớn hơn 0'),
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
      .optional()
      .default('ACTIVE'),
    image: z.string().trim().nullable().optional(),
  })
  .refine(
    data => data.stock_quantity !== undefined || data.stock !== undefined,
    {
      message: 'Vui lòng cung cấp số lượng tồn kho (stock_quantity hoặc stock)',
      path: ['stock_quantity'],
    }
  );

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
 * GET /api/combos
 * 
 * Lấy danh sách combo bắp nước:
 * - Nếu là Client (Khách hàng thông thường): CHỈ trả về combo có status = 'ACTIVE' và stock > 0.
 * - Nếu là Admin: Trả về toàn bộ danh sách combo (kèm lọc theo trạng thái nếu có query param ?status=...).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const headerRole = request.headers.get('x-user-role');
    const isAdmin =
      session?.user?.role === 'ADMIN' ||
      (process.env.NODE_ENV === 'development' && headerRole === 'ADMIN');

    const searchParams = request.nextUrl.searchParams;
    const forceClientMode = searchParams.get('client') === 'true';
    const statusQuery = searchParams.get('status')?.toUpperCase();

    // Xây dựng điều kiện lọc (where clause)
    let whereClause: {
      status?: 'ACTIVE' | 'INACTIVE';
      stock?: { gt: number };
    } = {};

    if (!isAdmin || forceClientMode) {
      // Yêu cầu: Khách hàng chỉ xem được combo ACTIVE và stock_quantity > 0
      whereClause = {
        status: 'ACTIVE',
        stock: { gt: 0 },
      };
    } else {
      // Admin có thể lọc theo status hoặc xem toàn bộ
      if (statusQuery === 'ACTIVE' || statusQuery === 'INACTIVE') {
        whereClause.status = statusQuery;
      }
    }

    const combos = await prisma.combo.findMany({
      where: whereClause,
      orderBy: [
        { status: 'asc' }, // ACTIVE lên trước
        { price: 'asc' },
      ],
    });

    const data: ComboResponseItem[] = combos.map(c => {
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
    });

    return apiResponse(
      true,
      data,
      `Lấy danh sách combo thành công (${data.length} combo)`,
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
 * POST /api/combos
 * 
 * Tạo combo bắp nước mới:
 * - Ràng buộc: Bắt buộc kiểm tra session.user.role === 'ADMIN'.
 * - Payload nhận vào: name, description, price, stock_quantity, status (ACTIVE/INACTIVE), image (tuỳ chọn).
 * - Validate dữ liệu bằng Zod.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Kiểm tra quyền ADMIN
    await verifyAdminRole(request);

    // 2. Parse JSON body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu yêu cầu không hợp lệ (không thể parse JSON)', 'INVALID_JSON');
    }

    // 3. Validate dữ liệu với Zod
    const parsed = createComboSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu tạo combo không hợp lệ';
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

    const finalStock = stock_quantity ?? stock ?? 0;
    const finalStatus: 'ACTIVE' | 'INACTIVE' =
      status.toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    // 4. Lưu combo mới vào Database
    const newCombo = await prisma.combo.create({
      data: {
        name,
        description: description || null,
        price,
        stock: finalStock,
        status: finalStatus,
        image: image || null,
      },
    });

    const priceNum = Number(newCombo.price);
    const isAvail = newCombo.status === 'ACTIVE' && newCombo.stock > 0;

    const responseItem: ComboResponseItem = {
      id: newCombo.id,
      name: newCombo.name,
      description: newCombo.description,
      price: priceNum,
      image: newCombo.image,
      stock: newCombo.stock,
      stock_quantity: newCombo.stock,
      stockQuantity: newCombo.stock,
      status: newCombo.status,
      is_available: isAvail,
      isAvailable: isAvail,
      created_at: newCombo.createdAt.toISOString(),
      createdAt: newCombo.createdAt.toISOString(),
      updated_at: newCombo.updatedAt.toISOString(),
      updatedAt: newCombo.updatedAt.toISOString(),
    };

    return apiResponse(
      true,
      responseItem,
      `Tạo combo '${newCombo.name}' thành công!`,
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
