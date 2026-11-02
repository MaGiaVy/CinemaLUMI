import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export interface ReleaseCombosResponseData {
  released_reservations_count: number;
  restored_stock_total: number;
  released_at: string;
}

// Zod Schema cho POST /api/combos/release
// TUYỆT ĐỐI KHÔNG nhận số lượng tùy tiện từ body để tự ý increment kho.
const releaseCombosSchema = z.object({
  reservation_ids: z.array(z.coerce.number().int().positive()).optional(),
  reservationIds: z.array(z.coerce.number().int().positive()).optional(),
  ids: z.array(z.coerce.number().int().positive()).optional(),
  combo_ids: z.array(z.coerce.number().int().positive()).optional(),
  comboIds: z.array(z.coerce.number().int().positive()).optional(),
  combo_items: z
    .array(
      z.object({
        combo_id: z.coerce.number().int().positive().optional(),
        comboId: z.coerce.number().int().positive().optional(),
        id: z.coerce.number().int().positive().optional(),
        // Trường quantity nếu có từ client sẽ bị bỏ qua hoàn toàn để bảo vệ tồn kho
        quantity: z.any().optional(),
      })
    )
    .optional(),
});

/**
 * POST /api/combos/release [Internal]
 * 
 * Hủy giữ chỗ và hoàn trả tồn kho bắp nước (khi khách hủy chọn món hoặc rời màn hình thanh toán):
 * - Bắt buộc người dùng đăng nhập (requireAuth).
 * - Chỉ giải phóng và hoàn lại tồn kho đối với các bản ghi comboReservation thực tế đang ở trạng thái 'RESERVED' của người dùng (hoặc do cron dọn dẹp).
 * - TUYỆT ĐỐI KHÔNG nhận số lượng tùy tiện từ body để tự ý increment kho.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Bắt buộc người dùng đã đăng nhập
    const user = await requireAuth();

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      // Cho phép body rỗng nếu muốn giải phóng tất cả các giữ chỗ hiện tại của user
      body = {};
    }

    const parsed = releaseCombosSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu giải phóng combo không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    const targetReservationIds = [
      ...(parsed.data.reservation_ids || []),
      ...(parsed.data.reservationIds || []),
      ...(parsed.data.ids || []),
    ];

    const comboItemsIds = (parsed.data.combo_items || [])
      .map(item => item.combo_id ?? item.comboId ?? item.id)
      .filter((id): id is number => typeof id === 'number' && id > 0);

    const targetComboIds = [
      ...(parsed.data.combo_ids || []),
      ...(parsed.data.comboIds || []),
      ...comboItemsIds,
    ];

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      let releasedCount = 0;
      let restoredStockTotal = 0;

      // Điều kiện lọc theo người dùng: Khách chỉ giải phóng được reservation của mình
      const userCondition = (user.role === 'ADMIN' || user.role === 'STAFF')
        ? {}
        : {
            OR: [
              { userId: user.id },
              { userId: null },
            ],
          };

      let reservations: Array<{ id: number; comboId: number; quantity: number }> = [];

      // 1. Nếu có danh sách reservation_ids
      if (targetReservationIds.length > 0) {
        reservations = await tx.comboReservation.findMany({
          where: {
            id: { in: targetReservationIds },
            status: 'RESERVED',
            ...userCondition,
          },
          select: { id: true, comboId: true, quantity: true },
        });
      }
      // 2. Nếu có danh sách combo_ids
      else if (targetComboIds.length > 0) {
        reservations = await tx.comboReservation.findMany({
          where: {
            comboId: { in: targetComboIds },
            status: 'RESERVED',
            ...userCondition,
          },
          select: { id: true, comboId: true, quantity: true },
        });
      }
      // 3. Nếu không truyền ID cụ thể, giải phóng tất cả reservation đang RESERVED của user
      else {
        reservations = await tx.comboReservation.findMany({
          where: {
            status: 'RESERVED',
            userId: user.id,
          },
          select: { id: true, comboId: true, quantity: true },
        });
      }

      // 4. Giải phóng và hoàn trả tồn kho chỉ dựa trên số lượng thực tế đã ghi nhận trong CSDL
      for (const res of reservations) {
        await tx.combo.update({
          where: { id: res.comboId },
          data: {
            stock: { increment: res.quantity },
          },
        });

        await tx.comboReservation.update({
          where: { id: res.id },
          data: {
            status: 'RELEASED',
          },
        });

        releasedCount++;
        restoredStockTotal += res.quantity;
      }

      return {
        released_reservations_count: releasedCount,
        restored_stock_total: restoredStockTotal,
        released_at: now.toISOString(),
      };
    });

    return apiResponse<ReleaseCombosResponseData>(
      true,
      result,
      `Đã giải phóng và hoàn trả ${result.restored_stock_total} phần tồn kho combo thành công!`,
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
