import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-helpers';
import { SeatStatus, PaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { calculateTicketPrice } from '@/lib/pricing';
import { allocateTicketDiscount } from '@/lib/ticket-discount';

export const dynamic = 'force-dynamic';

interface PosTicketItem {
  type: string;
  quantity: number;
}

interface PosComboItem {
  combo_id: number;
  quantity: number;
}

interface PosSellTicketPayload {
  screening_id: number;
  seat_ids: number[];
  ticket_items?: PosTicketItem[];
  combo_items?: PosComboItem[];
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  payment_method?: 'Cash' | 'BankCard';
  coupon_code?: string;
  couponCode?: string;
  voucher_seat_id?: number;
  voucherSeatId?: number;
}

function generateTicketSignature(
  ticketId: number,
  userId: number,
  seatId: number | null,
  status: string
): string {
  const secret = process.env.NEXTAUTH_SECRET || 'lumi_cinema_secret_fallback_2026';
  const data = `${ticketId}:${userId}:${seatId ?? 'none'}:${status}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex').substring(0, 16);
}

/**
 * Tìm hoặc khởi tạo tài khoản Khách vãng lai phục vụ bán vé tại quầy
 */
async function resolveCustomer(name?: string, phone?: string, email?: string) {
  if (email && email.trim()) {
    const found = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (found) return found;
  }
  if (phone && phone.trim()) {
    const found = await prisma.user.findFirst({ where: { phone: phone.trim() } });
    if (found) return found;
  }

  // Khách vãng lai mặc định tại quầy
  const guestEmail = email?.trim().toLowerCase() 
    || (phone?.trim() ? `${phone.trim()}@guest.lumicinema.vn` : `guest_pos_${Date.now().toString().slice(-6)}@lumicinema.vn`);

  return await prisma.user.upsert({
    where: { email: guestEmail },
    update: {
      name: name?.trim() || 'Khách vãng lai',
      phone: phone?.trim() || null,
    },
    create: {
      email: guestEmail,
      name: name?.trim() || 'Khách vãng lai',
      phone: phone?.trim() || null,
      password: '$2a$10$wKkS54.1qE68zKkQZ6w0kOu0gQk0gQk0gQk0gQk0gQk0gQk0gQk0g',
      role: 'CUSTOMER',
    },
  });
}

/**
 * POST /api/staff/pos/tickets
 * 
 * Bán vé xem phim trực tiếp tại quầy (POS) cho khách vãng lai:
 * - Yêu cầu quyền STAFF hoặc ADMIN.
 * - Thanh toán tiền mặt (Cash) hoặc chuyển khoản tại quầy.
 * - Xác thực trạng thái ghế, tính tiền vé + combo chuẩn xác.
 * - Xuất vé ngay lập tức (Status: VALID, Seats: OCCUPIED, Payment: SUCCESS).
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireAuth(['STAFF', 'ADMIN']);

    let body: PosSellTicketPayload;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const {
      screening_id,
      seat_ids,
      ticket_items = [],
      combo_items = [],
      customer_name,
      customer_phone,
      customer_email,
      payment_method = 'Cash',
      coupon_code,
      couponCode,
      voucher_seat_id,
      voucherSeatId,
    } = body;

    if (!Number.isSafeInteger(screening_id) || screening_id <= 0) {
      throw new AppError(400, 'Trường screening_id là bắt buộc', 'INVALID_SCREENING_ID');
    }

    if (!Array.isArray(seat_ids) || seat_ids.length === 0 || !seat_ids.every(id => Number.isSafeInteger(id) && id > 0) || new Set(seat_ids).size !== seat_ids.length) {
      throw new AppError(400, 'Danh sách ghế (seat_ids) không được để trống', 'EMPTY_SEATS');
    }
    if (payment_method !== 'Cash' && payment_method !== 'BankCard') {
      throw new AppError(400, 'Chỉ hỗ trợ tiền mặt hoặc xác nhận chuyển khoản tại quầy', 'INVALID_PAYMENT_METHOD');
    }
    if (!Array.isArray(ticket_items) || !Array.isArray(combo_items) ||
      !ticket_items.every(item => typeof item.type === 'string' && Number.isSafeInteger(item.quantity) && item.quantity > 0) ||
      !combo_items.every(item => Number.isSafeInteger(item.combo_id) && item.combo_id > 0 && Number.isSafeInteger(item.quantity) && item.quantity > 0)) {
      throw new AppError(400, 'Số lượng vé hoặc combo không hợp lệ', 'INVALID_QUANTITY');
    }

    // 1. Kiểm tra Suất chiếu
    const screening = await prisma.screening.findUnique({
      where: { id: screening_id },
      include: {
        movie: true,
      },
    });

    if (!screening) {
      throw new AppError(404, `Không tìm thấy suất chiếu #${screening_id}`, 'SCREENING_NOT_FOUND');
    }
    if (['CANCELLED', 'ENDED'].includes(screening.status) || screening.endTime <= new Date()) {
      throw new AppError(400, 'Suất chiếu không còn mở bán', 'SCREENING_UNAVAILABLE');
    }

    const basePrice = Number(screening.price);
    const movieAgeRating = (screening.movie.ageRating || '').toUpperCase();
    const isAdultOnlyMovie = movieAgeRating.includes('18') || movieAgeRating.includes('T18') || movieAgeRating.includes('C18');

    // 2. Kiểm tra tính hợp lệ và trạng thái của các ghế
    const seats = await prisma.seat.findMany({
      where: {
        id: { in: seat_ids },
        screeningId: screening_id,
      },
    });

    if (seats.length !== seat_ids.length) {
      throw new AppError(400, 'Một hoặc nhiều ghế đã chọn không thuộc về suất chiếu này', 'INVALID_SEATS');
    }

    const unavailableSeats = seats.filter(s => s.status === SeatStatus.OCCUPIED || (s.status === SeatStatus.RESERVED && (!s.reservedUntil || s.reservedUntil > new Date())));
    if (unavailableSeats.length > 0) {
      const unavailableCodes = unavailableSeats.map(s => s.code).join(', ');
      throw new AppError(409, `Ghế [${unavailableCodes}] đang được giữ hoặc đã bán`, 'SEATS_UNAVAILABLE');
    }

    // 3. Tính tiền vé
    let ticketTotal = 0;
    const ticketBreakdown: Array<{ type: string; quantity: number; unit_price: number; total_price: number }> = [];

    if (ticket_items.length > 0) {
      let totalQty = 0;
      for (const item of ticket_items) {
        const isChild = item.type.toLowerCase().includes('trẻ em') || item.type.toLowerCase().includes('child');
        if (isChild && isAdultOnlyMovie) {
          throw new AppError(400, `Phim "${screening.movie.title}" gắn nhãn ${movieAgeRating}. Không bán vé trẻ em cho phim này (Quy tắc BR-02).`, 'CHILD_TICKET_NOT_ALLOWED');
        }

        const typeName = isChild ? 'Trẻ em' : 'Thường';
        const qty = item.quantity;
        totalQty += qty;

        const itemTotal = calculateTicketPrice(basePrice, typeName, qty);
        const unitPrice = qty > 0 ? Math.round(itemTotal / qty) : basePrice;

        ticketTotal += itemTotal;
        ticketBreakdown.push({
          type: typeName,
          quantity: qty,
          unit_price: unitPrice,
          total_price: itemTotal,
        });
      }

      if (totalQty !== seat_ids.length) {
        throw new AppError(400, `Tổng số lượng vé (${totalQty}) không khớp với số ghế đã chọn (${seat_ids.length})`, 'TICKET_SEAT_MISMATCH');
      }
    } else {
      ticketTotal = calculateTicketPrice(basePrice, 'Thường', seat_ids.length);
      ticketBreakdown.push({
        type: 'Thường',
        quantity: seat_ids.length,
        unit_price: basePrice,
        total_price: ticketTotal,
      });
    }

    // 4. Tính tiền combo bắp nước
    let comboTotal = 0;
    const comboBreakdown: Array<{ combo_id: number; name: string; quantity: number; unit_price: number; total_price: number }> = [];

    if (combo_items.length > 0) {
      const comboIds = combo_items.map(c => c.combo_id);
      const dbCombos = await prisma.combo.findMany({
        where: { id: { in: comboIds } },
      });

      for (const item of combo_items) {
        const combo = dbCombos.find(c => c.id === item.combo_id);
        if (!combo) {
          throw new AppError(400, `Combo #${item.combo_id} không tồn tại`, 'COMBO_NOT_FOUND');
        }
        if (combo.stock < item.quantity) {
          throw new AppError(400, `Combo "${combo.name}" trong kho chỉ còn ${combo.stock} phần, không đủ ${item.quantity} phần`, 'COMBO_OUT_OF_STOCK');
        }

        const unitPrice = Number(combo.price);
        const itemTotal = unitPrice * item.quantity;
        comboTotal += itemTotal;
        comboBreakdown.push({
          combo_id: combo.id,
          name: combo.name,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: itemTotal,
        });
      }
    }

    // 5. Giải quyết thông tin khách hàng tại quầy
    const customer = await resolveCustomer(customer_name, customer_phone, customer_email);

    // 6. Kiểm tra và áp dụng mã giảm giá (SRS: Khi mua vé online hoặc tại quầy, khách/nhân viên nhập mã)
    const rawCode = coupon_code || couponCode;
    let appliedCoupon: any = null;
    let discountAmount = 0;
    let compensationSeatId: number | undefined;

    if (rawCode && rawCode.trim()) {
      const normalizedCode = rawCode.trim().toUpperCase();
      const coupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });

      if (!coupon) {
        throw new AppError(404, `Mã khuyến mãi "${normalizedCode}" không tồn tại`, 'COUPON_NOT_FOUND');
      }

      const now = new Date();
      const expiryDate = new Date(coupon.expiryDate);
      expiryDate.setHours(23, 59, 59, 999);
      if (expiryDate < now) {
        throw new AppError(400, `Mã khuyến mãi "${normalizedCode}" đã hết hạn sử dụng`, 'COUPON_EXPIRED');
      }

      if (coupon.usedCount >= coupon.maxUsage) {
        throw new AppError(400, `Mã khuyến mãi "${normalizedCode}" đã hết lượt sử dụng`, 'COUPON_USAGE_LIMIT_EXCEEDED');
      }

      const minAmount = Number(coupon.minAmount);
      if (ticketTotal < minAmount) {
        throw new AppError(
          400,
          `Đơn hàng cần đạt tối thiểu ${minAmount.toLocaleString('vi-VN')} đ để áp dụng mã "${normalizedCode}"`,
          'MIN_AMOUNT_NOT_REACHED'
        );
      }

      if (coupon.applicableMovieId !== null && coupon.applicableMovieId !== screening.movieId) {
        throw new AppError(
          400,
          `Mã khuyến mãi "${normalizedCode}" không áp dụng cho phim "${screening.movie.title}"`,
          'COUPON_NOT_APPLICABLE_TO_MOVIE'
        );
      }

      if (coupon.userId !== null && coupon.userId !== customer.id) {
        throw new AppError(
          403,
          `Mã khuyến mãi "${normalizedCode}" chỉ dành riêng cho tài khoản được chỉ định`,
          'COUPON_USER_RESTRICTED'
        );
      }

      const discountVal = Number(coupon.discountValue);
      if (coupon.sourceTicketId !== null) {
        const targetVoucherSeat = voucher_seat_id ?? voucherSeatId;
        if (targetVoucherSeat === undefined && seat_ids.length > 1) {
          throw new AppError(400, 'Vui lòng chọn vé áp dụng voucher', 'VOUCHER_TICKET_REQUIRED');
        }
        compensationSeatId = targetVoucherSeat ?? seat_ids[0];
        const ticketIndex = seat_ids.indexOf(compensationSeatId);
        if (ticketIndex < 0) throw new AppError(400, 'Vé áp dụng voucher không hợp lệ', 'INVALID_VOUCHER_TICKET');
        const flatPrices = ticketBreakdown.flatMap(item => Array.from({ length: item.quantity }, () => item.unit_price));
        discountAmount = Math.round(flatPrices[ticketIndex] * 0.5);
      } else if (coupon.discountType === 'Percentage') {
        discountAmount = Math.round((ticketTotal * discountVal) / 100);
      } else {
        discountAmount = discountVal;
      }
      if (coupon.maxDiscount !== null) discountAmount = Math.min(discountAmount, Number(coupon.maxDiscount));
      discountAmount = Math.min(discountAmount, ticketTotal);
      appliedCoupon = coupon;
    }

    const finalAmount = Math.max(0, (ticketTotal - discountAmount) + comboTotal);
    const flatTickets = ticketBreakdown.flatMap(item =>
      Array.from({ length: item.quantity }, () => ({ type: item.type, originalPrice: item.unit_price }))
    );
    const ticketSnapshots = allocateTicketDiscount(
      seat_ids.map((seatId, index) => ({ seatId, ...flatTickets[index] })),
      discountAmount,
      compensationSeatId
    );

    // 7. Thực thi giao dịch nguyên tử (Atomic Transaction)
    const transactionCode = `POS_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const posResult = await prisma.$transaction(async (tx) => {
      const occupied = await tx.seat.updateMany({
        where: {
          id: { in: seat_ids }, screeningId: screening.id,
          OR: [{ status: SeatStatus.EMPTY }, { status: SeatStatus.RESERVED, reservedUntil: { lt: new Date() }, holdPaymentId: null }],
        },
        data: { status: SeatStatus.OCCUPIED, reservedUntil: null, holdUserId: null, holdPaymentId: null },
      });
      if (occupied.count !== seat_ids.length) throw new AppError(409, 'Ghế vừa được khách khác giữ hoặc mua', 'SEAT_CONFLICT');
      // 7.0. Cập nhật lượt dùng voucher nếu có áp dụng
      if (appliedCoupon) {
        const reserved = await tx.coupon.updateMany({
          where: {
            id: appliedCoupon.id,
            usedCount: { lt: appliedCoupon.maxUsage },
          },
          data: { usedCount: { increment: 1 } },
        });
        if (reserved.count !== 1) throw new AppError(409, 'Voucher đã hết lượt sử dụng', 'COUPON_UNAVAILABLE');
      }

      // 7.1. Tạo Payment đã thanh toán thành công
      const payment = await tx.payment.create({
        data: {
          userId: customer.id,
          screeningId: screening.id,
          seatIds: seat_ids,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
          ticketItems: ticketSnapshots as unknown as Prisma.InputJsonValue,
          amount: finalAmount,
          paymentMethod: payment_method as PaymentMethod,
          soldById: staff.id,
          transactionCode,
          status: PaymentStatus.Success,
        },
      });

      // 7.3. Trừ kho combo và lưu OrderCombo
      if (comboBreakdown.length > 0) {
        for (const c of comboBreakdown) {
          const decremented = await tx.combo.updateMany({
            where: { id: c.combo_id, status: 'ACTIVE', stock: { gte: c.quantity } },
            data: { stock: { decrement: c.quantity } },
          });
          if (decremented.count !== 1) throw new AppError(409, 'Combo vừa hết hàng', 'COMBO_OUT_OF_STOCK');
        }

        await tx.orderCombo.createMany({
          data: comboBreakdown.map(c => ({
            paymentId: payment.id,
            comboId: c.combo_id,
            quantity: c.quantity,
            price: c.unit_price,
            isDelivered: true,
            deliveredAt: new Date(),
          })),
        });
      }

      // 7.4. Tạo bản ghi Tickets với đầy đủ snapshot giá gốc, tiền giảm, tiền thực trả
      const createdTickets = [];

      for (let i = 0; i < seat_ids.length; i++) {
        const sId = seat_ids[i];
        const sObj = seats.find(s => s.id === sId);
        const snapshot = ticketSnapshots[i] || { type: 'Thường', originalPrice: basePrice, discountAmount: 0, paidPrice: basePrice };

        const ticket = await tx.ticket.create({
          data: {
            userId: customer.id,
            screeningId: screening.id,
            seatId: sId,
            paymentId: payment.id,
            ticketType: snapshot.type,
            price: snapshot.paidPrice,
            originalPrice: snapshot.originalPrice,
            discountAmount: snapshot.discountAmount,
            paidPrice: snapshot.paidPrice,
            status: 'Valid',
          },
        });

        const sig = generateTicketSignature(ticket.id, customer.id, sId, 'Valid');
        createdTickets.push({
          id: ticket.id,
          ticket_code: `LMC-${String(ticket.id).padStart(6, '0')}`,
          seat_code: sObj?.code || '',
          ticket_type: ticket.ticketType,
          price: Number(ticket.price),
          original_price: Number(snapshot.originalPrice),
          discount_amount: Number(snapshot.discountAmount),
          paid_price: Number(snapshot.paidPrice),
          status: ticket.status,
          qr_payload: JSON.stringify({
            ticket_id: ticket.id,
            user_id: customer.id,
            seat_code: sObj?.code || '',
            screening_id: screening.id,
            sig,
          }),
        });
      }

      return {
        payment,
        tickets: createdTickets,
      };
    });

    const receipt = {
      receipt_no: `REC-POS-${posResult.payment.id}`,
      staff_name: staff.name,
      staff_id: staff.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      movie_title: screening.movie.title,
      room: screening.room,
      screening_time: screening.startTime.toISOString(),
      ticket_count: posResult.tickets.length,
      tickets: posResult.tickets,
      combos: comboBreakdown,
      ticket_total: ticketTotal,
      discount_amount: discountAmount,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      combo_total: comboTotal,
      final_amount: finalAmount,
      payment_method: payment_method,
      issued_at: new Date().toISOString(),
    };

    return apiResponse(
      true,
      receipt,
      `Bán vé tại quầy thành công! Đã thu ${finalAmount.toLocaleString('vi-VN')} đ tiền mặt và xuất ${posResult.tickets.length} vé.`,
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
