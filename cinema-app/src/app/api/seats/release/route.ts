import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

interface ReleaseSeatsPayload {
  seat_ids: number[];
}

interface ReleaseSeatsResponseData {
  released_count: number;
  seat_ids: number[];
}

function parseSeatIds(raw: unknown): number[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(x => Number(x)).filter(n => !isNaN(n) && n > 0);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(x => Number(x)).filter(n => !isNaN(n) && n > 0);
      }
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * POST /api/seats/release
 * 
 * Hủy giữ chỗ các ghế (người dùng bấm bỏ chọn hoặc rời khỏi trang thanh toán):
 * - Bắt buộc xác thực người dùng.
 * - Nhận payload: { seat_ids: number[] }
 * - Chống lỗ hổng IDOR: CUSTOMER chỉ được giải phóng ghế thuộc về đơn Pending của chính mình.
 * - Cập nhật các ghế trong danh sách về status = 'EMPTY' và reserved_until = null.
 * - Chỉ hủy những ghế đang ở trạng thái 'RESERVED' (không hủy các ghế đã 'OCCUPIED' / đã mua vé).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

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

    let targetSeatIdsToRelease = seat_ids;

    // Chống lỗ hổng IDOR khi role là CUSTOMER
    if (user.role === 'CUSTOMER') {
      // 1. Tìm các đơn thanh toán Pending của chính user.id
      const userPendingPayments = await prisma.payment.findMany({
        where: {
          userId: user.id,
          status: 'Pending',
        },
        orderBy: { createdAt: 'desc' },
      });

      const userSeatIds = new Set<number>();
      const userMatchedPaymentIds: number[] = [];

      for (const p of userPendingPayments) {
        const pSeatIds = parseSeatIds(p.seatIds);
        let hasMatch = false;
        for (const sid of pSeatIds) {
          userSeatIds.add(sid);
          if (seat_ids.includes(sid)) {
            hasMatch = true;
          }
        }
        if (hasMatch) {
          userMatchedPaymentIds.push(p.id);
        }
      }

      // 2. Chặn IDOR: Kiểm tra xem có ghế nào thuộc đơn Pending của người dùng KHÁC không
      const otherUserPendingPayments = await prisma.payment.findMany({
        where: {
          userId: { not: user.id },
          status: 'Pending',
        },
        select: {
          id: true,
          seatIds: true,
        },
      });

      const otherUserSeatIds = new Set<number>();
      for (const p of otherUserPendingPayments) {
        const sids = parseSeatIds(p.seatIds);
        for (const sid of sids) {
          otherUserSeatIds.add(sid);
        }
      }

      const foreignSeats = seat_ids.filter(id => otherUserSeatIds.has(id));
      if (foreignSeats.length > 0) {
        throw new AppError(
          403,
          'Bạn không có quyền giải phóng ghế đang được khách hàng khác giữ chỗ thanh toán',
          'FORBIDDEN_RELEASE_SEATS'
        );
      }

      // 3. Lọc ra các ghế thực sự thuộc về đơn Pending của chính user
      const ownedSeatIds = seat_ids.filter(id => userSeatIds.has(id));

      if (ownedSeatIds.length === 0) {
        throw new AppError(
          403,
          'Không tìm thấy phiên đặt vé hoặc đơn thanh toán hợp lệ chứa các ghế này để giải phóng',
          'FORBIDDEN_SEAT_RELEASE'
        );
      }

      targetSeatIdsToRelease = ownedSeatIds;

      // Hủy các đơn thanh toán Pending liên quan của chính user
      if (userMatchedPaymentIds.length > 0) {
        await prisma.payment.updateMany({
          where: { id: { in: userMatchedPaymentIds } },
          data: { status: 'Failed' },
        });
      }
    }

    // Cập nhật các ghế đang RESERVED về trạng thái EMPTY và xóa thời gian giữ chỗ
    const updateResult = await prisma.seat.updateMany({
      where: {
        id: { in: targetSeatIdsToRelease },
        status: 'RESERVED', // Chỉ nhả những ghế đang giữ chỗ tạm thời
      },
      data: {
        status: 'EMPTY',
        reservedUntil: null,
      },
    });

    const responseData: ReleaseSeatsResponseData = {
      released_count: updateResult.count,
      seat_ids: targetSeatIdsToRelease,
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
