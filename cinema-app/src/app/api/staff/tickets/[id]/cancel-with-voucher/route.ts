import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { cancelTicket, CancellationFault } from '@/lib/ticket-cancellation';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';
import { sendVoucherIssued } from '@/lib/email';

export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };
export interface StaffCancelTicketResult {
  ticket_id: number;
  status: string;
  released_seat: string | null;
  refund_percentage: number;
  refund_amount: number;
  refund_status: 'PENDING_REFUND' | 'REFUNDED' | null;
  reason: string;
  compensation_voucher: {
    code: string;
    discount_value: number;
    expiry_date: string;
    message: string;
  } | null;
}

/** Hủy một vé do lỗi khách hoặc lỗi rạp; hoàn tiền mặt được xác nhận ở endpoint riêng. */
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const actor = await requireAuth(['STAFF', 'ADMIN']);
    const { id } = await params;
    const ticketId = Number(id);
    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) return apiResponse(false, undefined, 'Mã vé không hợp lệ', 400);
    const body = await request.json() as { fault?: CancellationFault; reason?: string };
    if (body.fault !== 'CUSTOMER' && body.fault !== 'CINEMA') {
      return apiResponse(false, undefined, 'Vui lòng chọn lỗi khách hoặc lỗi rạp', 400);
    }
    const result = await cancelTicket({
      ticketId, actorId: actor.id, actorRole: actor.role,
      fault: body.fault, reason: typeof body.reason === 'string' ? body.reason : '',
    });
    if (result.voucher && result.customerEmail) {
      sendVoucherIssued(result.customerEmail, result.voucher.code, {
        customerName: result.customerName,
        discountPercent: 50,
        expiryDate: result.voucher.expiryDate,
        reason: result.reason,
        ticketId,
      }).catch(error => console.warn('[EmailService] Không gửi được voucher:', error));
    }
    const payload: StaffCancelTicketResult = {
      ticket_id: ticketId,
      status: result.status,
      released_seat: result.seatCode,
      refund_percentage: body.fault === 'CINEMA' ? 100 : 0,
      refund_amount: result.refund?.amount ?? 0,
      refund_status: result.refund ? 'PENDING_REFUND' : null,
      reason: result.reason,
      compensation_voucher: result.voucher && {
        code: result.voucher.code,
        discount_value: 50,
        expiry_date: result.voucher.expiryDate.toISOString(),
        message: 'Giảm 50% trên một vé, dùng một lần trong 30 ngày',
      },
    };
    return apiResponse(true, payload, body.fault === 'CINEMA' ? 'Đã hủy vé, đang chờ hoàn tiền mặt' : 'Đã hủy vé và cấp voucher 50%');
  } catch (error) {
    const result = handleError(error);
    return apiResponse(false, undefined, result.error, result.statusCode, result.code);
  }
}
