import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

export const dynamic = 'force-dynamic';

/**
 * GET /api/screenings
 * 
 * Lấy danh sách các suất chiếu trong hệ thống:
 * - Hỗ trợ query param `movie_id`: Lọc theo phim cụ thể.
 * - Hỗ trợ query param `date`: Lọc theo ngày chiếu (định dạng YYYY-MM-DD).
 * - Hỗ trợ query param `room_number`: Lọc theo số phòng chiếu (1 - 5).
 * - Sắp xếp theo startTime tăng dần (chronological order).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const movieIdParam = searchParams.get('movie_id');
    const dateParam = searchParams.get('date');
    const roomParam = searchParams.get('room_number');

    const whereClause: any = {};

    if (movieIdParam) {
      const movieId = parseInt(movieIdParam, 10);
      if (!isNaN(movieId)) {
        whereClause.movieId = movieId;
      }
    }

    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        whereClause.date = parsedDate;
      }
    }

    if (roomParam) {
      const roomNumber = parseInt(roomParam, 10);
      if (!isNaN(roomNumber)) {
        whereClause.roomNumber = roomNumber;
      }
    }

    const screenings = await prisma.screening.findMany({
      where: whereClause,
      orderBy: {
        startTime: 'asc',
      },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            poster: true,
            duration: true,
            ageRating: true,
            genre: true,
          },
        },
        _count: {
          select: {
            seats: true,
            tickets: true,
          },
        },
      },
    });

    return apiResponse(
      true,
      screenings,
      'Lấy danh sách suất chiếu thành công',
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

/**
 * POST /api/screenings
 * 
 * Tạo mới một suất chiếu và tự động khởi tạo 50 ghế (A1 đến E10):
 * - Payload: { movie_id, room_number, screening_date, screening_time, base_price }
 * - Validation cốt lõi: Kiểm tra trùng lịch chiếu trong cùng phòng chiếu.
 * - Transaction: Dùng prisma.$transaction tạo Screening và 50 bản ghi Seat trạng thái EMPTY.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      movie_id,
      room_number,
      screening_date,
      screening_time,
      base_price,
    } = body;

    // 1. Kiểm tra đầu vào bắt buộc
    if (!movie_id || !room_number || !screening_date || !screening_time) {
      return apiResponse(
        false,
        undefined,
        'Vui lòng điền đầy đủ các thông tin: movie_id, room_number, screening_date, screening_time',
        400
      );
    }

    const parsedMovieId = Number(movie_id);
    const parsedRoomNumber = Number(room_number);
    const parsedBasePrice = Number(base_price) || 120000;

    if (isNaN(parsedMovieId)) {
      return apiResponse(false, undefined, 'Mã phim (movie_id) không hợp lệ', 400);
    }

    // Kiểm tra room_number hợp lệ (từ 1 đến 5)
    if (isNaN(parsedRoomNumber) || parsedRoomNumber < 1 || parsedRoomNumber > 5) {
      return apiResponse(
        false,
        undefined,
        'Số phòng chiếu (room_number) phải từ 1 đến 5',
        400
      );
    }

    // 2. Kiểm tra bộ phim có tồn tại trong hệ thống không
    const movie = await prisma.movie.findUnique({
      where: { id: parsedMovieId },
    });

    if (!movie) {
      return apiResponse(false, undefined, 'Không tìm thấy bộ phim với movie_id đã cung cấp', 404);
    }

    // 3. Tính toán thời gian bắt đầu (startTime) và kết thúc (endTime)
    // screening_date: "2026-09-30" hoặc "2026-09-30T00:00:00.000Z"
    // screening_time: "19:30" hoặc "19:30:00"
    const dateStr = screening_date.split('T')[0];
    const timeStr = screening_time.includes(':') ? screening_time : `${screening_time}:00`;

    const startTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(startTime.getTime())) {
      return apiResponse(
        false,
        undefined,
        'Định dạng ngày (screening_date: YYYY-MM-DD) hoặc giờ chiếu (screening_time: HH:mm) không hợp lệ',
        400
      );
    }

    // Thời gian kết thúc = startTime + thời lượng phim + 15 phút dọn dẹp vệ sinh phòng chiếu
    const movieDurationMinutes = movie.duration || 120;
    const totalOccupiedMinutes = movieDurationMinutes + 15;
    const endTime = new Date(startTime.getTime() + totalOccupiedMinutes * 60 * 1000);
    const screeningDateOnly = new Date(dateStr);

    // 4. VALIDATION CỐT LÕI: Kiểm tra phòng chiếu không bị trùng lịch
    // Hai suất chiếu trong cùng phòng bị trùng khi:
    // (existing.startTime < new.endTime) AND (existing.endTime > new.startTime)
    const conflictingScreening = await prisma.screening.findFirst({
      where: {
        roomNumber: parsedRoomNumber,
        AND: [
          {
            startTime: {
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
      include: {
        movie: {
          select: {
            title: true,
          },
        },
      },
    });

    if (conflictingScreening) {
      const conflictStart = conflictingScreening.startTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const conflictEnd = conflictingScreening.endTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      return apiResponse(
        false,
        undefined,
        `Phòng chiếu ${parsedRoomNumber} đã có suất chiếu phim "${conflictingScreening.movie.title}" từ ${conflictStart} đến ${conflictEnd}. Vui lòng chọn khung giờ hoặc phòng khác.`,
        400
      );
    }

    // 5. TRANSACTION: Tạo Screening + tự động tạo 50 ghế (A1 đến E10) trạng thái EMPTY
    const newScreeningWithSeats = await prisma.$transaction(async (tx) => {
      // 5.1 Tạo bản ghi suất chiếu
      const screening = await tx.screening.create({
        data: {
          movieId: parsedMovieId,
          room: `Cinema 0${parsedRoomNumber}`,
          roomNumber: parsedRoomNumber,
          date: screeningDateOnly,
          startTime,
          endTime,
          price: parsedBasePrice,
          status: 'UPCOMING',
        },
      });

      // 5.2 Dùng vòng lặp tạo 50 ghế (Hàng A - E, Cột 1 - 10)
      const seatRows = ['A', 'B', 'C', 'D', 'E'];
      const seatsToCreate = [];

      for (const row of seatRows) {
        for (let num = 1; num <= 10; num++) {
          seatsToCreate.push({
            screeningId: screening.id,
            room: `Cinema 0${parsedRoomNumber}`,
            row,
            number: num,
            code: `${row}${num}`,
            type: 'STANDARD' as const,
            status: 'EMPTY' as const,
          });
        }
      }

      // Lưu 50 bản ghi ghế vào cơ sở dữ liệu
      await tx.seat.createMany({
        data: seatsToCreate,
      });

      // 5.3 Trả về suất chiếu vừa tạo kèm thông tin phim và số lượng ghế
      return tx.screening.findUnique({
        where: { id: screening.id },
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              poster: true,
              duration: true,
              ageRating: true,
            },
          },
          _count: {
            select: {
              seats: true,
            },
          },
        },
      });
    });

    return apiResponse(
      true,
      newScreeningWithSeats,
      `Tạo suất chiếu thành công! Đã tự động tạo 50 ghế (A1 đến E10) trạng thái EMPTY cho phòng Cinema 0${parsedRoomNumber}`,
      201
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
