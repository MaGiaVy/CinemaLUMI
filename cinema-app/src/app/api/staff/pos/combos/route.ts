import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth-helpers';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface PosComboSaleItem {
  combo_id: number;
  quantity: number;
}

interface PosComboSalePayload {
  items: PosComboSaleItem[];
  customer_name?: string;
  customer_phone?: string;
  payment_method?: 'Cash' | 'BankCard';
}

async function resolveCustomer(name?: string, phone?: string) {
  if (phone && phone.trim()) {
    const found = await prisma.user.findFirst({ where: { phone: phone.trim() } });
    if (found) return found;
  }

  const guestEmail = phone?.trim() 
    ? `${phone.trim()}@guest.lumicinema.vn` 
    : `guest_combo_${Date.now().toString().slice(-6)}@lumicinema.vn`;

  return await prisma.user.upsert({
    where: { email: guestEmail },
    update: {
      name: name?.trim() || 'Khách mua bắp nước quầy',
      phone: phone?.trim() || null,
    },
    create: {
      email: guestEmail,
      name: name?.trim() || 'Khách mua bắp nước quầy',
      phone: phone?.trim() || null,
      password: '$2a$10$wKkS54.1qE68zKkQZ6w0kOu0gQk0gQk0gQk0gQk0gQk0gQk0gQk0g',
      role: 'CUSTOMER',
    },
  });
}

/**
 * POST /api/staff/pos/combos
 * 
 * Bán bắp nước độc lập trực tiếp tại quầy:
 * - Yêu cầu quyền STAFF hoặc ADMIN.
 * - Khách hàng không cần mua vé xem phim vẫn có thể mua bắp nước.
 * - Thu tiền mặt (Cash) và trừ tồn kho ngay lập tức.
 */
export async function POST(request: NextRequest) {
  try {
    const staff = await requireAuth(['STAFF', 'ADMIN']);

    let body: PosComboSalePayload;
    try {
      body = await request.json();
    } catch {
      throw new AppError(400, 'Dữ liệu gửi lên không đúng định dạng JSON', 'INVALID_JSON');
    }

    const { items, customer_name, customer_phone, payment_method = 'Cash' } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError(400, 'Danh sách món bắp nước (items) không được để trống', 'EMPTY_ITEMS');
    }
    if (payment_method !== 'Cash' && payment_method !== 'BankCard') {
      throw new AppError(400, 'Chỉ hỗ trợ tiền mặt hoặc xác nhận chuyển khoản tại quầy', 'INVALID_PAYMENT_METHOD');
    }
    if (!items.every(item => Number.isSafeInteger(item.combo_id) && item.combo_id > 0 && Number.isSafeInteger(item.quantity) && item.quantity > 0)) {
      throw new AppError(400, 'Danh sách combo không hợp lệ', 'INVALID_ITEMS');
    }

    // 1. Kiểm tra tồn kho của từng combo
    const comboIds = items.map(i => i.combo_id);
    const dbCombos = await prisma.combo.findMany({
      where: { id: { in: comboIds } },
    });

    let totalAmount = 0;
    const itemDetails: Array<{ combo_id: number; name: string; quantity: number; unit_price: number; total_price: number }> = [];

    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        throw new AppError(400, 'Số lượng combo phải lớn hơn 0', 'INVALID_QUANTITY');
      }

      const combo = dbCombos.find(c => c.id === item.combo_id);
      if (!combo) {
        throw new AppError(404, `Không tìm thấy combo #${item.combo_id}`, 'COMBO_NOT_FOUND');
      }
      if (combo.status !== 'ACTIVE') throw new AppError(400, 'Combo đã ngừng bán', 'COMBO_INACTIVE');

      if (combo.stock < item.quantity) {
        throw new AppError(400, `Combo "${combo.name}" trong kho chỉ còn ${combo.stock} phần, không đủ để bán`, 'OUT_OF_STOCK');
      }

      const unitPrice = Number(combo.price);
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      itemDetails.push({
        combo_id: combo.id,
        name: combo.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: itemTotal,
      });
    }

    // 2. Xác định khách hàng
    const customer = await resolveCustomer(customer_name, customer_phone);

    // 3. Thực thi transaction trừ kho và tạo đơn thanh toán thành công
    const transactionCode = `POS_COMBO_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 3.1. Tạo Payment đã thanh toán
      const payment = await tx.payment.create({
        data: {
          userId: customer.id,
          amount: totalAmount,
          paymentMethod: payment_method as PaymentMethod,
          soldById: staff.id,
          transactionCode,
          status: PaymentStatus.Success,
        },
      });

      // 3.2. Trừ tồn kho và tạo OrderCombo
      for (const item of itemDetails) {
        const decreased = await tx.combo.updateMany({
          where: { id: item.combo_id, status: 'ACTIVE', stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (decreased.count !== 1) throw new AppError(409, 'Combo vừa hết hàng', 'OUT_OF_STOCK');
      }

      await tx.orderCombo.createMany({
        data: itemDetails.map(item => ({
          paymentId: payment.id,
          comboId: item.combo_id,
          quantity: item.quantity,
          price: item.unit_price,
          isDelivered: true,
          deliveredAt: new Date(),
        })),
      });

      return payment;
    });

    const receipt = {
      receipt_no: `REC-COMBO-${result.id}`,
      staff_name: staff.name,
      staff_id: staff.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      items: itemDetails,
      total_amount: totalAmount,
      payment_method: payment_method,
      issued_at: new Date().toISOString(),
    };

    return apiResponse(
      true,
      receipt,
      `Bán bắp nước thành công! Đã thu ${totalAmount.toLocaleString('vi-VN')} đ và cập nhật tồn kho.`,
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
