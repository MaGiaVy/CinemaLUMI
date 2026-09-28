import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export interface ReleaseCombosCronResponseData {
  released_reservations_count: number;
  restored_stock_total: number;
  scanned_at: string;
}

/**
 * GET /api/cron/release-combos
 * 
 * Cron Job tự động quét định kỳ:
 * - Tìm tất cả các combo bị giữ quá 10 phút (reserved_until < NOW) mà chưa thanh toán (status = 'RESERVED').
 * - Tiến hành cộng trả lại số lượng vào tồn kho (stock) của từng combo tương ứng.
 * - Cập nhật trạng thái bản ghi giữ chỗ thành 'RELEASED'.
 */
export async function GET(request: NextRequest) {
  try {
    // Tùy chọn bảo mật: Nếu hệ thống có cấu hình CRON_SECRET thì kiểm tra Authorization header
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return apiResponse(
        false,
        undefined,
        'Yêu cầu không được phép (Unauthorized Cron Request)',
        401,
        'UNAUTHORIZED'
      );
    }

    const now = new Date();

    // Thực hiện trong một transaction để bảo toàn dữ liệu
    const result = await prisma.$transaction(async (tx) => {
      // 1. Tìm tất cả các bản ghi giữ chỗ combo đã hết hạn (> 10 phút)
      const expiredReservations = await tx.comboReservation.findMany({
        where: {
          status: 'RESERVED',
          reservedUntil: {
            lt: now,
          },
        },
      });

      let restoredStockTotal = 0;

      // 2. Hoàn trả tồn kho cho từng combo
      for (const res of expiredReservations) {
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

        restoredStockTotal += res.quantity;
      }

      return {
        released_reservations_count: expiredReservations.length,
        restored_stock_total: restoredStockTotal,
        scanned_at: now.toISOString(),
      };
    });

    return apiResponse<ReleaseCombosCronResponseData>(
      true,
      result,
      `Quét hoàn tất: Đã giải phóng ${result.released_reservations_count} bản ghi và hoàn trả ${result.restored_stock_total} phần combo bắp nước về kho.`,
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
