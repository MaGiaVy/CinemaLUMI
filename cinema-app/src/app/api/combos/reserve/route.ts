import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export interface ReservedComboItemResult {
  reservation_id: number;
  reservationId: number;
  combo_id: number;
  comboId: number;
  name: string;
  quantity: number;
  unit_price: number;
  unitPrice: number;
  total_price: number;
  totalPrice: number;
  remaining_stock: number;
  remainingStock: number;
  status: string;
  reserved_until: string;
  reservedUntil: string;
}

export interface ReserveCombosResponseData {
  reserved_until: string;
  reservedUntil: string;
  hold_duration_minutes: number;
  total_items: number;
  total_amount: number;
  items: ReservedComboItemResult[];
}

// Zod Schema cho POST /api/combos/reserve
const reserveCombosSchema = z.object({
  combo_items: z
    .array(
      z.object({
        combo_id: z.coerce.number().int().positive('combo_id phải là số nguyên dương').optional(),
        comboId: z.coerce.number().int().positive('combo_id phải là số nguyên dương').optional(),
        id: z.coerce.number().int().positive('combo_id phải là số nguyên dương').optional(),
        quantity: z.coerce
          .number()
          .int('Số lượng phải là số nguyên')
          .positive('Số lượng đặt phải lớn hơn hoặc bằng 1'),
      }).refine(item => item.combo_id !== undefined || item.comboId !== undefined || item.id !== undefined, {
        message: 'Mỗi món bắp nước phải có combo_id',
      })
    )
    .min(1, 'Danh sách combo_items không được để trống'),
});

/**
 * POST /api/combos/reserve
 * 
 * Giữ tồn kho tạm thời cho các combo bắp nước khách đặt trong 10 phút:
 * - Nhận combo_items (gồm combo_id và quantity).
 * - Kiểm tra xem stock_quantity có đủ không.
 * - Nếu đủ, dùng prisma.$transaction trừ đi số lượng tồn kho và tạo bản ghi trạng thái RESERVED kèm reserved_until = NOW + 10 phút.
 * - Tích hợp Lazy Release: Tự động hoàn lại các combo đã hết hạn giữ chỗ trước khi kiểm tra kho.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const parsed = reserveCombosSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu giữ chỗ combo không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    // Chuẩn hóa danh sách món đặt và gộp các món trùng combo_id nếu có
    const normalizedItemsMap = new Map<number, number>();
    for (const item of parsed.data.combo_items) {
      const cId = (item.combo_id ?? item.comboId ?? item.id)!;
      const currentQty = normalizedItemsMap.get(cId) || 0;
      normalizedItemsMap.set(cId, currentQty + item.quantity);
    }

    const targetComboIds = Array.from(normalizedItemsMap.keys());
    const HOLD_MINUTES = 10;
    const now = new Date();
    const reservedUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    // Thực thi giao dịch nguyên tử (Atomic Transaction)
    const result = await prisma.$transaction(async (tx) => {
      // 1. LAZY RELEASE: Tự động hoàn trả tồn kho các reservation của các combo này đã hết hạn (> 10 phút)
      const expiredReservations = await tx.comboReservation.findMany({
        where: {
          comboId: { in: targetComboIds },
          status: 'RESERVED',
          reservedUntil: { lt: now },
        },
      });

      for (const exp of expiredReservations) {
        await tx.combo.update({
          where: { id: exp.comboId },
          data: {
            stock: { increment: exp.quantity },
          },
        });

        await tx.comboReservation.update({
          where: { id: exp.id },
          data: {
            status: 'RELEASED',
          },
        });
      }

      // 2. Lấy thông tin các combo trong kho
      const combos = await tx.combo.findMany({
        where: {
          id: { in: targetComboIds },
        },
      });

      // 3. Kiểm tra xem có combo nào không tồn tại không
      if (combos.length !== targetComboIds.length) {
        const foundIds = new Set(combos.map(c => c.id));
        const missingIds = targetComboIds.filter(id => !foundIds.has(id));
        throw new AppError(
          404,
          `Không tìm thấy combo bắp nước với mã ID: ${missingIds.join(', ')}`,
          'COMBO_NOT_FOUND'
        );
      }

      // 4. Kiểm tra trạng thái hoạt động và số lượng tồn kho
      for (const combo of combos) {
        if (combo.status !== 'ACTIVE') {
          throw new AppError(
            400,
            `Combo "${combo.name}" hiện đang ngừng kinh doanh, vui lòng chọn món khác.`,
            'COMBO_INACTIVE'
          );
        }

        const requestedQty = normalizedItemsMap.get(combo.id)!;
        if (combo.stock < requestedQty) {
          throw new AppError(
            400,
            `Combo "${combo.name}" chỉ còn lại ${combo.stock} phần trong kho, không đủ số lượng bạn yêu cầu (${requestedQty}).`,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      // 5. Nếu tất cả đều đủ hàng: Trừ tồn kho và Tạo bản ghi trạng thái RESERVED
      const reservedItems: ReservedComboItemResult[] = [];
      let totalAmount = 0;
      let totalItems = 0;

      for (const combo of combos) {
        const qty = normalizedItemsMap.get(combo.id)!;
        const unitPrice = Number(combo.price);
        const itemTotalPrice = unitPrice * qty;

        // Trừ tồn kho trong bảng Combo
        const updatedCombo = await tx.combo.update({
          where: { id: combo.id },
          data: {
            stock: { decrement: qty },
            reservedUntil: reservedUntil,
          },
        });

        // Tạo bản ghi trạng thái RESERVED kèm reserved_until = NOW + 10 phút
        const newReservation = await tx.comboReservation.create({
          data: {
            comboId: combo.id,
            quantity: qty,
            status: 'RESERVED',
            reservedUntil: reservedUntil,
          },
        });

        totalAmount += itemTotalPrice;
        totalItems += qty;

        reservedItems.push({
          reservation_id: newReservation.id,
          reservationId: newReservation.id,
          combo_id: combo.id,
          comboId: combo.id,
          name: combo.name,
          quantity: qty,
          unit_price: unitPrice,
          unitPrice: unitPrice,
          total_price: itemTotalPrice,
          totalPrice: itemTotalPrice,
          remaining_stock: updatedCombo.stock,
          remainingStock: updatedCombo.stock,
          status: newReservation.status,
          reserved_until: reservedUntil.toISOString(),
          reservedUntil: reservedUntil.toISOString(),
        });
      }

      return {
        reserved_until: reservedUntil.toISOString(),
        reservedUntil: reservedUntil.toISOString(),
        hold_duration_minutes: HOLD_MINUTES,
        total_items: totalItems,
        total_amount: totalAmount,
        items: reservedItems,
      };
    });

    return apiResponse<ReserveCombosResponseData>(
      true,
      result,
      `Giữ chỗ ${result.total_items} phần combo bắp nước thành công! Thời gian giữ: 10 phút.`,
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
