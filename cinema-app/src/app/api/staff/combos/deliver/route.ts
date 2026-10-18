import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { apiResponse } from '@/lib/api-response';
import { handleError, AppError } from '@/lib/error';

export const dynamic = 'force-dynamic';

/**
 * POST /api/staff/combos/deliver
 * Xác nhận giao bắp nước cho khách hàng & CHẶN NHẬN LẦN HAI
 * 
 * Body:
 * - orderComboId?: number (giao 1 combo cụ thể)
 * - orderComboIds?: number[] (giao đồng loạt nhiều combo trong đơn)
 * - paymentId?: number (giao tất cả combo của hóa đơn)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(['STAFF', 'ADMIN']);
    const body = await request.json();
    const { orderComboId, orderComboIds, paymentId } = body;

    let targetIds: number[] = [];

    if (Array.isArray(orderComboIds) && orderComboIds.length > 0) {
      targetIds = orderComboIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0);
    } else if (orderComboId) {
      const id = Number(orderComboId);
      if (!isNaN(id) && id > 0) targetIds = [id];
    } else if (paymentId) {
      const pid = Number(paymentId);
      if (isNaN(pid) || pid <= 0) {
        throw new AppError(400, 'Mã hóa đơn paymentId không hợp lệ', 'INVALID_PAYMENT_ID');
      }
      const existingCombos = await prisma.orderCombo.findMany({
        where: { paymentId: pid },
        select: { id: true },
      });
      targetIds = existingCombos.map((c) => c.id);
    }

    if (targetIds.length === 0) {
      throw new AppError(
        400,
        'Vui lòng cung cấp mã combo (orderComboId hoặc orderComboIds) cần giao nhận',
        'MISSING_COMBO_IDS'
      );
    }

    // 1. Kiểm tra trạng thái hiện tại của tất cả các combo này
    const currentCombos = await prisma.orderCombo.findMany({
      where: { id: { in: targetIds } },
      include: {
        combo: {
          select: { name: true },
        },
        payment: {
          select: {
            id: true,
            status: true,
            transactionCode: true,
            user: { select: { name: true, phone: true } },
          },
        },
      },
    });

    if (currentCombos.length === 0) {
      throw new AppError(404, 'Không tìm thấy thông tin bắp nước yêu cầu', 'COMBO_NOT_FOUND');
    }
    if (new Set(targetIds).size !== targetIds.length || currentCombos.length !== targetIds.length) {
      throw new AppError(400, 'Danh sách combo có mã trùng hoặc không tồn tại', 'INVALID_COMBO_IDS');
    }

    // 2. NGHIỆP VỤ BẢO VỆ CHẶN NHẬN LẦN HAI (Anti-Double Claim Rule)
    const alreadyDelivered = currentCombos.filter((c) => c.isDelivered);
    if (alreadyDelivered.length > 0) {
      const deliveredNames = alreadyDelivered
        .map((c) => `"${c.combo.name}" (đã nhận lúc ${c.deliveredAt ? new Date(c.deliveredAt).toLocaleTimeString('vi-VN') + ' ' + new Date(c.deliveredAt).toLocaleDateString('vi-VN') : 'trước đó'})`)
        .join(', ');
      
      throw new AppError(
        400,
        `CẢNH BÁO TRÙNG LẶP: Combo ${deliveredNames} đã được nhận trước đó. Hệ thống nghiêm cấm giao nhận lần 2!`,
        'COMBO_ALREADY_DELIVERED'
      );
    }

    // 3. Kiểm tra thanh toán có hợp lệ không
    for (const c of currentCombos) {
      if (c.payment.status !== 'Success') {
        throw new AppError(
          400,
          `Đơn hàng #${c.payment.id} chưa thanh toán thành công (Trạng thái: ${c.payment.status}). Không thể giao hàng!`,
          'PAYMENT_NOT_SUCCESS'
        );
      }
    }

    // 4. Cập nhật trạng thái giao nhận
    const deliverTime = new Date();
    await prisma.$transaction(async tx => {
      const updated = await tx.orderCombo.updateMany({
        where: { id: { in: targetIds }, isDelivered: false, payment: { status: 'Success' } },
        data: { isDelivered: true, deliveredAt: deliverTime },
      });
      if (updated.count !== targetIds.length) throw new AppError(409, 'Combo đã được giao hoặc đơn không hợp lệ', 'COMBO_ALREADY_DELIVERED');
    });

    return apiResponse(
      true,
      {
        deliveredCount: targetIds.length,
        deliveredAt: deliverTime.toISOString(),
        deliveredBy: session.name || 'Nhân viên quầy',
        combos: currentCombos.map((c) => ({
          orderComboId: c.id,
          name: c.combo.name,
          quantity: c.quantity,
          customerName: c.payment.user.name,
          transactionCode: c.payment.transactionCode,
        })),
      },
      `Xác nhận giao thành công ${targetIds.length} phần combo bắp nước cho khách hàng!`,
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
