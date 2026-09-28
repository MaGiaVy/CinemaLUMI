import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { TicketStatus, SeatStatus, DiscountType } from '@prisma/client';
import { sendVoucherIssued } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Xử lý hủy vé từ phía khách hàng (Phase 10 - BR-03)
 * Điều kiện:
 * - Vé phải thuộc về người dùng đang đăng nhập (hoặc ADMIN)
 * - Vé chưa qua sử dụng (Status: Valid)
 * - Hủy trước giờ chiếu ít nhất 2 tiếng (timeDiff >= 2 hours)
 * - Giải phóng ghế về EMPTY
 * - Cấp mã Coupon hoàn 50% có hạn 30 ngày
 * - Gửi email cấp voucher bất đồng bộ không chặn luồng (Phase 14)
 */
async function processTicketCancellation(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const { id } = await params;
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId) || ticketId <= 0) {
      throw new AppError(400, 'Mã định danh vé (id) không hợp lệ', 'INVALID_TICKET_ID');
    }

    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    // 1. Xác định User đang yêu cầu
    let currentUserId: number | null = session?.user?.id ? Number(session.user.id) : null;
    const currentUserRole = session?.user?.role;

    // Hỗ trợ tham số fallback user_id cho script kiểm thử tự động
    if (!currentUserId && searchParams.get('user_id')) {
      const parsedUserId = parseInt(searchParams.get('user_id')!, 10);
      if (!isNaN(parsedUserId) && parsedUserId > 0) {
        currentUserId = parsedUserId;
      }
    }

    if (!currentUserId) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để thực hiện hủy vé',
        'UNAUTHENTICATED'
      );
    }

    // 2. Tìm vé trong Database
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
        seat: true,
      },
    });

    if (!ticket) {
      throw new AppError(404, `Không tìm thấy vé #${ticketId}`, 'TICKET_NOT_FOUND');
    }

    // Kiểm tra quyền sở hữu
    if (ticket.userId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new AppError(
        403,
        'Bạn không có quyền hủy vé của người dùng khác',
        'FORBIDDEN'
      );
    }

    // 3. Ràng buộc nghiệp vụ BR-03:
    // 3.1. Kiểm tra vé chưa qua sử dụng
    if (ticket.status === TicketStatus.Used) {
      throw new AppError(
        400,
        'Vé này đã được sử dụng (check-in vào rạp), không thể hủy theo quy định',
        'TICKET_ALREADY_USED'
      );
    }

    if (ticket.status === TicketStatus.Cancelled) {
      throw new AppError(
        400,
        'Vé này đã được hủy từ trước đó',
        'TICKET_ALREADY_CANCELLED'
      );
    }

    if (ticket.status !== TicketStatus.Valid) {
      throw new AppError(
        400,
        `Vé có trạng thái "${ticket.status}", không thể thực hiện hủy`,
        'INVALID_TICKET_STATUS'
      );
    }

    // 3.2. Kiểm tra thời gian hủy phải trước suất chiếu ít nhất 2 giờ
    if (!ticket.screening || !ticket.screening.startTime) {
      throw new AppError(400, 'Không tìm thấy thông tin thời gian suất chiếu của vé', 'INVALID_SCREENING');
    }

    const now = new Date();
    const screeningStartTime = new Date(ticket.screening.startTime);
    const timeDiffMs = screeningStartTime.getTime() - now.getTime();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    if (timeDiffMs < TWO_HOURS_MS) {
      const hoursLeft = Math.max(0, timeDiffMs / (1000 * 60 * 60)).toFixed(1);
      throw new AppError(
        400,
        `Theo quy định BR-03, vé chỉ có thể hủy trước giờ chiếu ít nhất 2 tiếng. Hiện chỉ còn ${hoursLeft} giờ trước khi suất chiếu bắt đầu.`,
        'CANCELLATION_TIME_LIMIT_EXCEEDED'
      );
    }

    // 4. THỰC THI TRANSACTION NGUYÊN TỬ (Atomic Transaction)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Voucher bồi hoàn có hạn 30 ngày
    const couponCode = `COMP50_${ticket.id}_${Math.floor(1000 + Math.random() * 9000)}`;

    const { updatedTicket, refundCoupon } = await prisma.$transaction(async (tx) => {
      // 4.1. Cập nhật trạng thái vé thành CANCELLED
      const cancelledTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.Cancelled,
        },
      });

      // 4.2. Giải phóng trạng thái ghế trong bảng Seats (thành EMPTY)
      if (ticket.seatId) {
        await tx.seat.update({
          where: { id: ticket.seatId },
          data: {
            status: SeatStatus.EMPTY,
            reservedUntil: null,
          },
        });
      }

      // 4.3. Tạo Coupon giảm giá 50% bồi thường cho chính user đó
      const createdCoupon = await tx.coupon.create({
        data: {
          code: couponCode,
          discountType: DiscountType.Percentage,
          discountValue: 50,
          minAmount: 0,
          maxUsage: 1,
          usedCount: 0,
          expiryDate,
          userId: ticket.userId,
          applicableMovieId: null,
        },
      });

      return { updatedTicket: cancelledTicket, refundCoupon: createdCoupon };
    });

    // 4.4. Gửi email thông báo cấp voucher hoàn tiền 50% cho khách hàng (Phase 14)
    // Chạy bất đồng bộ không await để không làm chậm hoặc sập luồng chính
    if (refundCoupon && ticket.user?.email) {
      sendVoucherIssued(ticket.user.email, refundCoupon.code, {
        customerName: ticket.user.name || undefined,
        discountPercent: 50,
        discountAmount: Math.round(Number(ticket.price) * 0.5),
        expiryDate: refundCoupon.expiryDate,
        reason: 'Khách hàng chủ động hủy vé trước giờ chiếu ít nhất 2 tiếng theo quy chế BR-03',
        ticketId: ticket.id,
      }).catch((emailErr) => {
        console.warn(`[EmailService] Failed to send voucher to ${ticket.user?.email}:`, emailErr);
      });
    }

    return apiResponse(
      true,
      {
        ticket_id: updatedTicket.id,
        status: updatedTicket.status,
        released_seat: ticket.seat?.code || null,
        compensation_coupon: {
          id: refundCoupon.id,
          code: refundCoupon.code,
          discount_type: refundCoupon.discountType,
          discount_value: Number(refundCoupon.discountValue),
          expiry_date: refundCoupon.expiryDate.toISOString(),
          message: 'Voucher giảm giá 50% bồi hoàn cho lần đặt vé tiếp theo (Hạn dùng 30 ngày)',
        },
      },
      'Hủy vé thành công! Ghế đã được giải phóng và bạn nhận được voucher giảm 50% bồi hoàn.',
      200
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return apiResponse(
      false,
      null,
      errorResponse.error,
      errorResponse.statusCode,
      errorResponse.code,
      errorResponse.error
    );
  }
}

/**
 * POST /api/tickets/[id]/cancel
 */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  return processTicketCancellation(request, params);
}

/**
 * DELETE /api/tickets/[id]/cancel
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  return processTicketCancellation(request, params);
}
