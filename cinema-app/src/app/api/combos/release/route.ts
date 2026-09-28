import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export interface ReleaseCombosResponseData {
  released_reservations_count: number;
  restored_stock_total: number;
  released_at: string;
}

// Zod Schema cho POST /api/combos/release
const releaseCombosSchema = z
  .object({
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
          quantity: z.coerce.number().int().positive(),
        })
      )
      .optional(),
  })
  .refine(
    data =>
      Boolean(
        (data.reservation_ids && data.reservation_ids.length > 0) ||
        (data.reservationIds && data.reservationIds.length > 0) ||
        (data.ids && data.ids.length > 0) ||
        (data.combo_ids && data.combo_ids.length > 0) ||
        (data.comboIds && data.comboIds.length > 0) ||
        (data.combo_items && data.combo_items.length > 0)
      ),
    {
      message: 'Vui lòng cung cấp danh sách ID combo hoặc mã bản ghi giữ chỗ cần giải phóng',
      path: ['reservation_ids'],
    }
  );

/**
 * POST /api/combos/release [Internal]
 * 
 * Hủy giữ chỗ và hoàn trả tồn kho bắp nước (khi khách hủy chọn món hoặc rời màn hình thanh toán):
 * - Nhận ID của các combo/reservation đã reserve.
 * - Dùng prisma.$transaction cộng trả lại số lượng vào stock_quantity của combo.
 * - Cập nhật trạng thái bản ghi thành 'RELEASED'.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const parsed = releaseCombosSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu giải phóng combo không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    const {
      reservation_ids,
      reservationIds,
      ids,
      combo_ids,
      comboIds,
      combo_items,
    } = parsed.data;

    const targetReservationIds = reservation_ids || reservationIds || ids || [];
    const targetComboIds = combo_ids || comboIds || [];

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      let releasedCount = 0;
      let restoredStockTotal = 0;

      // 1. Trường hợp giải phóng theo reservation_ids
      if (targetReservationIds.length > 0) {
        const reservations = await tx.comboReservation.findMany({
          where: {
            id: { in: targetReservationIds },
            status: 'RESERVED',
          },
        });

        for (const res of reservations) {
          // Cộng trả lại tồn kho
          await tx.combo.update({
            where: { id: res.comboId },
            data: {
              stock: { increment: res.quantity },
            },
          });

          // Cập nhật trạng thái sang RELEASED
          await tx.comboReservation.update({
            where: { id: res.id },
            data: {
              status: 'RELEASED',
            },
          });

          releasedCount++;
          restoredStockTotal += res.quantity;
        }
      }
      // 2. Trường hợp giải phóng theo combo_items cụ thể (combo_id + quantity)
      else if (combo_items && combo_items.length > 0) {
        for (const item of combo_items) {
          const cId = (item.combo_id || item.comboId)!;
          const qty = item.quantity;

          // Cộng trả lại tồn kho
          await tx.combo.update({
            where: { id: cId },
            data: {
              stock: { increment: qty },
            },
          });

          // Đánh dấu bản ghi reservation gần nhất là RELEASED
          const recentReservation = await tx.comboReservation.findFirst({
            where: {
              comboId: cId,
              status: 'RESERVED',
            },
            orderBy: { createdAt: 'desc' },
          });

          if (recentReservation) {
            await tx.comboReservation.update({
              where: { id: recentReservation.id },
              data: { status: 'RELEASED' },
            });
            releasedCount++;
          }

          restoredStockTotal += qty;
        }
      }
      // 3. Trường hợp giải phóng theo danh sách combo_ids (tìm các reservation đang RESERVED của combo này)
      else if (targetComboIds.length > 0) {
        const activeReservations = await tx.comboReservation.findMany({
          where: {
            comboId: { in: targetComboIds },
            status: 'RESERVED',
          },
        });

        for (const res of activeReservations) {
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
