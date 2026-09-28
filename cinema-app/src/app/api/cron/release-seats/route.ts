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

    // Quét toàn bộ bảng seats giải phóng các ghế giữ chỗ hết hạn
    const updateResult = await prisma.seat.updateMany({
      where: {
        status: 'RESERVED',
        reservedUntil: {
          lt: now,
        },
      },
      data: {
        status: 'EMPTY',
        reservedUntil: null,
      },
    });

    const responseData: ReleaseSeatsCronResponseData = {
      released_count: updateResult.count,
      scanned_at: now.toISOString(),
    };

    return apiResponse<ReleaseSeatsCronResponseData>(
      true,
      responseData,
      `Cron job hoàn tất: Đã quét và giải phóng ${updateResult.count} ghế hết hạn giữ chỗ về trạng thái EMPTY.`,
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
