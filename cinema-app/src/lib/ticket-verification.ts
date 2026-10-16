import crypto from 'crypto';

/**
 * Lấy secret key dùng để ký và xác thực HMAC của mã QR vé
 */
export function getTicketSecret(): string {
  return process.env.NEXTAUTH_SECRET || 'lumi_cinema_ticket_verification_secret_key';
}

/**
 * Tạo chữ ký xác thực số (HMAC-SHA256) cho vé xem phim
 * Chuỗi ký: LMC-TICKET-{ticketId}-{userId}-{seatId}-{status}
 */
export function generateTicketSignature(
  ticketId: number,
  userId: number,
  seatId: number | null,
  status = 'Valid'
): string {
  const secret = getTicketSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(`LMC-TICKET-${ticketId}-${userId}-${seatId || 0}-${status}`)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Xác thực chữ ký số HMAC của vé chống giả mạo mã QR
 */
export function verifyTicketSignature(
  ticketId: number,
  userId: number,
  seatId: number | null,
  signature: string,
  status = 'Valid'
): boolean {
  if (!signature || typeof signature !== 'string') {
    return false;
  }

  const expectedSig = generateTicketSignature(ticketId, userId, seatId, status);
  if (expectedSig.length !== signature.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSig, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch {
    return false;
  }
}

export interface CheckInTimeValidationResult {
  isValid: boolean;
  code?: 'CHECKIN_TOO_EARLY' | 'CHECKIN_EXPIRED';
  reason?: string;
  allowedFrom?: Date;
  allowedUntil?: Date;
}

/**
 * Thực thi ràng buộc nghiệp vụ FR-CHK-01:
 * Chỉ cho phép check-in trong khoảng từ 30 phút trước giờ chiếu đến thời điểm kết thúc suất chiếu.
 *
 * @param startTime Thời gian bắt đầu suất chiếu
 * @param endTime Thời gian kết thúc suất chiếu
 * @param testNow Optional: mock thời điểm hiện tại phục vụ kiểm thử
 */
export function validateCheckInTime(
  startTime: Date,
  endTime: Date,
  testNow?: Date
): CheckInTimeValidationResult {
  const now = testNow || new Date();
  const startTimeMs = startTime.getTime();
  const endTimeMs = endTime.getTime();

  // Khung giờ cho phép check-in: từ startTime - 30 phút đến endTime
  const CHECKIN_WINDOW_MS = 30 * 60 * 1000;
  const allowedFrom = new Date(startTimeMs - CHECKIN_WINDOW_MS);
  const allowedUntil = new Date(endTimeMs);

  const nowMs = now.getTime();

  if (nowMs < allowedFrom.getTime()) {
    const minutesUntilAllowed = Math.ceil((allowedFrom.getTime() - nowMs) / 60000);
    return {
      isValid: false,
      code: 'CHECKIN_TOO_EARLY',
      reason: `Chưa đến khung giờ check-in theo quy định FR-CHK-01. Bạn chỉ có thể check-in từ 30 phút trước giờ chiếu (bắt đầu lúc ${allowedFrom.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}, còn ${minutesUntilAllowed} phút).`,
      allowedFrom,
      allowedUntil,
    };
  }

  if (nowMs > allowedUntil.getTime()) {
    return {
      isValid: false,
      code: 'CHECKIN_EXPIRED',
      reason: `Suất chiếu đã kết thúc vào lúc ${allowedUntil.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}. Vé không còn hiệu lực để check-in theo quy định FR-CHK-01.`,
      allowedFrom,
      allowedUntil,
    };
  }

  return {
    isValid: true,
    allowedFrom,
    allowedUntil,
  };
}

/**
 * Kiểm tra tính khớp phòng chiếu giữa điểm soát vé và thông tin vé
 */
export function validateCheckInRoom(
  ticketRoom: string,
  requestRoom?: string | null
): { isValid: boolean; reason?: string } {
  if (!requestRoom || !requestRoom.trim()) {
    return { isValid: true };
  }

  const normTicket = ticketRoom.trim().toLowerCase();
  const normReq = requestRoom.trim().toLowerCase();

  if (normTicket !== normReq) {
    return {
      isValid: false,
      reason: `Vé này thuộc ${ticketRoom}, không thể check-in tại ${requestRoom}. Vui lòng hướng dẫn khách hàng di chuyển đến đúng phòng chiếu.`,
    };
  }

  return { isValid: true };
}
