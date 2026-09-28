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
    const searchParams = request.nextUrl.searchParams;

    // 1. Kiểm tra quyền STAFF hoặc ADMIN
    const userRole = session?.user?.role || searchParams.get('role');

    if (!userRole || (userRole !== 'STAFF' && userRole !== 'ADMIN')) {
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

    // 4. Cập nhật trạng thái vé thành USED
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.Used,
      },
    });

    const checkInTime = new Date().toISOString();

    // 5. Trả về kết quả qua apiResponse
    return apiResponse(
      true,
      {
        ticket_id: updatedTicket.id,
        ticketId: updatedTicket.id,
        status: updatedTicket.status,
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
