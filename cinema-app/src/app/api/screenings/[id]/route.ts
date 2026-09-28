import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/screenings/[id]
 * 
 * Lấy chi tiết một suất chiếu theo ID:
 * - Thông tin suất chiếu và phim.
 * - Danh sách 50 ghế kèm trạng thái (EMPTY, RESERVED, OCCUPIED).
 * - Thống kê số lượng ghế trống (empty_seats).
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const screeningId = parseInt(id, 10);

    if (isNaN(screeningId)) {
      return apiResponse(false, undefined, 'Mã định danh suất chiếu (id) không hợp lệ', 400);
    }

    const screening = await prisma.screening.findUnique({
      where: { id: screeningId },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            poster: true,
            duration: true,
            genre: true,
            rating: true,
            ageRating: true,
            director: true,
          },
        },
        seats: {
          select: {
            id: true,
            row: true,
            number: true,
            code: true,
            type: true,
            status: true,
            reservedUntil: true,
          },
          orderBy: [
            { row: 'asc' },
            { number: 'asc' },
          ],
        },
        _count: {
          select: {
            seats: true,
            tickets: true,
          },
        },
      },
    });

    if (!screening) {
      return apiResponse(false, undefined, 'Không tìm thấy suất chiếu yêu cầu', 404);
    }

    // Tính toán thống kê ghế trống
    const totalSeats = screening.seats.length;
    const emptySeats = screening.seats.filter(s => s.status === 'EMPTY').length;
    const reservedSeats = screening.seats.filter(s => s.status === 'RESERVED').length;
    const occupiedSeats = screening.seats.filter(s => s.status === 'OCCUPIED').length;

    return apiResponse(
      true,
      {
        ...screening,
        stats: {
          total_seats: totalSeats,
          empty_seats: emptySeats,
          reserved_seats: reservedSeats,
          occupied_seats: occupiedSeats,
        },
      },
      'Lấy chi tiết suất chiếu thành công',
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
 * PUT /api/screenings/[id]
 * 
 * Cập nhật thông tin một suất chiếu.
 * 
 * RÀNG BUỘC NGHIỆP VỤ:
 * - Chỉ cho phép sửa đổi thông tin nếu suất chiếu đó chưa bắt đầu (startTime > NOW).
 * - Nếu đổi phòng hoặc giờ chiếu, phải kiểm tra chống trùng lịch với các suất chiếu khác trong phòng.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const screeningId = parseInt(id, 10);

    if (isNaN(screeningId)) {
      return apiResponse(false, undefined, 'Mã định danh suất chiếu (id) không hợp lệ', 400);
    }

    // 1. Kiểm tra suất chiếu có tồn tại không
    const existingScreening = await prisma.screening.findUnique({
      where: { id: screeningId },
      include: {
        movie: true,
      },
    });

    if (!existingScreening) {
      return apiResponse(false, undefined, 'Không tìm thấy suất chiếu cần cập nhật', 404);
    }

    // 2. RÀNG BUỘC: Chỉ cho phép sửa nếu suất chiếu chưa bắt đầu
    const now = new Date();
    if (new Date(existingScreening.startTime) <= now) {
      return apiResponse(
        false,
        undefined,
        'Không thể cập nhật suất chiếu vì suất chiếu này đã bắt đầu hoặc đã kết thúc',
        400
      );
    }

    // 3. Đọc dữ liệu cập nhật
    const body = await request.json();
    const {
      movie_id,
      room_number,
      screening_date,
      screening_time,
      base_price,
      status,
    } = body;

    const updateData: any = {};

    // Cập nhật giá vé
    if (base_price !== undefined && !isNaN(Number(base_price))) {
      updateData.price = Number(base_price);
    }

    // Cập nhật trạng thái
    if (status && ['UPCOMING', 'SHOWING', 'ENDED'].includes(status.toUpperCase())) {
      updateData.status = status.toUpperCase();
    }

    // Xác định movie
    let targetMovie = existingScreening.movie;
    if (movie_id && Number(movie_id) !== existingScreening.movieId) {
      const newMovie = await prisma.movie.findUnique({
        where: { id: Number(movie_id) },
      });
      if (!newMovie) {
        return apiResponse(false, undefined, 'Bộ phim mới (movie_id) không tồn tại', 404);
      }
      targetMovie = newMovie;
      updateData.movieId = newMovie.id;
    }

    // Xác định room_number
    let targetRoomNumber = existingScreening.roomNumber || 1;
    if (room_number !== undefined) {
      const parsedRoom = Number(room_number);
      if (isNaN(parsedRoom) || parsedRoom < 1 || parsedRoom > 5) {
        return apiResponse(false, undefined, 'Số phòng chiếu (room_number) phải từ 1 đến 5', 400);
      }
      targetRoomNumber = parsedRoom;
      updateData.roomNumber = parsedRoom;
      updateData.room = `Cinema 0${parsedRoom}`;
    }

    // Tính toán lại thời gian nếu có cập nhật ngày hoặc giờ hoặc đổi phim
    const dateStr = screening_date ? screening_date.split('T')[0] : existingScreening.date.toISOString().split('T')[0];
    let timeStr: string;

    if (screening_time) {
      timeStr = screening_time.includes(':') ? screening_time : `${screening_time}:00`;
    } else {
      timeStr = existingScreening.startTime.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    const newStartTime = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(newStartTime.getTime())) {
      return apiResponse(false, undefined, 'Định dạng ngày hoặc giờ chiếu không hợp lệ', 400);
    }

    const durationMinutes = targetMovie.duration || 120;
    const newEndTime = new Date(newStartTime.getTime() + (durationMinutes + 15) * 60 * 1000);

    // 4. KIỂM TRA TRÙNG LỊCH (loại trừ chính suất chiếu đang sửa)
    const conflictingScreening = await prisma.screening.findFirst({
      where: {
        id: { not: screeningId },
        roomNumber: targetRoomNumber,
        AND: [
          {
            startTime: {
              lt: newEndTime,
            },
          },
          {
            endTime: {
              gt: newStartTime,
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
        `Phòng chiếu ${targetRoomNumber} đã có suất chiếu phim "${conflictingScreening.movie.title}" từ ${conflictStart} đến ${conflictEnd}. Vui lòng chọn khung giờ hoặc phòng khác.`,
        400
      );
    }

    updateData.startTime = newStartTime;
    updateData.endTime = newEndTime;
    updateData.date = new Date(dateStr);

    // 5. Cập nhật dữ liệu
    const updatedScreening = await prisma.screening.update({
      where: { id: screeningId },
      data: updateData,
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
      },
    });

    return apiResponse(
      true,
      updatedScreening,
      'Cập nhật suất chiếu thành công',
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
 * DELETE /api/screenings/[id]
 * 
 * Xóa một suất chiếu khỏi hệ thống.
 * 
 * RÀNG BUỘC NGHIỆP VỤ:
 * - Nếu suất chiếu chưa bán được vé nào: Xóa bình thường (kèm 50 ghế).
 * - Nếu đã có khách mua vé:
 *   1. Chuyển trạng thái các vé đó sang CANCELLED.
 *   2. Ghi nhận thông tin hoàn tiền 100% cho khách hàng.
 *   3. Xóa suất chiếu và bảo toàn bản ghi vé để xử lý hoàn tiền / cấp voucher ở Phase sau.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const screeningId = parseInt(id, 10);

    if (isNaN(screeningId)) {
      return apiResponse(false, undefined, 'Mã định danh suất chiếu (id) không hợp lệ', 400);
    }

    // 1. Kiểm tra suất chiếu có tồn tại không
    const screening = await prisma.screening.findUnique({
      where: { id: screeningId },
      include: {
        movie: {
          select: {
            title: true,
          },
        },
        tickets: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            payment: {
              select: {
                id: true,
                amount: true,
                paymentMethod: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!screening) {
      return apiResponse(false, undefined, 'Không tìm thấy suất chiếu cần xóa', 404);
    }

    const soldTickets = screening.tickets.filter(t => t.status !== 'Cancelled');
    const hasSoldTickets = soldTickets.length > 0;

    // 2. THỰC THI QUA TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      if (hasSoldTickets) {
        // Cập nhật trạng thái toàn bộ vé của suất chiếu này thành Cancelled
        await tx.ticket.updateMany({
          where: {
            screeningId,
          },
          data: {
            status: 'Cancelled',
          },
        });

        // Tính toán số tiền hoàn trả 100%
        const totalRefundAmount = soldTickets.reduce((sum, t) => sum + Number(t.price), 0);

        // Danh sách khách hàng bị ảnh hưởng để phục vụ gửi email / voucher hoàn tiền ở phase sau
        const affectedUsers = Array.from(
          new Map(
            soldTickets.map(t => [
              t.user.id,
              {
                user_id: t.user.id,
                name: t.user.name,
                email: t.user.email,
                phone: t.user.phone,
                ticket_count: soldTickets.filter(st => st.userId === t.userId).length,
                refund_amount: soldTickets
                  .filter(st => st.userId === t.userId)
                  .reduce((sum, st) => sum + Number(st.price), 0),
              },
            ])
          ).values()
        );

        // Xóa suất chiếu (ghế gắn với suất chiếu sẽ tự động xóa theo CASCADE)
        await tx.screening.delete({
          where: { id: screeningId },
        });

        return {
          deleted_screening_id: screeningId,
          movie_title: screening.movie.title,
          refund_flow_recorded: true,
          cancelled_tickets_count: soldTickets.length,
          total_refund_amount: totalRefundAmount,
          affected_users: affectedUsers,
          note: 'Toàn bộ vé đã được chuyển sang trạng thái CANCELLED và ghi nhận luồng hoàn tiền 100%. API hoàn tiền/cấp voucher sẽ được xử lý ở Phase sau.',
        };
      } else {
        // Chưa có khách mua vé -> Xóa bình thường
        await tx.screening.delete({
          where: { id: screeningId },
        });

        return {
          deleted_screening_id: screeningId,
          movie_title: screening.movie.title,
          refund_flow_recorded: false,
          cancelled_tickets_count: 0,
        };
      }
    });

    const responseMessage = hasSoldTickets
      ? `Đã xóa suất chiếu phim "${screening.movie.title}". Hệ thống đã tự động chuyển ${result.cancelled_tickets_count} vé sang trạng thái CANCELLED và ghi nhận hoàn tiền 100% cho khách hàng.`
      : `Đã xóa suất chiếu phim "${screening.movie.title}" thành công (suất chiếu chưa có vé nào được bán).`;

    return apiResponse(
      true,
      result,
      responseMessage,
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
