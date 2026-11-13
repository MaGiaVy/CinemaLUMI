import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus, SeatStatus, Ticket } from '@prisma/client';
import { verifyZaloPayCallback } from '@/lib/zalopay';
import { sendTicketConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Interface kết quả xử lý Webhook ZaloPay IPN
 */
export interface ZaloPayIpnResult {
  return_code: number;
  return_message: string;
  payment_id?: number;
  tickets_created_count?: number;
  already_processed?: boolean;
}

/**
 * Hàm lõi thực thi transaction cho Webhook ZaloPay IPN khi THANH TOÁN THÀNH CÔNG
 * Có tính Idempotency: nếu đơn đã Success thì không xử lý lại
 */
export async function processZaloPayPaymentSuccess(
  appTransId: string,
  paidAmount?: number
): Promise<ZaloPayIpnResult> {
  // 1. Tìm đơn hàng theo mã giao dịch ZaloPay (app_trans_id)
  const payment = await prisma.payment.findFirst({
    where: { transactionCode: appTransId },
    include: {
      orderCombos: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!payment) {
    return {
      return_code: 0,
      return_message: `Không tìm thấy đơn hàng với app_trans_id: ${appTransId}`,
    };
  }

  // 2. IDEMPOTENCY CHECK:
  // Nếu đơn hàng đã hoàn tất thành công từ trước, trả về ngay lập tức
  if (payment.status === PaymentStatus.Success) {
    const ticketsCount = await prisma.ticket.count({ where: { paymentId: payment.id } });
    return {
      return_code: 1,
      return_message: 'success',
      payment_id: payment.id,
      tickets_created_count: ticketsCount,
      already_processed: true,
    };
  }

  // Nếu đơn hàng đã bị đánh dấu FAILED từ trước
  if (payment.status === PaymentStatus.Failed) {
    return {
      return_code: 0,
      return_message: 'Order already marked as failed',
      payment_id: payment.id,
      tickets_created_count: 0,
      already_processed: true,
    };
  }

  // Xác thực số tiền thanh toán nếu có
  if (paidAmount !== undefined && !isNaN(paidAmount)) {
    if (Math.abs(Number(payment.amount) - Number(paidAmount)) > 1) {
      console.warn(
        `[ZaloPay IPN] Cảnh báo chênh lệch số tiền: Đơn hàng #${payment.id} có giá ${Number(payment.amount)}, nhận được ${paidAmount}`
      );
    }
  }

  // 3. THỰC THI TRANSACTION ATOMIC
  let transactionResult: { isConflict: boolean; ticketsCreated: Ticket[] };

  try {
    transactionResult = await prisma.$transaction(async (tx) => {
      let seatIds: number[] = [];
      if (Array.isArray(payment.seatIds)) {
        seatIds = payment.seatIds as number[];
      }

      const screeningId = payment.screeningId;

      // 3.1. KIỂM TRA CHỐNG DOUBLE-BOOKING TRƯỚC KHI TẠO VÉ (ISSUE C1)
      if (seatIds.length > 0 && screeningId) {
        const conflictingTickets = await tx.ticket.findMany({
          where: {
            screeningId: screeningId,
            seatId: { in: seatIds },
            status: { in: ['Valid', 'Used'] },
          },
          select: {
            id: true,
            seatId: true,
            status: true,
          },
        });

        if (conflictingTickets.length > 0) {
          const conflictingSeatIds = conflictingTickets.map((t) => t.seatId);
          console.warn(
            `[ZaloPay IPN / Double-Booking Detected] Suất chiếu #${screeningId}, các ghế [${conflictingSeatIds.join(
              ', '
            )}] đã có vé đang hoạt động (${conflictingTickets.map((t) => `#${t.id}(${t.status})`).join(', ')}). SEAT_ALREADY_BOOKED. Giao dịch #${payment.id} bị hủy và cần hoàn tiền.`
          );

          // Đánh dấu giao dịch Payment này thất bại và cần hoàn tiền
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.Failed,
            },
          });

          // Nhả các ghế không bị xung đột về trạng thái EMPTY
          const conflictingSet = new Set(conflictingSeatIds);
          const nonConflictingSeatIds = seatIds.filter((id) => !conflictingSet.has(id));
          if (nonConflictingSeatIds.length > 0) {
            await tx.seat.updateMany({
              where: {
                id: { in: nonConflictingSeatIds },
                status: SeatStatus.RESERVED,
              },
              data: {
                status: SeatStatus.EMPTY,
                reservedUntil: null,
              },
            });
          }

          // Hoàn trả tồn kho cho combo (Issue C3)
          if (payment.orderCombos && payment.orderCombos.length > 0) {
            for (const orderCombo of payment.orderCombos) {
              await tx.combo.update({
                where: { id: orderCombo.comboId },
                data: {
                  stock: { increment: orderCombo.quantity },
                },
              });

              await tx.comboReservation.updateMany({
                where: {
                  comboId: orderCombo.comboId,
                  status: 'RESERVED',
                  ...(payment.userId ? { OR: [{ userId: payment.userId }, { userId: null }] } : {}),
                },
                data: {
                  status: 'RELEASED',
                },
              });
            }
          }

          return {
            isConflict: true,
            ticketsCreated: [],
          };
        }
      }

      // 3.2. Cập nhật Payment -> Success khi không có xung đột ghế
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.Success,
        },
      });

      // 3.3. Cập nhật các ghế sang trạng thái OCCUPIED
      const ticketsCreated: Ticket[] = [];

      if (seatIds.length > 0) {
        await tx.seat.updateMany({
          where: { id: { in: seatIds } },
          data: {
            status: SeatStatus.OCCUPIED,
            reservedUntil: null,
          },
        });

        // Lấy giá gốc suất chiếu
        let basePrice = 100000;
        if (screeningId) {
          const sc = await tx.screening.findUnique({
            where: { id: screeningId },
            select: { price: true },
          });
          if (sc) basePrice = Number(sc.price);
        }

        // Tạo các bản ghi Ticket hợp lệ
        const rawTicketItems = Array.isArray(payment.ticketItems)
          ? (payment.ticketItems as Array<{ type: string; unit_price?: number }>)
          : [];

        for (let i = 0; i < seatIds.length; i++) {
          const sId = seatIds[i];
          const item = rawTicketItems[i];
          const ticketType = item?.type || 'Thường';
          const ticketPrice = item?.unit_price || basePrice;

          const newTicket = await tx.ticket.create({
            data: {
              userId: payment.userId,
              screeningId: screeningId,
              seatId: sId,
              paymentId: payment.id,
              ticketType,
              price: ticketPrice,
              status: 'Valid',
            },
          });
          ticketsCreated.push(newTicket);
        }
      }

      // 3.4. Đánh dấu combo_reservations sang CONFIRMED (Issue C3: KHÔNG trừ tồn kho lần 2 vì đã trừ ở bước reserve)
      if (payment.orderCombos && payment.orderCombos.length > 0) {
        for (const orderCombo of payment.orderCombos) {
          await tx.comboReservation.updateMany({
            where: {
              comboId: orderCombo.comboId,
              status: 'RESERVED',
              ...(payment.userId ? { OR: [{ userId: payment.userId }, { userId: null }] } : {}),
            },
            data: {
              status: 'CONFIRMED',
            },
          });
        }
      }

      // 3.5. Tăng lượt sử dụng mã giảm giá nếu có
      if (payment.couponCode && payment.couponCode.trim()) {
        await tx.coupon.updateMany({
          where: { code: payment.couponCode.trim().toUpperCase() },
          data: {
            usedCount: { increment: 1 },
          },
        });
      }

      return {
        isConflict: false,
        ticketsCreated,
      };
    });
  } catch (err: unknown) {
    const errorAny = err as { code?: string; message?: string };
    if (errorAny?.code === 'P2002' || errorAny?.message?.includes('unique_active_ticket')) {
      console.warn(
        `[ZaloPay IPN / Concurrency Race P2002] Phát hiện xung đột DB unique_active_ticket trên payment #${payment.id}. Đánh dấu Failed và hoàn kho combo.`
      );
      await prisma.$transaction(async (rollbackTx) => {
        await rollbackTx.payment.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.Failed },
        });
        const paymentData = await rollbackTx.payment.findUnique({
          where: { id: payment.id },
          include: { orderCombos: true },
        });
        if (paymentData?.orderCombos) {
          for (const oc of paymentData.orderCombos) {
            await rollbackTx.combo.update({
              where: { id: oc.comboId },
              data: { stock: { increment: oc.quantity } },
            });
            await rollbackTx.comboReservation.updateMany({
              where: { comboId: oc.comboId, status: 'RESERVED' },
              data: { status: 'RELEASED' },
            });
          }
        }
      });

      return {
        return_code: 2,
        return_message: 'SEAT_ALREADY_BOOKED: DB unique constraint conflict, payment marked as Failed',
        payment_id: payment.id,
        tickets_created_count: 0,
        already_processed: false,
      };
    }
    throw err;
  }

  // Nếu bị xung đột ghế do double-booking, không gửi email và trả về kết quả hủy
  if (transactionResult.isConflict) {
    return {
      return_code: 2,
      return_message: 'SEAT_ALREADY_BOOKED: Ghế đã có người đặt trước, giao dịch bị đánh dấu thất bại và cần hoàn tiền',
      payment_id: payment.id,
      tickets_created_count: 0,
      already_processed: false,
    };
  }

  // 4. Gửi email xác nhận đặt vé chạy nền khi thành công
  (async () => {
    try {
      const freshPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
        include: {
          user: true,
          tickets: {
            include: {
              seat: true,
              screening: {
                include: { movie: true },
              },
            },
          },
          orderCombos: {
            include: { combo: true },
          },
        },
      });

      if (freshPayment?.user?.email && freshPayment.tickets.length > 0) {
        const firstTicket = freshPayment.tickets[0];
        const sc = firstTicket.screening;
        const mv = sc?.movie;
        const seatCodes = freshPayment.tickets
          .map((t) => t.seat?.code)
          .filter(Boolean)
          .join(', ');

        const qrData = JSON.stringify({
          payment_id: freshPayment.id,
          tickets: freshPayment.tickets.map((t) => t.id),
          user_id: freshPayment.userId,
          screening_id: sc?.id,
          app_trans_id: appTransId,
          timestamp: Date.now(),
        });

        await sendTicketConfirmation(
          freshPayment.user.email,
          {
            customerName: freshPayment.user.name || undefined,
            ticketId: firstTicket.id,
            ticketCode: `LMC-ZLP-${freshPayment.id}`,
            movieTitle: mv?.title || 'Phim rạp Lumi Cinema',
            room: sc ? `Phòng ${sc.roomNumber || sc.room}` : 'Phòng tiêu chuẩn',
            screeningTime: sc?.startTime
              ? new Date(sc.startTime).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Giờ chiếu',
            date: sc?.startTime
              ? new Date(sc.startTime).toLocaleDateString('vi-VN')
              : 'Hôm nay',
            seats: seatCodes || 'Chưa xếp chỗ',
            combos: freshPayment.orderCombos.map((oc) => ({
              name: oc.combo?.name || 'Combo bắp nước',
              quantity: oc.quantity,
            })),
            totalAmount: Number(freshPayment.amount),
            paymentMethod: 'ZaloPay',
          },
          qrData
        );
      }
    } catch (err) {
      console.error('[ZaloPay IPN] Gửi email xác nhận thất bại:', err);
    }
  })();

  return {
    return_code: 1,
    return_message: 'success',
    payment_id: payment.id,
    tickets_created_count: transactionResult.ticketsCreated.length,
    already_processed: false,
  };
}

/**
 * Hàm lõi xử lý Webhook ZaloPay IPN khi GIAO DỊCH THẤT BẠI / BỊ HỦY (ISSUE C4)
 * - Đổi Payment.status = 'Failed'
 * - Nhả các ghế đang RESERVED về EMPTY (kèm reservedUntil: null)
 * - Hoàn lại tồn kho các combo (stock: { increment: quantity }, status: 'RELEASED')
 */
export async function processZaloPayPaymentFailure(
  appTransId: string
): Promise<ZaloPayIpnResult> {
  // 1. Tìm đơn hàng theo mã giao dịch ZaloPay (app_trans_id)
  const payment = await prisma.payment.findFirst({
    where: { transactionCode: appTransId },
    include: {
      orderCombos: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!payment) {
    return {
      return_code: 0,
      return_message: `Không tìm thấy đơn hàng với app_trans_id: ${appTransId}`,
    };
  }

  // 2. IDEMPOTENCY CHECK:
  // Nếu đơn hàng đã hoàn tất thành công từ trước, không chuyển thành thất bại
  if (payment.status === PaymentStatus.Success) {
    const ticketsCount = await prisma.ticket.count({ where: { paymentId: payment.id } });
    return {
      return_code: 1,
      return_message: 'Order already completed successfully',
      payment_id: payment.id,
      tickets_created_count: ticketsCount,
      already_processed: true,
    };
  }

  // Nếu đơn hàng đã bị đánh dấu FAILED từ trước
  if (payment.status === PaymentStatus.Failed) {
    return {
      return_code: 1,
      return_message: 'Order already marked as failed',
      payment_id: payment.id,
      tickets_created_count: 0,
      already_processed: true,
    };
  }

  // 3. THỰC THI TRANSACTION GIẢI PHÓNG TÀI NGUYÊN (ISSUE C4 & ISSUE C3)
  await prisma.$transaction(async (tx) => {
    // 3.1. Đổi Payment.status = 'Failed'
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.Failed,
      },
    });

    // 3.2. Nhả các ghế đang RESERVED về EMPTY (kèm reservedUntil: null)
    let seatIds: number[] = [];
    if (Array.isArray(payment.seatIds)) {
      seatIds = payment.seatIds as number[];
    }

    if (seatIds.length > 0) {
      await tx.seat.updateMany({
        where: {
          id: { in: seatIds },
          status: SeatStatus.RESERVED,
        },
        data: {
          status: SeatStatus.EMPTY,
          reservedUntil: null,
        },
      });
    }

    // 3.3. Hoàn lại tồn kho các combo (stock: { increment: quantity }) và đổi status: 'RELEASED' (Issue C3)
    if (payment.orderCombos && payment.orderCombos.length > 0) {
      for (const orderCombo of payment.orderCombos) {
        await tx.combo.update({
          where: { id: orderCombo.comboId },
          data: {
            stock: { increment: orderCombo.quantity },
          },
        });

        await tx.comboReservation.updateMany({
          where: {
            comboId: orderCombo.comboId,
            status: 'RESERVED',
            ...(payment.userId ? { OR: [{ userId: payment.userId }, { userId: null }] } : {}),
          },
          data: {
            status: 'RELEASED',
          },
        });
      }
    }
  });

  return {
    return_code: 1,
    return_message: 'Payment marked as Failed, resources released successfully',
    payment_id: payment.id,
    tickets_created_count: 0,
    already_processed: false,
  };
}

/**
 * POST /api/payments/zalopay-ipn
 * 
 * Webhook IPN nhận kết quả thanh toán từ ZaloPay Server:
 * Payload: { data: string, mac: string, type: number }
 */
export async function POST(request: NextRequest) {
  try {
    let body: { data?: string; mac?: string; type?: number; status?: string | number; return_code?: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { return_code: -1, return_message: 'Dữ liệu không đúng định dạng JSON' },
        { status: 400 }
      );
    }

    const { data: dataStr, mac } = body;

    if (!dataStr || !mac) {
      return NextResponse.json(
        { return_code: -1, return_message: 'Thiếu trường data hoặc mac' },
        { status: 400 }
      );
    }

    // 1. Kiểm tra tính hợp lệ của chữ ký callback bằng verifyZaloPayCallback
    const isSignatureValid = verifyZaloPayCallback(dataStr, mac);
    if (!isSignatureValid) {
      console.warn('[ZaloPay IPN] Chữ ký không hợp lệ (mac not equal)');
      return NextResponse.json({
        return_code: -1,
        return_message: 'mac not equal',
      });
    }

    // 2. Parse data thành JSON object lấy app_trans_id và amount
    let parsedData: {
      app_trans_id?: string;
      amount?: number;
      status?: number | string;
      return_code?: number;
    };
    try {
      parsedData = JSON.parse(dataStr);
    } catch {
      return NextResponse.json({
        return_code: 0,
        return_message: 'Dữ liệu data trong callback không thể parse JSON',
      });
    }

    const appTransId = parsedData.app_trans_id;
    if (!appTransId) {
      return NextResponse.json({
        return_code: 0,
        return_message: 'Thiếu thông tin app_trans_id trong data',
      });
    }

    // Xác định trạng thái thành công hay thất bại (Issue C4)
    const statusParam = (parsedData.status !== undefined ? String(parsedData.status) : undefined) ||
                        (body.status !== undefined ? String(body.status) : undefined) ||
                        request.nextUrl.searchParams.get('status');
    const returnCodeParam = parsedData.return_code ?? body.return_code;

    let isSuccess = true;
    if (statusParam) {
      const norm = statusParam.trim().toLowerCase();
      if (norm === 'failed' || norm === '0' || norm === 'fail' || norm === 'cancelled' || norm === 'error') {
        isSuccess = false;
      }
    }
    if (returnCodeParam !== undefined && returnCodeParam !== 1) {
      isSuccess = false;
    }

    // 3. Xử lý cập nhật đơn hàng qua Database Transaction
    const result = isSuccess
      ? await processZaloPayPaymentSuccess(appTransId, parsedData.amount)
      : await processZaloPayPaymentFailure(appTransId);

    return NextResponse.json({
      return_code: result.return_code,
      return_message: result.return_message,
      payment_id: result.payment_id,
      tickets_created_count: result.tickets_created_count,
      already_processed: result.already_processed,
    });
  } catch (error) {
    console.error('[ZaloPay IPN] Lỗi hệ thống khi xử lý callback:', error);
    return NextResponse.json({
      return_code: 0,
      return_message: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

/**
 * GET /api/payments/zalopay-ipn
 * Endpoint hỗ trợ kiểm thử thủ công và monitoring
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appTransId = searchParams.get('app_trans_id') || searchParams.get('txn_code');
  const mac = searchParams.get('mac');
  const isMock = searchParams.get('mock') === 'true';
  const statusParam = searchParams.get('status');
  const returnCodeParam = searchParams.get('return_code') || searchParams.get('code');

  if (!appTransId) {
    return NextResponse.json(
      { return_code: 0, return_message: 'Thiếu tham số app_trans_id' },
      { status: 400 }
    );
  }

  if (mac) {
    const testData = JSON.stringify({ app_trans_id: appTransId });
    const isValid = verifyZaloPayCallback(testData, mac);
    if (!isValid && !isMock) {
      return NextResponse.json({ return_code: -1, return_message: 'mac not equal' });
    }
  }

  let isSuccess = true;
  if (statusParam) {
    const norm = statusParam.trim().toLowerCase();
    if (norm === 'failed' || norm === '0' || norm === 'fail' || norm === 'cancelled' || norm === 'error') {
      isSuccess = false;
    }
  }
  if (returnCodeParam !== undefined && returnCodeParam !== '' && returnCodeParam !== '1') {
    isSuccess = false;
  }

  const result = isSuccess
    ? await processZaloPayPaymentSuccess(appTransId)
    : await processZaloPayPaymentFailure(appTransId);

  return NextResponse.json(result);
}
