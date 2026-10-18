import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';
import { AppError, handleError } from '@/lib/error';
import { requireAuth } from '@/lib/auth-helpers';

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
    await requireAuth(['ADMIN']);

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
    const newEndTime = new Date(newStartTime.getTime() + durationMinutes * 60 * 1000);

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

    // Vé đã bán gắn với thời gian và phòng cũ; xử lý đổi lịch qua luồng sự cố.
    const soldTicketCount = await prisma.ticket.count({ where: { screeningId, status: { in: ['Valid', 'Used'] } } });
    if (soldTicketCount > 0 && (newStartTime.getTime() !== existingScreening.startTime.getTime() ||
      targetRoomNumber !== existingScreening.roomNumber || targetMovie.id !== existingScreening.movieId)) {
      return apiResponse(false, undefined, 'Suất chiếu đã bán vé; cần xử lý sự cố trước khi đổi lịch, phòng hoặc phim', 409);
    }

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
    const admin = await requireAuth(['ADMIN']);

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

    // Chỉ lọc các vé hợp lệ chưa sử dụng để hoàn tiền (KHÔNG chạm vào vé đã USED)
    const hasTicketsEverSold = screening.tickets.length > 0;

    // 2. THỰC THI QUA TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      if (hasTicketsEverSold) {
        await tx.$queryRaw`SELECT screening_id FROM screenings WHERE screening_id = ${screeningId} FOR UPDATE`;
        const fresh = await tx.screening.findUnique({ where: { id: screeningId }, include: { tickets: { include: { payment: true } } } });
        if (!fresh || fresh.status === 'CANCELLED') {
          throw new AppError(409, 'Suất chiếu đã hủy', 'SCREENING_ALREADY_CANCELLED');
        }
        const affected = fresh.tickets.filter(ticket => ticket.status === 'Valid');
        await tx.screening.update({ where: { id: screeningId }, data: { status: 'CANCELLED' } });
        let totalRefundAmount = 0;
        for (const ticket of affected) {
          const amount = ticket.paidPrice ?? ticket.price;
          totalRefundAmount += Number(amount);
          await tx.ticket.update({ where: { id: ticket.id }, data: { status: 'Cancelled', cancellationReason: 'Suất chiếu hủy do lỗi rạp' } });
          await tx.ticketRefund.create({
            data: {
              ticketId: ticket.id,
              amount,
              reason: 'Suất chiếu hủy do lỗi rạp',
              claimDeadline: ticket.payment.paymentMethod === 'VNPay' || ticket.payment.paymentMethod === 'Momo'
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
            },
          });
          await tx.cancellationAction.create({
            data: {
              ticketId: ticket.id,
              actorUserId: admin.id,
              action: 'CANCEL_SCREENING_TICKET',
              reason: 'Suất chiếu hủy do lỗi rạp',
              resolution: 'PENDING_REFUND',
            },
          });
        }
        const releasedSeatIds = affected.map(ticket => ticket.seatId).filter((id): id is number => id !== null);
        await tx.seat.updateMany({
          where: { screeningId, OR: [{ status: 'RESERVED' }, { id: { in: releasedSeatIds }, status: 'OCCUPIED' }] },
          data: { status: 'EMPTY', reservedUntil: null, holdUserId: null, holdPaymentId: null },
        });
        return {
          screening_id: screeningId,
          movie_title: screening.movie.title,
          soft_deleted: true,
          status: 'CANCELLED',
          refund_flow_recorded: true,
          cancelled_valid_tickets_count: affected.length,
          total_refund_amount: totalRefundAmount,
          affected_users: [],
          note: 'Các vé chưa sử dụng đã hủy và ghi nhận khoản chờ hoàn tiền mặt.',
        };
      } else {
        // Chưa từng có khách nào mua vé -> Xóa vật lý bình thường
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

    const responseMessage = hasTicketsEverSold
      ? `Suất chiếu phim "${screening.movie.title}" đã được hủy (CANCELLED). Đã giải phóng ghế, hủy ${result.cancelled_valid_tickets_count} vé chưa dùng để hoàn tiền 100% và bảo toàn toàn bộ lịch sử vé đã xem.`
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
