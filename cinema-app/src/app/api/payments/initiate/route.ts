import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { calculateTicketPrice } from '@/lib/pricing';
import { PaymentMethod, PaymentStatus, SeatStatus, Prisma } from '@prisma/client';
import { createVnpayPaymentUrl, VNPAY_CONFIG } from '@/lib/vnpay';
import { createMomoPayment, isMomoConfigured } from '@/lib/momo';
import { allocateTicketDiscount } from '@/lib/ticket-discount';

export const dynamic = 'force-dynamic';

/**
 * Interface cấu trúc chi tiết cho vé và combo trong kết quả khởi tạo thanh toán
 */
export interface TicketBreakdownItem {
  type: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface ComboBreakdownItem {
  combo_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AppliedCouponInfo {
  coupon_id: number;
  code: string;
  discount_type: 'Percentage' | 'FixedAmount';
  discount_value: number;
  discount_amount: number;
}

export interface InitiatePaymentResult {
  payment_id: number;
  paymentId: number;
  transaction_code: string;
  transactionCode: string;
  amount: number;
  original_amount: number;
  originalAmount: number;
  discount_amount: number;
  discountAmount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  paymentMethod: PaymentMethod;
  vnpay_url: string;
  vnpayUrl: string;
  breakdown: {
    screening_id: number;
    screeningId: number;
    movie_title: string;
    movieTitle: string;
    seat_ids: number[];
    seatIds: number[];
    seat_codes: string[];
    seatCodes: string[];
    ticket_total: number;
    ticketTotal: number;
    ticket_items: TicketBreakdownItem[];
    ticketItems: TicketBreakdownItem[];
    combo_total: number;
    comboTotal: number;
    combo_items: ComboBreakdownItem[];
    comboItems: ComboBreakdownItem[];
    subtotal: number;
    coupon: AppliedCouponInfo | null;
    discount_amount: number;
    discountAmount: number;
    final_amount: number;
    finalAmount: number;
  };
}

// Zod Schema cho từng mục vé
const ticketItemSchema = z
  .object({
    type: z.string().trim().min(1, 'Tên loại vé không được để trống').optional(),
    ticket_type: z.string().trim().min(1).optional(),
    ticketType: z.string().trim().min(1).optional(),
    quantity: z.coerce.number().int('Số lượng vé phải là số nguyên').positive('Số lượng vé phải lớn hơn 0'),
    price_percentage: z.coerce.number().min(0, 'Tỷ lệ giá vé không được âm').optional(),
    percentage: z.coerce.number().min(0, 'Tỷ lệ giá vé không được âm').optional(),
  })
  .refine(item => Boolean(item.type || item.ticket_type || item.ticketType), {
    message: 'Mỗi loại vé cần chỉ định tên (type hoặc ticket_type)',
  });

// Zod Schema cho từng mục combo bắp nước
const comboItemSchema = z
  .object({
    reservation_id: z.coerce.number().int().positive().optional(),
    combo_id: z.coerce.number().int().positive('combo_id phải là số nguyên dương').optional(),
    comboId: z.coerce.number().int().positive('combo_id phải là số nguyên dương').optional(),
    id: z.coerce.number().int().positive('combo_id phải là số nguyên dương').optional(),
    quantity: z.coerce.number().int('Số lượng combo phải là số nguyên').positive('Số lượng combo phải lớn hơn 0'),
  })
  .refine(item => item.combo_id !== undefined || item.comboId !== undefined || item.id !== undefined, {
    message: 'Mỗi combo bắp nước phải có combo_id',
  });

// Zod Schema xác thực toàn bộ payload cho POST /api/payments/initiate
const initiatePaymentSchema = z
  .object({
    screening_id: z.coerce.number().int().positive('screening_id phải là số nguyên dương').optional(),
    screeningId: z.coerce.number().int().positive('screening_id phải là số nguyên dương').optional(),
    seat_ids: z.array(z.coerce.number().int().positive('Mã ghế phải là số nguyên dương')).min(1, 'Vui lòng chọn ít nhất 1 ghế').optional(),
    seatIds: z.array(z.coerce.number().int().positive('Mã ghế phải là số nguyên dương')).min(1, 'Vui lòng chọn ít nhất 1 ghế').optional(),
    ticket_items: z.array(ticketItemSchema).optional(),
    ticketItems: z.array(ticketItemSchema).optional(),
    combo_items: z.array(comboItemSchema).optional(),
    comboItems: z.array(comboItemSchema).optional(),
    coupon_code: z.string().trim().optional().nullable(),
    couponCode: z.string().trim().optional().nullable(),
    voucher_seat_id: z.coerce.number().int().positive().optional(),
    voucherSeatId: z.coerce.number().int().positive().optional(),
    payment_method: z.string().trim().optional(),
    paymentMethod: z.string().trim().optional(),
    user_id: z.coerce.number().int().positive().optional(),
    userId: z.coerce.number().int().positive().optional(),
  })
  .refine(data => data.screening_id !== undefined || data.screeningId !== undefined, {
    message: 'Vui lòng cung cấp mã suất chiếu (screening_id)',
    path: ['screening_id'],
  })
  .refine(data => (data.seat_ids && data.seat_ids.length > 0) || (data.seatIds && data.seatIds.length > 0), {
    message: 'Vui lòng chọn ít nhất 1 ghế ngồi (seat_ids)',
    path: ['seat_ids'],
  });

/**
 * Hàm phân loại phương thức thanh toán an toàn
 */
function resolvePaymentMethod(rawMethod?: string): PaymentMethod {
  if (!rawMethod) return PaymentMethod.VNPay;
  const normalized = rawMethod.trim().toLowerCase();
  if (normalized === 'momo') return PaymentMethod.Momo;
  if (normalized === 'cash' || normalized === 'tien_mat') return PaymentMethod.Cash;
  if (normalized === 'bankcard' || normalized === 'banking' || normalized === 'bank') return PaymentMethod.BankCard;
  return PaymentMethod.VNPay;
}

/**
 * POST /api/payments/initiate
 * 
 * Khởi tạo phiên thanh toán cho khách hàng:
 * 1. Xác thực payload: screening_id, seat_ids[], ticket_items, combo_items, coupon_code.
 * 2. Tính toán toàn bộ chi phí ở Server-side (không tin tưởng giá tiền từ client gửi lên):
 *    - Tính giá ghế / loại vé theo suất chiếu (screening.price + tỷ lệ vé qua calculateTicketPrice).
 *    - Tính tiền các combo bắp nước dựa trên bảng combos trong Database.
 *    - Kiểm tra và trừ chiết khấu nếu mã coupon hợp lệ (hạn dùng, lượt dùng, giá trị đơn tối thiểu, đúng phim).
 * 3. Sử dụng Database Transaction (prisma.$transaction):
 *    - Tạo bản ghi Payment với trạng thái PENDING.
 *    - Tạo các bản ghi chi tiết OrderCombo.
 *    - Tạm thời chuyển trạng thái ghế sang RESERVED (hạn giữ chỗ 10 phút).
 * 4. Trả về URL thanh toán từ cổng đã cấu hình.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const parsed = initiatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu khởi tạo thanh toán không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    const data = parsed.data;
    const finalScreeningId = (data.screening_id ?? data.screeningId)!;
    const finalSeatIds = (data.seat_ids ?? data.seatIds)!;
    const rawTicketItems = data.ticket_items ?? data.ticketItems ?? [];
    const rawComboItems = data.combo_items ?? data.comboItems ?? [];
    const rawCouponCode = data.coupon_code ?? data.couponCode;
    const voucherSeatId = data.voucher_seat_id ?? data.voucherSeatId;
    const paymentMethodEnum = resolvePaymentMethod(data.payment_method ?? data.paymentMethod);
    if (paymentMethodEnum !== PaymentMethod.VNPay && paymentMethodEnum !== PaymentMethod.Momo) {
      throw new AppError(400, 'Phương thức này chưa hỗ trợ thanh toán online', 'PAYMENT_METHOD_UNAVAILABLE');
    }
    if (!process.env.NEXTAUTH_URL || (paymentMethodEnum === PaymentMethod.VNPay && (!VNPAY_CONFIG.tmnCode || !VNPAY_CONFIG.hashSecret)) || (paymentMethodEnum === PaymentMethod.Momo && !isMomoConfigured())) {
      throw new AppError(503, 'Cổng thanh toán chưa được cấu hình', 'PAYMENT_GATEWAY_UNAVAILABLE');
    }

    // 1. Xác định User thực hiện thanh toán (Server-side Session Validation)
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      throw new AppError(401, 'Vui lòng đăng nhập để tiến hành đặt vé trực tuyến', 'UNAUTHORIZED');
    }

    const sessionUserId = Number(session.user.id);
    const sessionUserRole = (session.user as { role?: string }).role;

    let effectiveUserId = sessionUserId;

    // Chỉ nhân viên (STAFF) hoặc quản trị (ADMIN) mới được quyền chỉ định user_id khác (cho khách tại quầy)
    if ((sessionUserRole === 'STAFF' || sessionUserRole === 'ADMIN') && (data.user_id || data.userId)) {
      const customUserId = (data.user_id ?? data.userId)!;
      const existingUser = await prisma.user.findUnique({
        where: { id: customUserId },
        select: { id: true },
      });
      if (existingUser) {
        effectiveUserId = existingUser.id;
      }
    }

    // 2. Kiểm tra thông tin suất chiếu từ Database
    const screening = await prisma.screening.findUnique({
      where: { id: finalScreeningId },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            poster: true,
            ageRating: true,
          },
        },
      },
    });

    if (!screening) {
      throw new AppError(404, `Không tìm thấy suất chiếu #${finalScreeningId}`, 'SCREENING_NOT_FOUND');
    }
    if (['CANCELLED', 'ENDED'].includes(screening.status) || screening.endTime <= new Date()) {
      throw new AppError(400, 'Suất chiếu không còn mở bán', 'SCREENING_UNAVAILABLE');
    }
    if (new Set(finalSeatIds).size !== finalSeatIds.length) {
      throw new AppError(400, 'Danh sách ghế bị trùng', 'DUPLICATE_SEATS');
    }

    const basePrice = Number(screening.price);

    // Kiểm tra quy định nhãn độ tuổi phim: Phim T18 / C18 tuyệt đối không áp dụng vé Trẻ em (BR-02)
    const isAdultOnly = screening.movie.ageRating ? /18/i.test(screening.movie.ageRating) : false;
    const hasChildTicket = rawTicketItems.some(item => {
      const type = (item.type || item.ticket_type || item.ticketType || '').toLowerCase();
      return type.includes('trẻ em') || type.includes('child');
    });

    if (isAdultOnly && hasChildTicket) {
      throw new AppError(
        400,
        `Phim "${screening.movie.title}" có nhãn phân loại độ tuổi ${screening.movie.ageRating}, tuyệt đối không áp dụng vé Trẻ em theo quy chế BR-02`,
        'CHILD_TICKET_NOT_ALLOWED'
      );
    }

    // 3. Kiểm tra tính hợp lệ của danh sách ghế
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: finalSeatIds },
        screeningId: finalScreeningId,
      },
      select: {
        id: true,
        code: true,
        type: true,
        status: true,
        reservedUntil: true,
      },
    });

    if (seats.length !== finalSeatIds.length) {
      throw new AppError(
        400,
        'Một hoặc nhiều ghế đã chọn không thuộc về suất chiếu này hoặc không tồn tại',
        'INVALID_SEATS'
      );
    }

    // Kiểm tra xem ghế đã bị ai mua chính thức chưa (OCCUPIED)
    const occupiedSeats = seats.filter(s => s.status === SeatStatus.OCCUPIED);
    if (occupiedSeats.length > 0) {
      const occupiedCodes = occupiedSeats.map(s => s.code).join(', ');
      throw new AppError(
        400,
        `Ghế ${occupiedCodes} đã có người mua. Vui lòng chọn ghế khác.`,
        'SEATS_ALREADY_OCCUPIED'
      );
    }

    // Kiểm tra xem ghế có đang bị người dùng KHÁC giữ chỗ hợp lệ hay không (RESERVED)
    const currentlyReservedSeats = seats.filter(
      s => s.status === SeatStatus.RESERVED && s.reservedUntil && new Date(s.reservedUntil) > new Date()
    );

    if (currentlyReservedSeats.length > 0) {
      // Tìm xem có đơn thanh toán Pending của người dùng KHÁC đang giữ ghế này trong 10 phút gần nhất không
      const otherUserPendingPayments = await prisma.payment.findMany({
        where: {
          screeningId: finalScreeningId,
          status: PaymentStatus.Pending,
          userId: { not: effectiveUserId },
          createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
        select: {
          seatIds: true,
        },
      });

      const otherReservedSeatIds = new Set<number>();
      for (const p of otherUserPendingPayments) {
        if (Array.isArray(p.seatIds)) {
          for (const sId of p.seatIds) {
            otherReservedSeatIds.add(Number(sId));
          }
        }
      }

      const conflictingSeats = currentlyReservedSeats.filter(s => otherReservedSeatIds.has(s.id));
      if (conflictingSeats.length > 0) {
        const conflictCodes = conflictingSeats.map(s => s.code).join(', ');
        throw new AppError(
          400,
          `Ghế [${conflictCodes}] đang được một khách hàng khác giữ chỗ trong phiên thanh toán. Vui lòng chọn ghế khác!`,
          'SEAT_HELD_BY_ANOTHER_USER'
        );
      }
    }

    // 4. SERVER-SIDE CALCULATION: Tính giá vé
    let ticketTotal = 0;
    const ticketBreakdown: TicketBreakdownItem[] = [];

    if (rawTicketItems.length > 0) {
      let totalTicketCount = 0;
      for (const item of rawTicketItems) {
        const rawTypeName = (item.type || item.ticket_type || item.ticketType)!.trim();
        const isChild = rawTypeName.toLowerCase().includes('trẻ em') || rawTypeName.toLowerCase().includes('child');
        const normalizedTypeName = isChild ? 'Trẻ em' : 'Thường';
        const qty = item.quantity;
        totalTicketCount += qty;

        const itemTotal = calculateTicketPrice(
          basePrice,
          normalizedTypeName,
          qty
        );
        const unitPrice = qty > 0 ? Math.round(itemTotal / qty) : basePrice;

        ticketTotal += itemTotal;
        ticketBreakdown.push({
          type: normalizedTypeName,
          quantity: qty,
          unit_price: unitPrice,
          total_price: itemTotal,
        });
      }

      // Xác thực tổng số lượng vé phải khớp với tổng số ghế ngồi đã chọn
      if (totalTicketCount !== finalSeatIds.length) {
        throw new AppError(
          400,
          `Tổng số lượng vé (${totalTicketCount}) không khớp với số ghế đã chọn (${finalSeatIds.length})`,
          'TICKET_SEAT_COUNT_MISMATCH'
        );
      }
    } else {
      // Mặc định tất cả các ghế đã chọn là loại vé 'Thường' (100% base price)
      const count = finalSeatIds.length;
      ticketTotal = calculateTicketPrice(basePrice, 'Thường', count);
      ticketBreakdown.push({
        type: 'Thường',
        quantity: count,
        unit_price: basePrice,
        total_price: ticketTotal,
      });
    }

    // 5. SERVER-SIDE CALCULATION: Tính giá combo bắp nước
    let comboTotal = 0;
    const comboBreakdown: ComboBreakdownItem[] = [];

    const comboReservationIds = rawComboItems.map(item => item.reservation_id);
    if (rawComboItems.length > 0 && (comboReservationIds.some(id => id === undefined) || new Set(comboReservationIds).size !== comboReservationIds.length)) {
      throw new AppError(400, 'Thiếu hoặc trùng mã giữ combo', 'INVALID_COMBO_RESERVATIONS');
    }
    if (rawComboItems.length > 0) {
      // Gom nhóm số lượng theo combo_id
      const comboQtyMap = new Map<number, number>();
      for (const item of rawComboItems) {
        const cId = (item.combo_id ?? item.comboId ?? item.id)!;
        comboQtyMap.set(cId, (comboQtyMap.get(cId) || 0) + item.quantity);
      }

      const comboIds = Array.from(comboQtyMap.keys());
      const combosInDb = await prisma.combo.findMany({
        where: { id: { in: comboIds } },
      });

      if (combosInDb.length !== comboIds.length) {
        throw new AppError(400, 'Một hoặc nhiều combo bắp nước không tồn tại trong hệ thống', 'COMBO_NOT_FOUND');
      }

      for (const combo of combosInDb) {
        if (combo.status !== 'ACTIVE') {
          throw new AppError(400, `Combo "${combo.name}" hiện đã ngưng phục vụ`, 'COMBO_INACTIVE');
        }

        const quantity = comboQtyMap.get(combo.id)!;
        const unitPrice = Number(combo.price);
        const itemTotal = unitPrice * quantity;

        comboTotal += itemTotal;
        comboBreakdown.push({
          combo_id: combo.id,
          name: combo.name,
          quantity,
          unit_price: unitPrice,
          total_price: itemTotal,
        });
      }
    }

    // Tổng tiền phụ (chưa trừ mã giảm giá)
    const subtotal = ticketTotal + comboTotal;

    // 6. SERVER-SIDE CALCULATION: Kiểm tra và tính chiết khấu Coupon (nếu có)
    let appliedCouponInfo: AppliedCouponInfo | null = null;
    let discountAmount = 0;
    let compensationSeatId: number | undefined;
    let couponMaxUsage = 0;

    if (rawCouponCode && rawCouponCode.trim()) {
      const normalizedCode = rawCouponCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });

      if (!coupon) {
        throw new AppError(404, `Mã khuyến mãi "${normalizedCode}" không tồn tại`, 'COUPON_NOT_FOUND');
      }
      couponMaxUsage = coupon.maxUsage;

      // Kiểm tra ngày hết hạn
      const now = new Date();
      const expiryDate = new Date(coupon.expiryDate);
      expiryDate.setHours(23, 59, 59, 999);
      if (expiryDate < now) {
        throw new AppError(
          400,
          `Mã khuyến mãi "${normalizedCode}" đã hết hạn sử dụng (${expiryDate.toLocaleDateString('vi-VN')})`,
          'COUPON_EXPIRED'
        );
      }

      // Kiểm tra số lần sử dụng tối đa
      if (coupon.usedCount >= coupon.maxUsage) {
        throw new AppError(
          400,
          `Mã khuyến mãi "${normalizedCode}" đã hết lượt sử dụng`,
          'COUPON_USAGE_LIMIT_EXCEEDED'
        );
      }

      // Kiểm tra hạn mức đơn hàng tối thiểu
      const minAmount = Number(coupon.minAmount);
      if (ticketTotal < minAmount) {
        throw new AppError(
          400,
          `Đơn hàng cần đạt tối thiểu ${minAmount.toLocaleString('vi-VN')} đ để áp dụng mã "${normalizedCode}"`,
          'MIN_AMOUNT_NOT_REACHED'
        );
      }

      // Kiểm tra phim áp dụng
      if (coupon.applicableMovieId !== null && coupon.applicableMovieId !== screening.movieId) {
        throw new AppError(
          400,
          `Mã khuyến mãi "${normalizedCode}" không áp dụng cho phim "${screening.movie.title}"`,
          'COUPON_NOT_APPLICABLE_TO_MOVIE'
        );
      }

      // Kiểm tra người dùng áp dụng (nếu là voucher cá nhân)
      if (coupon.userId !== null && coupon.userId !== effectiveUserId) {
        throw new AppError(
          403,
          `Mã khuyến mãi "${normalizedCode}" chỉ dành riêng cho tài khoản được chỉ định`,
          'COUPON_USER_RESTRICTED'
        );
      }

      // Tính số tiền giảm giá theo SRS: Voucher chỉ áp dụng trên TIỀN VÉ (ticketTotal), không giảm trên combo
      const discountVal = Number(coupon.discountValue);
      if (coupon.sourceTicketId !== null) {
        if (voucherSeatId === undefined && finalSeatIds.length > 1) {
          throw new AppError(400, 'Vui lòng chọn vé áp dụng voucher', 'VOUCHER_TICKET_REQUIRED');
        }
        compensationSeatId = voucherSeatId ?? finalSeatIds[0];
        const ticketIndex = finalSeatIds.indexOf(compensationSeatId);
        if (ticketIndex < 0) throw new AppError(400, 'Vé áp dụng voucher không hợp lệ', 'INVALID_VOUCHER_TICKET');
        const flatPrices = ticketBreakdown.flatMap(item => Array.from({ length: item.quantity }, () => item.unit_price));
        discountAmount = Math.round(flatPrices[ticketIndex] * 0.5);
      } else if (coupon.discountType === 'Percentage') {
        discountAmount = Math.round((ticketTotal * discountVal) / 100);
      } else {
        discountAmount = discountVal;
      }
      if (coupon.maxDiscount !== null) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));

      // Số tiền giảm không được vượt quá tổng tiền vé
      discountAmount = Math.min(discountAmount, ticketTotal);

      appliedCouponInfo = {
        coupon_id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discountType,
        discount_value: discountVal,
        discount_amount: discountAmount,
      };
    }

    // Số tiền cuối cùng khách phải thanh toán: (tiền vé sau giảm giá) + tiền combo
    const finalAmount = Math.max(0, (ticketTotal - discountAmount) + comboTotal);
    const flatTickets = ticketBreakdown.flatMap(item =>
      Array.from({ length: item.quantity }, () => ({ type: item.type, originalPrice: item.unit_price })));
    const ticketSnapshots = allocateTicketDiscount(
      finalSeatIds.map((seatId, index) => ({ seatId, ...flatTickets[index] })),
      discountAmount,
      compensationSeatId
    );

    // 7. THỰC THI TRANSACTION: Tạo Payment PENDING và cập nhật trạng thái giữ chỗ
    const nowTime = new Date();
    const transactionCode = `LMC_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const { payment } = await prisma.$transaction(async (tx) => {
      if (appliedCouponInfo) {
        const reserved = await tx.coupon.updateMany({
          where: {
            id: appliedCouponInfo.coupon_id,
            usedCount: { lt: couponMaxUsage },
            expiryDate: { gte: new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate()) },
          },
          data: { usedCount: { increment: 1 } },
        });
        if (reserved.count !== 1) throw new AppError(409, 'Voucher đã hết lượt hoặc hết hạn', 'COUPON_UNAVAILABLE');
      }
      // 7.1. Tạo Payment record với status = Pending kèm order context
      const createdPayment = await tx.payment.create({
        data: {
          userId: effectiveUserId!,
          screeningId: finalScreeningId,
          seatIds: finalSeatIds as unknown as Prisma.InputJsonValue,
          couponCode: appliedCouponInfo ? appliedCouponInfo.code : null,
          couponReserved: Boolean(appliedCouponInfo),
          ticketItems: ticketSnapshots as unknown as Prisma.InputJsonValue,
          amount: finalAmount,
          paymentMethod: paymentMethodEnum,
          transactionCode,
          status: PaymentStatus.Pending,
        },
      });

      // Chỉ gắn lượt giữ combo còn hạn của chính người mua vào đơn.
      if (comboBreakdown.length > 0) {
        const reservations = await tx.comboReservation.findMany({
          where: { id: { in: comboReservationIds as number[] }, userId: sessionUserId, paymentId: null, status: 'RESERVED', reservedUntil: { gt: nowTime } },
        });
        if (reservations.length !== rawComboItems.length) throw new AppError(409, 'Lượt giữ combo không hợp lệ hoặc đã hết hạn', 'COMBO_HOLD_CONFLICT');
        const reservationById = new Map(reservations.map(reservation => [reservation.id, reservation]));
        for (const item of rawComboItems) {
          const reservation = reservationById.get(item.reservation_id!);
          if (!reservation || reservation.comboId !== (item.combo_id ?? item.comboId ?? item.id) || reservation.quantity !== item.quantity) {
            throw new AppError(409, 'Số lượng combo không khớp lượt giữ', 'COMBO_HOLD_MISMATCH');
          }
        }
        const attached = await tx.comboReservation.updateMany({
          where: { id: { in: comboReservationIds as number[] }, userId: sessionUserId, paymentId: null, status: 'RESERVED', reservedUntil: { gt: nowTime } },
          data: { paymentId: createdPayment.id },
        });
        if (attached.count !== rawComboItems.length) throw new AppError(409, 'Lượt giữ combo vừa thay đổi', 'COMBO_HOLD_CONFLICT');
        await tx.orderCombo.createMany({
          data: rawComboItems.map(item => ({
            paymentId: createdPayment.id,
            comboId: (item.combo_id ?? item.comboId ?? item.id)!,
            quantity: item.quantity,
            reservationId: item.reservation_id!,
            price: comboBreakdown.find(combo => combo.combo_id === (item.combo_id ?? item.comboId ?? item.id))!.unit_price,
          })),
        });
      }

      // Gắn đúng các ghế đã giữ với đơn; không gia hạn thời gian giữ.
      const attached = await tx.seat.updateMany({
        where: {
          id: { in: finalSeatIds },
          screeningId: finalScreeningId,
          status: SeatStatus.RESERVED,
          holdUserId: sessionUserId,
          holdPaymentId: null,
          reservedUntil: { gt: nowTime },
        },
        data: {
          holdPaymentId: createdPayment.id,
        },
      });
      if (attached.count !== finalSeatIds.length) {
        throw new AppError(409, 'Không thể gắn ghế với đơn thanh toán', 'SEAT_HOLD_CONFLICT');
      }

      return { payment: createdPayment };
    });

    const holdExpiry = seats.reduce<Date>((earliest, seat) =>
      seat.reservedUntil && seat.reservedUntil < earliest ? seat.reservedUntil : earliest,
      new Date(nowTime.getTime() + 10 * 60 * 1000));
    let paymentUrl: string;
    try {
      paymentUrl = paymentMethodEnum === PaymentMethod.Momo
        ? await createMomoPayment({ paymentId: payment.id, amount: finalAmount, baseUrl: process.env.NEXTAUTH_URL })
        : createVnpayPaymentUrl({
            paymentId: payment.id,
            amount: finalAmount,
            returnUrl: new URL('/api/payments/vnpay-return', process.env.NEXTAUTH_URL).toString(),
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1',
            expiresAt: holdExpiry,
          });
    } catch {
      // Timeout có thể xảy ra sau khi cổng đã nhận đơn: giữ Pending để IPN đối soát.
      throw new AppError(502, `Chưa xác nhận được giao dịch #${payment.id}. Vui lòng kiểm tra lại trước khi đặt đơn mới.`, 'PAYMENT_GATEWAY_UNCERTAIN');
    }

    // 9. TRẢ VỀ DỮ LIỆU KẾT QUẢ CHUẨN
    const resultData: InitiatePaymentResult = {
      payment_id: payment.id,
      paymentId: payment.id,
      transaction_code: transactionCode,
      transactionCode: transactionCode,
      amount: finalAmount,
      original_amount: subtotal,
      originalAmount: subtotal,
      discount_amount: discountAmount,
      discountAmount: discountAmount,
      status: payment.status,
      payment_method: payment.paymentMethod ?? PaymentMethod.VNPay,
      paymentMethod: payment.paymentMethod ?? PaymentMethod.VNPay,
      vnpay_url: paymentUrl,
      vnpayUrl: paymentUrl,
      breakdown: {
        screening_id: screening.id,
        screeningId: screening.id,
        movie_title: screening.movie.title,
        movieTitle: screening.movie.title,
        seat_ids: finalSeatIds,
        seatIds: finalSeatIds,
        seat_codes: seats.map(s => s.code),
        seatCodes: seats.map(s => s.code),
        ticket_total: ticketTotal,
        ticketTotal: ticketTotal,
        ticket_items: ticketBreakdown,
        ticketItems: ticketBreakdown,
        combo_total: comboTotal,
        comboTotal: comboTotal,
        combo_items: comboBreakdown,
        comboItems: comboBreakdown,
        subtotal,
        coupon: appliedCouponInfo,
        discount_amount: discountAmount,
        discountAmount: discountAmount,
        final_amount: finalAmount,
        finalAmount: finalAmount,
      },
    };

    return apiResponse(
      true,
      resultData,
      'Khởi tạo phiên thanh toán thành công',
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
