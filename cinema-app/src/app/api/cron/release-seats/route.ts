import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface ReleaseSeatsCronResponseData {
  released_count: number;
  scanned_at: string;
}

/**
 * GET /api/cron/release-seats
 * 
 * Cron Job tự động:
 * - Quét TOÀN BỘ bảng Seats trong Database.
 * - Tìm tất cả các ghế đang có status === 'RESERVED' nhưng thời gian reserved_until < NOW (hết hạn giữ chỗ).
 * - Cập nhật đồng loạt các ghế đó về status = 'EMPTY' và reserved_until = null.
 * - Trả về số lượng ghế đã được giải phóng và thời điểm quét.
 */
export async function GET(request: NextRequest) {
  try {
    // Tùy chọn bảo mật: Nếu hệ thống có cấu hình CRON_SECRET thì kiểm tra Authorization header
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return apiResponse(
        false,
        undefined,
        'Yêu cầu không được phép (Unauthorized Cron Request)',
        401,
        'UNAUTHORIZED'
      );
    }

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    let releasedSeatsCount = 0;
    let expiredPaymentsCount = 0;
    let refundedVouchersCount = 0;

    await prisma.$transaction(async (tx) => {
      // 1. Quét các đơn thanh toán Pending đã quá hạn 10 phút giữ chỗ
      const expiredPayments = await tx.payment.findMany({
        where: {
          status: 'Pending',
          createdAt: { lt: tenMinutesAgo },
        },
        include: {
          orderCombos: true,
        },
      });

      expiredPaymentsCount = expiredPayments.length;

      for (const payment of expiredPayments) {
        // Tự động hoàn lại lượt dùng của voucher nếu thanh toán thất bại/hết hạn giữ ghế (SRS BR)
        if (payment.couponCode && payment.couponReserved) {
          await tx.coupon.updateMany({
            where: {
              code: payment.couponCode,
              usedCount: { gt: 0 },
            },
            data: {
              usedCount: { decrement: 1 },
            },
          });
          refundedVouchersCount++;
        }

        // Đánh dấu đơn Pending hết hạn thành Failed
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'Failed',
            couponReserved: false,
          },
        });

        // Giải phóng tồn kho combo đã giữ nếu có
        if (payment.orderCombos && payment.orderCombos.length > 0) {
          for (const oc of payment.orderCombos) {
            await tx.comboReservation.updateMany({
              where: {
                comboId: oc.comboId,
                status: 'RESERVED',
              },
              data: {
                status: 'RELEASED',
              },
            });
          }
        }

        // Giải phóng ghế đã gắn với đơn thanh toán hết hạn
        await tx.seat.updateMany({
          where: {
            holdPaymentId: payment.id,
            status: 'RESERVED',
          },
          data: {
            status: 'EMPTY',
            reservedUntil: null,
            holdUserId: null,
            holdPaymentId: null,
          },
        });
      }

      // 2. Quét toàn bộ các ghế đang RESERVED nhưng thời gian reserved_until < NOW
      const seatUpdate = await tx.seat.updateMany({
        where: {
          status: 'RESERVED',
          reservedUntil: {
            lt: now,
          },
        },
        data: {
          status: 'EMPTY',
          reservedUntil: null,
          holdUserId: null,
          holdPaymentId: null,
        },
      });

      releasedSeatsCount = seatUpdate.count;
    });

    const responseData: ReleaseSeatsCronResponseData = {
      released_count: releasedSeatsCount,
      scanned_at: now.toISOString(),
    };

    return apiResponse<ReleaseSeatsCronResponseData>(
      true,
      responseData,
      `Cron job hoàn tất: Giải phóng ${releasedSeatsCount} ghế, hủy ${expiredPaymentsCount} đơn hết hạn, hoàn lại ${refundedVouchersCount} lượt voucher.`,
      200
    );
  } catch (error: unknown) {
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
