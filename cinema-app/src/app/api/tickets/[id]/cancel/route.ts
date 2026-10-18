import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { cancelTicket } from '@/lib/ticket-cancellation';
import { sendVoucherIssued } from '@/lib/email';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

export async function processCustomerCancellation(_request: NextRequest, { params }: Context) {
  try {
    const user = await requireAuth(['CUSTOMER']);
    const { id } = await params;
    const ticketId = Number(id);
    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) return apiResponse(false, undefined, 'Mã vé không hợp lệ', 400);
    const result = await cancelTicket({
      ticketId, actorId: user.id, actorRole: user.role,
      fault: 'CUSTOMER', reason: 'Khách chủ động hủy vé',
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
    return apiResponse(true, {
      ticket_id: result.ticketId,
      status: result.status,
      released_seat: result.seatCode,
      compensation_coupon: result.voucher && {
        code: result.voucher.code,
        discount_type: 'Percentage',
        discount_value: 50,
        expiry_date: result.voucher.expiryDate.toISOString(),
        message: 'Giảm 50% trên một vé, dùng một lần trong 30 ngày',
      },
    }, 'Đã hủy vé và cấp voucher 50%');
  } catch (error) {
    const result = handleError(error);
    return apiResponse(false, undefined, result.error, result.statusCode, result.code);
  }
}

export const POST = processCustomerCancellation;
export const DELETE = processCustomerCancellation;
