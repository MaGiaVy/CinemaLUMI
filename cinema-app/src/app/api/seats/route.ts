import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export interface SeatResponseItem {
  id: number;
  screeningId: number | null;
  room: string | null;
  row: string;
  number: number;
  code: string;
  type: 'STANDARD' | 'VIP' | 'COUPLE';
  status: 'EMPTY' | 'RESERVED' | 'OCCUPIED';
  reservedUntil: Date | null;
}

export interface SeatsApiResponseData {
  screening: {
    id: number;
    room: string;
    movieTitle: string;
  };
  stats: {
    total: number;
    empty: number;
    reserved: number;
    occupied: number;
    released_expired: number;
  };
  seats: SeatResponseItem[];
}

/**
 * GET /api/seats?screening_id=[id]
 * 
 * Lấy danh sách 50 ghế của một suất chiếu theo cơ chế Lazy Evaluation (Đánh giá lười):
 * 1. Nhận query parameter `screening_id`.
 * 2. Tìm tất cả ghế đang có status === 'RESERVED' nhưng reserved_until < NOW.
 *    Tự động cập nhật về status = 'EMPTY' và reserved_until = null.
 * 3. Sau khi dọn rác xong, lấy danh sách ghế (sắp xếp theo hàng và số ghế A1 -> E10).
 * 4. Trả về cấu trúc chuẩn theo CODE_STANDARDS_BEST_PRACTICES.md (Không dùng any).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const screeningIdParam = searchParams.get('screening_id');

    // 1. Kiểm tra tham số đầu vào
    if (!screeningIdParam || screeningIdParam.trim() === '') {
      throw new AppError(
        400,
        'Query parameter screening_id là bắt buộc',
        'MISSING_SCREENING_ID'
      );
    }

    const screeningId = parseInt(screeningIdParam, 10);
    if (isNaN(screeningId) || screeningId <= 0) {
      throw new AppError(
        400,
        'Mã screening_id phải là số nguyên dương hợp lệ',
        'INVALID_SCREENING_ID'
      );
    }

    // 2. Kiểm tra suất chiếu có tồn tại không
    const screening = await prisma.screening.findUnique({
      where: { id: screeningId },
      select: {
        id: true,
        room: true,
        movie: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!screening) {
      throw new AppError(
        404,
        `Không tìm thấy suất chiếu với mã id ${screeningId}`,
        'SCREENING_NOT_FOUND'
      );
    }

    // 3. LAZY EVALUATION (Đánh giá lười): Tự động giải phóng các ghế giữ chỗ đã hết hạn
    const now = new Date();
    const cleanResult = await prisma.seat.updateMany({
      where: {
        screeningId,
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

    // 4. Lấy danh sách ghế đã được cập nhật sạch sẽ (sắp xếp theo thứ tự hàng A-E, cột 1-10)
    let rawSeats = await prisma.seat.findMany({
      where: {
        screeningId,
      },
      orderBy: [
        { row: 'asc' },
        { number: 'asc' },
      ],
      select: {
        id: true,
        screeningId: true,
        room: true,
        row: true,
        number: true,
        code: true,
        type: true,
        status: true,
        reservedUntil: true,
      },
    });

    // AUTO-HEALING: Nếu suất chiếu bị thiếu ghế (chỉ có 0, 1 hoặc 2 ghế), tự động bù đủ 50 ghế (A1 -> E10)
    if (rawSeats.length < 50) {
      const existingCodes = new Set(rawSeats.map(s => s.code));
      const seatRows = ['A', 'B', 'C', 'D', 'E'];
      const missingSeats = [];

      for (const row of seatRows) {
        for (let num = 1; num <= 10; num++) {
          const code = `${row}${num}`;
          if (!existingCodes.has(code)) {
            missingSeats.push({
              screeningId,
              room: screening.room || 'Cinema 01',
              row,
              number: num,
              code,
              type: (row === 'D' ? 'VIP' : row === 'E' ? 'COUPLE' : 'STANDARD') as 'STANDARD' | 'VIP' | 'COUPLE',
              status: 'EMPTY' as const,
            });
          }
        }
      }

      if (missingSeats.length > 0) {
        await prisma.seat.createMany({
          data: missingSeats,
        });

        // Tải lại danh sách đầy đủ sau khi bổ sung
        rawSeats = await prisma.seat.findMany({
          where: { screeningId },
          orderBy: [{ row: 'asc' }, { number: 'asc' }],
          select: {
            id: true,
            screeningId: true,
            room: true,
            row: true,
            number: true,
            code: true,
            type: true,
            status: true,
            reservedUntil: true,
          },
        });
      }
    }

    // Định kiểu dữ liệu rõ ràng, đảm bảo type safety 100%
    const seats: SeatResponseItem[] = rawSeats.map(s => ({
      id: s.id,
      screeningId: s.screeningId,
      room: s.room,
      row: s.row,
      number: s.number,
      code: s.code,
      type: s.type as 'STANDARD' | 'VIP' | 'COUPLE',
      status: s.status as 'EMPTY' | 'RESERVED' | 'OCCUPIED',
      reservedUntil: s.reservedUntil,
    }));

    // Tính toán thống kê ghế
    const total = seats.length;
    const empty = seats.filter(s => s.status === 'EMPTY').length;
    const reserved = seats.filter(s => s.status === 'RESERVED').length;
    const occupied = seats.filter(s => s.status === 'OCCUPIED').length;

    const responseData: SeatsApiResponseData = {
      screening: {
        id: screening.id,
        room: screening.room,
        movieTitle: screening.movie.title,
      },
      stats: {
        total,
        empty,
        reserved,
        occupied,
        released_expired: cleanResult.count,
      },
      seats,
    };

    return apiResponse<SeatsApiResponseData>(
      true,
      responseData,
      cleanResult.count > 0
        ? `Lấy danh sách ghế thành công (Đã tự động giải phóng ${cleanResult.count} ghế hết hạn giữ chỗ).`
        : 'Lấy danh sách ghế thành công.',
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
