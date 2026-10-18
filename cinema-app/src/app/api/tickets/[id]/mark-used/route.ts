import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/tickets/[id]/mark-used
 * 
 * API dành riêng cho Nhân viên kiểm vé (STAFF) và Quản trị viên (ADMIN):
 * 1. Kiểm tra session.user.role === 'STAFF' hoặc 'ADMIN'.
 * 2. Tìm kiếm vé theo ticket_id.
 * 3. Kiểm tra trạng thái vé:
 *    - Nếu vé đã USED: Báo lỗi TICKET_ALREADY_USED.
 *    - Nếu vé đã CANCELLED: Báo lỗi TICKET_CANCELLED.
 *    - Nếu vé VALID: Tiến hành check-in.
 * 4. Cập nhật trạng thái vé từ VALID sang USED.
 * 5. Trả về apiResponse kèm thông báo thành công và chi tiết vé đã soát.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId) || ticketId <= 0) {
      throw new AppError(400, 'Mã định danh vé (id) không hợp lệ', 'INVALID_TICKET_ID');
    }

    const session = await getServerSession(authOptions);

    // 1. Kiểm tra xác thực và quyền STAFF hoặc ADMIN trên Server Session
    if (!session || !session.user) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập với tài khoản nhân viên hoặc quản trị viên',
        'UNAUTHENTICATED'
      );
    }

    const userRole = (session.user as { role?: string }).role;

    if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
      throw new AppError(
        403,
        'Chỉ có nhân viên soát vé (STAFF) hoặc quản trị viên (ADMIN) mới có quyền thực hiện soát vé',
        'FORBIDDEN'
      );
    }

    // 2. Tìm vé trong cơ sở dữ liệu
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        screening: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        seat: {
          select: {
            id: true,
            code: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError(404, `Không tìm thấy vé #${ticketId}`, 'TICKET_NOT_FOUND');
    }

    // 3. Kiểm tra tính hợp lệ của trạng thái vé
    if (ticket.status === TicketStatus.Used) {
      throw new AppError(
        400,
        `Vé #${ticket.id} (${ticket.seat?.code || ''}) đã được quét check-in trước đó`,
        'TICKET_ALREADY_USED'
      );
    }

    if (ticket.status === TicketStatus.Cancelled) {
      throw new AppError(
        400,
        `Vé #${ticket.id} đã bị hủy, không được phép vào phòng chiếu`,
        'TICKET_CANCELLED'
      );
    }

    if (ticket.status !== TicketStatus.Valid) {
      throw new AppError(
        400,
        `Vé không hợp lệ để vào rạp (Trạng thái hiện tại: ${ticket.status})`,
        'INVALID_TICKET_STATUS'
      );
    }

    // Kiểm tra khung thời gian cho phép soát vé theo SRS: từ 30 phút trước giờ chiếu đến hết suất
    if (!ticket.screening || ticket.screening.status === 'CANCELLED') {
      throw new AppError(409, 'Suất chiếu không hợp lệ để soát vé', 'SCREENING_UNAVAILABLE');
    }
    {
      const now = new Date();
      const allowedStart = new Date(ticket.screening.startTime.getTime() - 30 * 60 * 1000);
      const allowedEnd = new Date(ticket.screening.endTime.getTime());

      if (now < allowedStart) {
        throw new AppError(
          400,
          `Chưa đến thời gian soát vé. Chỉ được soát vé từ 30 phút trước giờ chiếu (${allowedStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })})`,
          'CHECKIN_TOO_EARLY'
        );
      }
      if (now > allowedEnd) {
        throw new AppError(
          400,
          `Suất chiếu đã kết thúc vào lúc ${allowedEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Không thể soát vé.`,
          'CHECKIN_EXPIRED'
        );
      }
    }

    // 4. Cập nhật trạng thái vé thành USED
    const updated = await prisma.ticket.updateMany({
      where: { id: ticket.id, status: TicketStatus.Valid },
      data: {
        status: TicketStatus.Used,
      },
    });
    if (updated.count !== 1) throw new AppError(409, 'Vé đã được soát hoặc hủy', 'TICKET_ALREADY_PROCESSED');

    const checkInTime = new Date().toISOString();

    // 5. Trả về kết quả qua apiResponse
    return apiResponse(
      true,
      {
        ticket_id: ticket.id,
        ticketId: ticket.id,
        status: TicketStatus.Used,
        movie_title: ticket.screening?.movie.title || null,
        movieTitle: ticket.screening?.movie.title || null,
        room: ticket.screening?.room || null,
        seat_code: ticket.seat?.code || null,
        seatCode: ticket.seat?.code || null,
        ticket_type: ticket.ticketType,
        ticketType: ticket.ticketType,
        customer_name: ticket.user.name,
        customerName: ticket.user.name,
        customer_email: ticket.user.email,
        customerEmail: ticket.user.email,
        checked_in_at: checkInTime,
        checkedInAt: checkInTime,
      },
      `Soát vé thành công! Ghế ${ticket.seat?.code || ''} đã chuyển sang trạng thái ĐÃ SỬ DỤNG.`,
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
