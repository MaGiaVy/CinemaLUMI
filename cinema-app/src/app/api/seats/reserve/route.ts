import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface ReserveSeatsPayload {
  screening_id: number;
  seat_ids: number[];
}

interface ReservedSeatInfo {
  id: number;
  code: string;
  row: string;
  number: number;
  type: string;
}

interface ReserveSeatsResponseData {
  screening_id: number;
  reserved_count: number;
  reserved_until: string;
  hold_duration_minutes: number;
  seats: ReservedSeatInfo[];
}

/**
 * POST /api/seats/reserve
 * 
 * Giữ chỗ tạm thời các ghế được chọn trong 10 phút:
 * - Nhận payload: { screening_id, seat_ids: number[] }
 * - Dùng prisma.$transaction:
 *   1. Kiểm tra dọn dẹp các ghế hết hạn giữ chỗ trước.
 *   2. Kiểm tra nếu TẤT CẢ ghế trong mảng đang ở trạng thái EMPTY.
 *   3. Nếu có bất kỳ ghế nào đã bị đặt hoặc không khả dụng -> throw AppError 400.
 *   4. Nếu tất cả đều hợp lệ -> Cập nhật status = 'RESERVED' và reserved_until = NOW + 10 phút.
 * - Tuân thủ nghiêm ngặt CODE_STANDARDS_BEST_PRACTICES.md (Không dùng any, Centralized Error Handling).
 */
export async function POST(request: NextRequest) {
  try {
    let body: ReserveSeatsPayload;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const { screening_id, seat_ids } = body;

    // 1. Kiểm tra đầu vào
    if (!screening_id || typeof screening_id !== 'number' || screening_id <= 0) {
      throw new AppError(
        400,
        'Trường screening_id là bắt buộc và phải là số nguyên dương',
        'INVALID_SCREENING_ID'
      );
    }

    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      throw new AppError(
        400,
        'Trường seat_ids phải là một mảng chứa ít nhất một mã ID ghế',
        'INVALID_SEAT_IDS'
      );
    }

    // Kiểm tra các phần tử trong seat_ids đều là số dương
    const validSeatIds = seat_ids.every(id => typeof id === 'number' && id > 0);
    if (!validSeatIds) {
      throw new AppError(
        400,
        'Tất cả phần tử trong mảng seat_ids phải là số nguyên dương hợp lệ',
        'INVALID_SEAT_ID_ELEMENT'
      );
    }

    // Giới hạn số ghế tối đa mỗi lần giữ chỗ (ví dụ: tối đa 8 ghế)
    const MAX_SEATS_PER_HOLD = 8;
    if (seat_ids.length > MAX_SEATS_PER_HOLD) {
      throw new AppError(
        400,
        `Bạn chỉ có thể giữ chỗ tối đa ${MAX_SEATS_PER_HOLD} ghế trong một lần đặt`,
        'MAX_SEATS_EXCEEDED'
      );
    }

    // 2. Thực thi giao dịch nguyên tử (Atomic Transaction)
    const HOLD_MINUTES = 10;
    const now = new Date();
    const reservedUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    const reservationResult = await prisma.$transaction(async (tx) => {
      // 2.1 Giải phóng trước các ghế hết hạn giữ chỗ trong suất chiếu này
      await tx.seat.updateMany({
        where: {
          screeningId: screening_id,
          id: { in: seat_ids },
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

      // 2.2 Lấy thông tin các ghế cần giữ chỗ
      const seats = await tx.seat.findMany({
        where: {
          id: { in: seat_ids },
          screeningId: screening_id,
        },
        select: {
          id: true,
          code: true,
          row: true,
          number: true,
          type: true,
          status: true,
        },
      });

      // 2.3 Kiểm tra tất cả ghế có tồn tại trong suất chiếu không
      if (seats.length !== seat_ids.length) {
        const foundSeatIds = new Set(seats.map(s => s.id));
        const missingSeatIds = seat_ids.filter(id => !foundSeatIds.has(id));
        throw new AppError(
          404,
          `Một số ghế không tồn tại trong suất chiếu này (ID: ${missingSeatIds.join(', ')})`,
          'SEAT_NOT_FOUND'
        );
      }

      // 2.4 KIỂM TRA ĐIỀU KIỆN CỐT LÕI: Nếu có bất kỳ ghế nào đã bị đặt (khác 'EMPTY') -> throw AppError 400
      const unavailableSeats = seats.filter(s => s.status !== 'EMPTY');
      if (unavailableSeats.length > 0) {
        const conflictCodes = unavailableSeats.map(s => s.code).join(', ');
        throw new AppError(
          400,
          `[E-03] Ghế [${conflictCodes}] hiện đã có người giữ chỗ hoặc đã được thanh toán. Vui lòng chọn ghế khác.`,
          'SEAT_ALREADY_RESERVED'
        );
      }

      // 2.5 Cập nhật tất cả các ghế thành 'RESERVED' và gán thời gian giữ chỗ
      await tx.seat.updateMany({
        where: {
          id: { in: seat_ids },
        },
        data: {
          status: 'RESERVED',
          reservedUntil,
        },
      });

      const reservedSeatList: ReservedSeatInfo[] = seats.map(s => ({
        id: s.id,
        code: s.code,
        row: s.row,
        number: s.number,
        type: s.type,
      }));

      return {
        screening_id,
        reserved_count: seats.length,
        reserved_until: reservedUntil.toISOString(),
        hold_duration_minutes: HOLD_MINUTES,
        seats: reservedSeatList,
      };
    });

    return apiResponse<ReserveSeatsResponseData>(
      true,
      reservationResult,
      `Đã giữ chỗ thành công ${reservationResult.reserved_count} ghế trong ${HOLD_MINUTES} phút. Vui lòng hoàn tất thanh toán trước thời gian quy định.`,
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
