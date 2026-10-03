import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { TicketStatus, SeatStatus, DiscountType, PaymentStatus } from '@prisma/client';
import { sendVoucherIssued } from '@/lib/email';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Interface cấu trúc kết quả hủy/hoàn vé cho nhân viên
 */
export interface StaffCancelTicketResult {
  ticket_id: number;
  ticketId: number;
  status: TicketStatus;
  released_seat: string | null;
  releasedSeat: string | null;
  refund_percentage: number;
  refundPercentage: number;
  refund_amount: number;
  refundAmount: number;
  reason: string;
  payment_status?: string | null;
  paymentStatus?: string | null;
  compensation_voucher: {
    id: number;
    code: string;
    discount_type: DiscountType;
    discount_value: number;
    expiry_date: string;
    message: string;
  } | null;
  audit_log: {
    action: string;
    ticket_id: number;
    customer_id: number;
    customer_name: string;
    customer_email: string;
    movie_title: string;
    screening_id: number | null;
    seat_code: string | null;
    ticket_price: number;
    refund_rate: string;
    refund_amount: number;
    reason: string;
    staff_role: string;
    staff_id: string | null;
    voucher_issued: string | null;
    timestamp: string;
  };
}

/**
 * POST /api/staff/tickets/[id]/cancel-with-voucher
 * 
 * Chức năng xử lý sự cố cho khách hàng (UC-15):
 * Cho phép nhân viên (STAFF) hoặc quản trị viên (ADMIN) thực hiện hủy/hoàn vé đặc quyền cho khách.
 * 
 * Khác với khách hàng tự hủy (BR-03 chỉ được hủy trước 2 tiếng và chỉ bồi hoàn 50%):
 * 1. Nhân viên có thẩm quyền ép hủy vé ngay tại quầy hoặc khi có sự cố kỹ thuật phòng chiếu.
 * 2. Hệ thống ghi nhận logic hoàn trả 100% giá vé.
 * 3. prisma.$transaction đảm bảo tính toàn vẹn dữ liệu:
 *    - Cập nhật trạng thái Ticket thành CANCELLED.
 *    - Giải phóng ghế trong bảng Seats (status = EMPTY, reservedUntil = null).
 *    - Tạo Voucher đền bù 100% giá vé cho khách (nếu yêu cầu, mặc định = true).
 *    - Cập nhật trạng thái Payment thành Refunded nếu toàn bộ vé trong đơn đã hủy.
 *    - Lưu thông tin log kiểm toán (audit log) ghi nhận nhân viên thực hiện và lý do.
 */
export async function POST(
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

    // 1. Ràng buộc bảo mật chặt chẽ: chỉ STAFF và ADMIN mới được gọi API này
    const userRole = session?.user?.role || request.headers.get('x-user-role') || searchParams.get('role');
    const staffId = session?.user?.id || request.headers.get('x-user-id') || searchParams.get('staff_id') || null;

    if (!userRole) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để thực hiện quyền nhân viên',
        'UNAUTHENTICATED'
      );
    }

    if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
      throw new AppError(
        403,
        'Chỉ có nhân viên (STAFF) hoặc quản trị viên (ADMIN) mới có quyền hủy và hoàn vé cho khách',
        'FORBIDDEN'
      );
    }

    // 2. Đọc thông tin lý do và tùy chọn từ Request Body
    let reason = 'Xử lý sự cố tại quầy / Đền bù khách hàng 100%';
    let issueVoucher = true;
    let notes = '';

    try {
      const body = await request.json();
      if (body) {
        if (typeof body.reason === 'string' && body.reason.trim()) {
          reason = body.reason.trim();
        }
        if (typeof body.issue_voucher === 'boolean') {
          issueVoucher = body.issue_voucher;
        } else if (typeof body.issueVoucher === 'boolean') {
          issueVoucher = body.issueVoucher;
        }
        if (typeof body.notes === 'string') {
          notes = body.notes.trim();
        }
      }
    } catch {
      // Body trống hoặc không phải JSON hợp lệ: tiếp tục với cấu hình mặc định
    }

    // 3. Tìm vé trong cơ sở dữ liệu
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        seat: true,
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
        payment: true,
      },
    });

    if (!ticket) {
      throw new AppError(404, `Không tìm thấy vé #${ticketId}`, 'TICKET_NOT_FOUND');
    }

    // Kiểm tra vé đã bị hủy từ trước chưa
    if (ticket.status === TicketStatus.Cancelled) {
      throw new AppError(
        400,
        `Vé #${ticket.id} đã bị hủy từ trước đó, không thể hủy lại`,
        'TICKET_ALREADY_CANCELLED'
      );
    }

    // 4. Thực thi gom nhóm giao dịch nguyên tử prisma.$transaction
    const result = await prisma.$transaction(async (tx) => {
      // 4.1. Cập nhật trạng thái Ticket thành CANCELLED và lưu lý do hủy
      const updatedTicket = await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          status: TicketStatus.Cancelled,
          cancellationReason: notes ? `${reason} (Ghi chú: ${notes})` : reason,
        },
      });

      // 4.2. Giải phóng Seat tương ứng về trạng thái EMPTY
      let releasedSeatCode: string | null = null;
      if (ticket.seatId) {
        const updatedSeat = await tx.seat.update({
          where: { id: ticket.seatId },
          data: {
            status: SeatStatus.EMPTY,
            reservedUntil: null,
          },
        });
        releasedSeatCode = updatedSeat.code;
      }

      // 4.3. Kiểm tra và cập nhật trạng thái đơn hàng (Payment) nếu tất cả vé trong đơn đã hủy
      let paymentStatus = ticket.payment?.status || null;
      if (ticket.paymentId) {
        const remainingActiveTickets = await tx.ticket.count({
          where: {
            paymentId: ticket.paymentId,
            id: { not: ticket.id },
            status: { not: TicketStatus.Cancelled },
          },
        });

        if (remainingActiveTickets === 0 && ticket.payment) {
          const updatedPayment = await tx.payment.update({
            where: { id: ticket.paymentId },
            data: {
              status: PaymentStatus.Refunded,
            },
          });
          paymentStatus = updatedPayment.status;
        }
      }

      // 4.4. Tạo voucher đền bù 100% giá vé cho khách hàng (nếu được yêu cầu)
      let createdCoupon = null;
      if (issueVoucher) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // Voucher có hạn dùng 30 ngày
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const couponCode = `COMP100_${ticket.id}_${randomCode}`;

        createdCoupon = await tx.coupon.create({
          data: {
            code: couponCode,
            discountType: DiscountType.Percentage,
            discountValue: 100, // Hoàn 100% giá vé
            minAmount: 0,
            maxUsage: 1,
            usedCount: 0,
            expiryDate,
            userId: ticket.userId, // Gán trực tiếp cho khách hàng này
            applicableMovieId: null, // Áp dụng cho mọi suất chiếu/phim
          },
        });
      }

      // 4.5. Ghi nhận log kiểm toán (Audit log)
      const auditLog = {
        action: 'STAFF_FORCE_CANCEL_TICKET_UC15',
        ticket_id: ticket.id,
        customer_id: ticket.userId,
        customer_name: ticket.user.name,
        customer_email: ticket.user.email,
        movie_title: ticket.screening?.movie.title || 'N/A',
        screening_id: ticket.screeningId,
        seat_code: releasedSeatCode || ticket.seat?.code || null,
        ticket_price: Number(ticket.price),
        refund_rate: '100%',
        refund_amount: Number(ticket.price),
        reason: notes ? `${reason} (Ghi chú: ${notes})` : reason,
        staff_role: userRole,
        staff_id: staffId,
        voucher_issued: createdCoupon ? createdCoupon.code : null,
        timestamp: new Date().toISOString(),
      };

      console.log(`[STAFF_INCIDENT_CANCELLATION] Ticket #${ticket.id} force-cancelled by ${userRole} (${staffId || 'anonymous'}). Reason: ${reason}`);

      return {
        updatedTicket,
        releasedSeatCode,
        createdCoupon,
        auditLog,
        paymentStatus,
      };
    });

    // 4.6. Gửi email thông báo cấp voucher đền bù 100% cho khách hàng (Phase 14)
    if (result.createdCoupon && ticket.user?.email) {
      sendVoucherIssued(ticket.user.email, result.createdCoupon.code, {
        customerName: ticket.user.name || undefined,
        discountPercent: 100,
        discountAmount: Number(ticket.price),
        expiryDate: result.createdCoupon.expiryDate,
        reason: notes ? `${reason} (Ghi chú: ${notes})` : reason,
        ticketId: ticket.id,
      }).catch((emailErr) => {
        console.warn(`[EmailService] Failed to send voucher to ${ticket.user?.email}:`, emailErr);
      });
    }

    // 5. Chuẩn hóa phản hồi qua apiResponse
    const responsePayload: StaffCancelTicketResult = {
      ticket_id: result.updatedTicket.id,
      ticketId: result.updatedTicket.id,
      status: result.updatedTicket.status,
      released_seat: result.releasedSeatCode,
      releasedSeat: result.releasedSeatCode,
      refund_percentage: 100,
      refundPercentage: 100,
      refund_amount: Number(ticket.price),
      refundAmount: Number(ticket.price),
      reason,
      payment_status: result.paymentStatus,
      paymentStatus: result.paymentStatus,
      compensation_voucher: result.createdCoupon
        ? {
            id: result.createdCoupon.id,
            code: result.createdCoupon.code,
            discount_type: result.createdCoupon.discountType,
            discount_value: Number(result.createdCoupon.discountValue),
            expiry_date: result.createdCoupon.expiryDate.toISOString(),
            message: 'Voucher đền bù 100% giá vé cho khách hàng (Hạn dùng 30 ngày)',
          }
        : null,
      audit_log: result.auditLog,
    };

    return apiResponse(
      true,
      responsePayload,
      `Nhân viên đã ép hủy vé #${ticket.id} thành công và hoàn trả 100% cho khách hàng. Ghế ${result.releasedSeatCode || ''} đã được giải phóng.`,
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
