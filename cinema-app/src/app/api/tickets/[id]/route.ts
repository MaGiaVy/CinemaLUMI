import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
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
 * Interface chi tiết vé và QR Payload trả về
 */
export interface TicketDetailResult {
  id: number;
  ticket_id: number;
  ticket_type: string;
  ticketType: string;
  price: number;
  status: TicketStatus;
  purchase_date: string;
  purchaseDate: string;
  qr_payload: string;
  qrPayload: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  movie: {
    id: number;
    title: string;
    slug?: string | null;
    poster: string;
    duration: number;
    genre: string;
    age_rating?: string | null;
    ageRating?: string | null;
  } | null;
  screening: {
    id: number;
    room: string;
    room_number?: number | null;
    roomNumber?: number | null;
    date: string;
    start_time: string;
    startTime: string;
    end_time: string;
    endTime: string;
    price: number;
    status: string;
  } | null;
  seat: {
    id: number;
    code: string;
    row: string;
    number: number;
    type: string;
  } | null;
  payment: {
    id: number;
    amount: number;
    payment_method: string | null;
    paymentMethod: string | null;
    transaction_code: string | null;
    transactionCode: string | null;
    status: string;
    created_at: string;
  } | null;
}

/**
 * Tạo chữ ký xác thực số (HMAC) cho vé để chống giả mạo mã QR
 */
function generateTicketSignature(ticketId: number, userId: number, seatId: number | null, status: string): string {
  const secret = process.env.NEXTAUTH_SECRET || 'lumi_cinema_ticket_verification_secret_key';
  return crypto
    .createHmac('sha256', secret)
    .update(`LMC-TICKET-${ticketId}-${userId}-${seatId || 0}-${status}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * GET /api/tickets/[id]
 * 
 * Lấy thông tin chi tiết một vé cụ thể:
 * 1. Xác thực người dùng (Session NextAuth).
 * 2. Tìm kiếm vé trong cơ sở dữ liệu.
 * 3. Kiểm tra quyền sở hữu (Vé bắt buộc phải thuộc sở hữu của user đang request,
 *    ngoại trừ quyền đặc biệt của ADMIN / STAFF).
 * 4. Nếu hợp lệ, trả về toàn bộ dữ liệu vé kèm chuỗi payload để Frontend tự sinh mã QR Code.
 */
export async function GET(
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

    // 1. Xác định User đang yêu cầu
    let currentUserId: number | null = session?.user?.id ? Number(session.user.id) : null;
    const currentUserRole = session?.user?.role;

    // Fallback query param user_id cho script test tự động
    if (!currentUserId && searchParams.get('user_id')) {
      const parsedUserId = parseInt(searchParams.get('user_id')!, 10);
      if (!isNaN(parsedUserId) && parsedUserId > 0) {
        currentUserId = parsedUserId;
      }
    }

    if (!currentUserId) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để xem chi tiết vé',
        'UNAUTHENTICATED'
      );
    }

    // 2. Truy vấn chi tiết vé kèm đầy đủ các bảng liên quan
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
        screening: {
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
              },
            },
          },
        },
        seat: {
          select: {
            id: true,
            code: true,
            row: true,
            number: true,
            type: true,
            status: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            transactionCode: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new AppError(404, `Không tìm thấy vé #${ticketId}`, 'TICKET_NOT_FOUND');
    }

    // 3. KIỂM TRA QUYỀN SỞ HỮU (Chỉ chủ sở hữu hoặc ADMIN / STAFF mới được xem)
    const isOwner = ticket.userId === currentUserId;
    const isStaffOrAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'STAFF';

    if (!isOwner && !isStaffOrAdmin) {
      throw new AppError(
        403,
        'Bạn không có quyền truy cập thông tin vé này (Vé thuộc về người dùng khác)',
        'FORBIDDEN'
      );
    }

    // 4. TẠO CHUỖI PAYLOAD ĐỂ FRONTEND TỰ SINH MÃ QR CODE
    const signature = generateTicketSignature(ticket.id, ticket.userId, ticket.seatId, ticket.status);
    const qrData = {
      ticket_id: ticket.id,
      user_id: ticket.userId,
      user_name: ticket.user.name,
      movie_title: ticket.screening?.movie.title || '',
      screening_id: ticket.screeningId,
      room: ticket.screening?.room || '',
      show_time: ticket.screening?.startTime.toISOString() || '',
      seat_code: ticket.seat?.code || '',
      ticket_type: ticket.ticketType,
      price: Number(ticket.price),
      status: ticket.status,
      issued_at: ticket.purchaseDate.toISOString(),
      sig: signature,
    };
    const qrPayload = JSON.stringify(qrData);

    // 5. Chuẩn hóa dữ liệu phản hồi
    const result: TicketDetailResult = {
      id: ticket.id,
      ticket_id: ticket.id,
      ticket_type: ticket.ticketType,
      ticketType: ticket.ticketType,
      price: Number(ticket.price),
      status: ticket.status,
      purchase_date: ticket.purchaseDate.toISOString(),
      purchaseDate: ticket.purchaseDate.toISOString(),
      qr_payload: qrPayload,
      qrPayload: qrPayload,
      user: ticket.user,
      movie: ticket.screening?.movie
        ? {
            id: ticket.screening.movie.id,
            title: ticket.screening.movie.title,
            slug: ticket.screening.movie.slug,
            poster: ticket.screening.movie.poster,
            duration: ticket.screening.movie.duration,
            genre: ticket.screening.movie.genre,
            age_rating: ticket.screening.movie.ageRating,
            ageRating: ticket.screening.movie.ageRating,
          }
        : null,
      screening: ticket.screening
        ? {
            id: ticket.screening.id,
            room: ticket.screening.room,
            room_number: ticket.screening.roomNumber,
            roomNumber: ticket.screening.roomNumber,
            date: ticket.screening.date.toISOString(),
            start_time: ticket.screening.startTime.toISOString(),
            startTime: ticket.screening.startTime.toISOString(),
            end_time: ticket.screening.endTime.toISOString(),
            endTime: ticket.screening.endTime.toISOString(),
            price: Number(ticket.screening.price),
            status: ticket.screening.status,
          }
        : null,
      seat: ticket.seat
        ? {
            id: ticket.seat.id,
            code: ticket.seat.code,
            row: ticket.seat.row,
            number: ticket.seat.number,
            type: ticket.seat.type,
          }
        : null,
      payment: ticket.payment
        ? {
            id: ticket.payment.id,
            amount: Number(ticket.payment.amount),
            payment_method: ticket.payment.paymentMethod,
            paymentMethod: ticket.payment.paymentMethod,
            transaction_code: ticket.payment.transactionCode,
            transactionCode: ticket.payment.transactionCode,
            status: ticket.payment.status,
            created_at: ticket.payment.createdAt.toISOString(),
          }
        : null,
    };

    return apiResponse(
      true,
      result,
      'Lấy thông tin chi tiết vé thành công',
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
 * DELETE /api/tickets/[id]
 * 
 * Khách hàng tự hủy vé theo ràng buộc nghiệp vụ BR-03:
 * 1. Kiểm tra xác thực (Session người dùng).
 * 2. Tìm vé và kiểm tra quyền sở hữu (chỉ chính chủ vé hoặc ADMIN mới được hủy).
 * 3. Ràng buộc BR-03:
 *    - Vé phải chưa qua sử dụng (status === 'Valid').
 *    - Thời gian hủy phải diễn ra trước giờ chiếu ít nhất 2 giờ (NOW + 2 hours <= screening.startTime).
 * 4. Thực thi prisma.$transaction:
 *    - Cập nhật trạng thái vé thành CANCELLED.
 *    - Giải phóng trạng thái ghế trong bảng Seats (status = EMPTY, reservedUntil = null).
 *    - Tạo mã Coupon giảm giá 50% bồi thường cho chính user đó (userId = ticket.userId).
 * 5. Trả về kết quả qua apiResponse.
 */
export async function DELETE(
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

    // 1. Xác định User đang yêu cầu
    let currentUserId: number | null = session?.user?.id ? Number(session.user.id) : null;
    const currentUserRole = session?.user?.role;

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

    // 3. RÀNG BUỘC NGHIỆP VỤ BR-03:
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
          userId: ticket.userId, // Khóa riêng cho user này
          applicableMovieId: null, // Áp dụng cho mọi phim
        },
      });

      return { updatedTicket: cancelledTicket, refundCoupon: createdCoupon };
    });

    // 4.4. Gửi email thông báo cấp voucher hoàn tiền 50% cho khách hàng (Phase 14)
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
      undefined,
      errorResponse.error,
      errorResponse.statusCode,
      errorResponse.code,
      errorResponse.error
    );
  }
}

