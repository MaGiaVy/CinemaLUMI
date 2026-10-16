import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { apiResponse } from '@/lib/api-response';
import { handleError, AppError } from '@/lib/error';

export const dynamic = 'force-dynamic';

/**
 * GET /api/staff/combos/orders
 * Tra cứu danh sách đơn hàng có bắp nước phục vụ giao nhận tại quầy (Concession Counter)
 * Hỗ trợ lọc theo query: số điện thoại, tên khách, mã thanh toán, mã vé
 * Hỗ trợ lọc theo trạng thái: 'pending' (chưa giao), 'delivered' (đã giao), 'all' (tất cả)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Kiểm tra quyền STAFF hoặc ADMIN
    await requireAuth(['STAFF', 'ADMIN']);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const statusFilter = searchParams.get('status') || 'pending'; // 'pending' | 'delivered' | 'all'

    // Xây dựng điều kiện tìm kiếm
    const whereCondition: any = {
      // Chỉ lấy các payment thành công
      status: 'Success',
      // Phải có ít nhất 1 combo
      orderCombos: {
        some: statusFilter === 'pending'
          ? { isDelivered: false }
          : statusFilter === 'delivered'
          ? { isDelivered: true }
          : {},
      },
    };

    if (query) {
      const parsedId = parseInt(query.replace(/\D/g, ''), 10);
      whereCondition.AND = [
        {
          OR: [
            { transactionCode: { contains: query, mode: 'insensitive' } },
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { user: { phone: { contains: query, mode: 'insensitive' } } },
            { user: { email: { contains: query, mode: 'insensitive' } } },
            ...(!isNaN(parsedId) && parsedId > 0
              ? [
                  { id: parsedId },
                  { tickets: { some: { id: parsedId } } },
                ]
              : []),
          ],
        },
      ];
    }

    const payments = await prisma.payment.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        tickets: {
          select: {
            id: true,
            ticketType: true,
            seat: {
              select: {
                code: true,
              },
            },
            screening: {
              select: {
                room: true,
                startTime: true,
                movie: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
        orderCombos: {
          include: {
            combo: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const formattedOrders = payments.map((p) => {
      const allCombosDelivered = p.orderCombos.every((oc) => oc.isDelivered);
      const someCombosDelivered = p.orderCombos.some((oc) => oc.isDelivered);

      return {
        paymentId: p.id,
        transactionCode: p.transactionCode || `#LMC-PAY-${p.id}`,
        paymentMethod: p.paymentMethod,
        totalAmount: Number(p.amount),
        createdAt: p.createdAt.toISOString(),
        customer: {
          id: p.user.id,
          name: p.user.name,
          phone: p.user.phone || 'Chưa cung cấp',
          email: p.user.email,
        },
        movieInfo: p.tickets[0]?.screening
          ? {
              title: p.tickets[0].screening.movie.title,
              room: p.tickets[0].screening.room,
              startTime: p.tickets[0].screening.startTime.toISOString(),
              seats: p.tickets.map((t) => t.seat?.code).filter(Boolean).join(', '),
            }
          : null,
        combos: p.orderCombos.map((oc) => ({
          orderComboId: oc.id,
          comboId: oc.comboId,
          name: oc.combo.name,
          quantity: oc.quantity,
          price: Number(oc.price),
          image: oc.combo.image,
          isDelivered: oc.isDelivered,
          deliveredAt: oc.deliveredAt ? oc.deliveredAt.toISOString() : null,
        })),
        deliveryStatus: allCombosDelivered
          ? 'DELIVERED'
          : someCombosDelivered
          ? 'PARTIALLY_DELIVERED'
          : 'PENDING',
      };
    });

    return apiResponse(
      true,
      formattedOrders,
      `Đã tải ${formattedOrders.length} đơn hàng bắp nước`,
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
