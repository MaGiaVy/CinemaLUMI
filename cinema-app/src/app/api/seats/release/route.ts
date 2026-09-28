import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface ReleaseSeatsPayload {
  seat_ids: number[];
}

interface ReleaseSeatsResponseData {
  released_count: number;
  seat_ids: number[];
}

/**
 * POST /api/seats/release
 * 
 * Hủy giữ chỗ các ghế (người dùng bấm bỏ chọn hoặc rời khỏi trang thanh toán):
 * - Nhận payload: { seat_ids: number[] }
 * - Cập nhật các ghế trong danh sách về status = 'EMPTY' và reserved_until = null.
 * - Chỉ hủy những ghế đang ở trạng thái 'RESERVED' (không hủy các ghế đã 'OCCUPIED' / đã mua vé).
 */
export async function POST(request: NextRequest) {
  try {
    let body: ReleaseSeatsPayload;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const { seat_ids } = body;

    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      throw new AppError(
        400,
        'Trường seat_ids phải là một mảng chứa ít nhất một mã ID ghế',
        'INVALID_SEAT_IDS'
      );
    }

    const validSeatIds = seat_ids.every(id => typeof id === 'number' && id > 0);
    if (!validSeatIds) {
      throw new AppError(
        400,
        'Tất cả phần tử trong mảng seat_ids phải là số nguyên dương hợp lệ',
        'INVALID_SEAT_ID_ELEMENT'
      );
    }

    // Cập nhật các ghế đang RESERVED về trạng thái EMPTY và xóa thời gian giữ chỗ
    const updateResult = await prisma.seat.updateMany({
      where: {
        id: { in: seat_ids },
        status: 'RESERVED', // Chỉ nhả những ghế đang giữ chỗ tạm thời
      },
      data: {
        status: 'EMPTY',
        reservedUntil: null,
      },
    });

    const responseData: ReleaseSeatsResponseData = {
      released_count: updateResult.count,
      seat_ids,
    };

    return apiResponse<ReleaseSeatsResponseData>(
      true,
      responseData,
      `Đã giải phóng thành công ${updateResult.count} ghế về trạng thái trống (EMPTY).`,
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
