import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { TicketStatus } from '@prisma/client';
import {
  verifyTicketSignature,
  validateCheckInTime,
  validateCheckInRoom,
} from '@/lib/ticket-verification';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface CheckInRequestBody {
  qr_data?: string;
  qr_payload?: string;
  qrPayload?: string;
  sig?: string;
  room?: string;
  force_manual?: boolean; // Cho phép nhân viên check-in thủ công tại quầy kèm audit
}

/**
 * PATCH /api/tickets/[id]/mark-used
 * 
 * Soát vé vào phòng chiếu (Check-in) theo quy trình nghiệp vụ FR-CHK-01:
 * 1. Phân quyền: Bắt buộc session STAFF hoặc ADMIN máy chủ (Chống SEC-02).
 * 2. Xác thực mã QR: Phía server phải xác thực chữ ký HMAC chống làm giả/chỉnh sửa mã QR.
 * 3. Ràng buộc thời gian FR-CHK-01: Chỉ cho phép check-in trong khoảng từ 30 phút trước giờ chiếu
 *    đến thời điểm kết thúc suất chiếu.
 * 4. Kiểm tra đúng phòng chiếu: Ngăn khách vào nhầm phòng chiếu.
 * 5. Chống check-in trùng: Từ chối các vé đã USED hoặc CANCELLED.
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

    // 1. Kiểm tra xác thực và phân quyền STAFF hoặc ADMIN máy chủ
    if (!session?.user?.id) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để thực hiện quyền soát vé',
        'UNAUTHENTICATED'
      );
    }

    const userRole = session.user.role;
    if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
      throw new AppError(
        403,
        'Chỉ có nhân viên soát vé (STAFF) hoặc quản trị viên (ADMIN) mới có quyền thực hiện soát vé',
        'FORBIDDEN'
      );
    }

    // Đọc payload gửi lên từ Client (scanner hoặc quầy soát vé)
    let body: CheckInRequestBody = {};
    try {
      body = await request.json();
    } catch {
      // Body rỗng -> kiểm tra các trường hợp mặc định
      body = {};
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
                duration: true,
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

    // 3. XÁC MINH MÃ QR VÀ CHỮ KÝ SỐ HMAC (Requirement 4)
    let extractedSig = body.sig;
    let scannedRoom = body.room;

    // Nếu gửi chuỗi quét QR đầy đủ (qr_data hoặc qr_payload)
    const rawQrString = body.qr_data || body.qr_payload || body.qrPayload;
    if (rawQrString && typeof rawQrString === 'string') {
      try {
        const parsedQr = JSON.parse(rawQrString);
        if (parsedQr.sig) extractedSig = parsedQr.sig;
        if (parsedQr.room && !scannedRoom) scannedRoom = parsedQr.room;
        if (parsedQr.ticket_id && Number(parsedQr.ticket_id) !== ticketId) {
          throw new AppError(
            400,
            `Mã QR quét được thuộc về vé #${parsedQr.ticket_id}, không khớp với yêu cầu vé #${ticketId}`,
            'TICKET_ID_MISMATCH'
          );
        }
      } catch (parseErr) {
        if (parseErr instanceof AppError) throw parseErr;
        // Nếu không phải JSON, kiểm tra xem có phải là chữ ký thô không
        if (!extractedSig) extractedSig = rawQrString;
      }
    }

    // Kiểm tra tính hợp lệ của chữ ký HMAC
    if (!extractedSig) {
      // Nếu không có chữ ký HMAC, yêu cầu xác thực bắt buộc
      throw new AppError(
        400,
        'Yêu cầu cung cấp chữ ký số HMAC hoặc dữ liệu mã QR hợp lệ để thực hiện check-in theo quy trình',
        'MISSING_QR_SIGNATURE'
      );
    }

    const isSigValid = verifyTicketSignature(
      ticket.id,
      ticket.userId,
      ticket.seatId,
      extractedSig,
      ticket.status === TicketStatus.Valid ? 'Valid' : ticket.status
    );

    // Fallback thử với trạng thái 'Valid' trong trường hợp QR được sinh lúc phát hành
    const isSigValidFallback = isSigValid || verifyTicketSignature(
      ticket.id,
      ticket.userId,
      ticket.seatId,
      extractedSig,
      'Valid'
    );

    if (!isSigValidFallback) {
      throw new AppError(
        400,
        'Chữ ký số HMAC của mã QR không hợp lệ hoặc dữ liệu vé đã bị can thiệp, chỉnh sửa',
        'INVALID_QR_SIGNATURE'
      );
    }

    // 4. CHỐNG CHECK-IN TRÙNG & KIỂM TRA TRẠNG THÁI VÉ
    if (ticket.status === TicketStatus.Used) {
      throw new AppError(
        400,
        `Vé #${ticket.id} (${ticket.seat?.code || ''}) đã được quét check-in trước đó vào lúc ${ticket.updatedAt.toISOString()}. Không thể check-in lần thứ hai.`,
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

    // 5. THỰC THI RÀNG BUỘC THỜI GIAN THEO FR-CHK-01 (Requirement 5)
    if (ticket.screening?.startTime) {
      const startTime = new Date(ticket.screening.startTime);
      const endTime = ticket.screening.endTime
        ? new Date(ticket.screening.endTime)
        : new Date(startTime.getTime() + (ticket.screening.movie?.duration || 120) * 60 * 1000);

      const timeValidation = validateCheckInTime(startTime, endTime);
      if (!timeValidation.isValid) {
        throw new AppError(
          400,
          timeValidation.reason || 'Thời điểm hiện tại không nằm trong khung giờ check-in hợp lệ',
          timeValidation.code || 'INVALID_CHECKIN_TIME'
        );
      }
    }

    // 6. KIỂM TRA ĐÚNG PHÒNG CHIẾU (Requirement 5)
    if (scannedRoom && ticket.screening?.room) {
      const roomValidation = validateCheckInRoom(ticket.screening.room, scannedRoom);
      if (!roomValidation.isValid) {
        throw new AppError(
          400,
          roomValidation.reason || 'Sai phòng chiếu',
          'ROOM_MISMATCH'
        );
      }
    }

    // 7. CẬP NHẬT TRẠNG THÁI VÉ THÀNH USED
    const checkInTime = new Date();
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TicketStatus.Used,
      },
    });

    // 8. Trả về kết quả qua apiResponse
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
        checked_in_at: checkInTime.toISOString(),
        checkedInAt: checkInTime.toISOString(),
        verified_by: {
          staff_id: Number(session.user.id),
          role: userRole,
          hmac_verified: true,
          fr_chk_01_compliant: true,
        },
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
