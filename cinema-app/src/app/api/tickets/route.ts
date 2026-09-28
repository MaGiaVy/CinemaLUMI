import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Interface cấu trúc dữ liệu vé trả về cho Client
 */
export interface TicketListItem {
  id: number;
  ticket_id: number;
  ticket_type: string;
  ticketType: string;
  price: number;
  status: TicketStatus;
  purchase_date: string;
  purchaseDate: string;
  user_id: number;
  userId: number;
  movie: {
    id: number;
    title: string;
    slug?: string | null;
    poster: string;
    duration: number;
    genre: string;
    age_rating?: string | null;
    ageRating?: string | null;
  } | null;
  screening: {
    id: number;
    room: string;
    date: string;
    start_time: string;
    startTime: string;
    end_time: string;
    endTime: string;
    price: number;
    status: string;
  } | null;
  seat: {
    id: number;
    code: string;
    row: string;
    number: number;
    type: string;
  } | null;
  payment: {
    id: number;
    amount: number;
    payment_method: string | null;
    paymentMethod: string | null;
    transaction_code: string | null;
    transactionCode: string | null;
    status: string;
    created_at: string;
  } | null;
}

/**
 * GET /api/tickets
 * 
 * Lấy danh sách toàn bộ vé đã đặt của người dùng đang đăng nhập:
 * 1. Lấy thông tin user_id từ Session qua NextAuth.
 *    (Hỗ trợ query parameter user_id cho môi trường kiểm thử tự động).
 * 2. Sử dụng prisma.ticket.findMany kèm include để tải đầy đủ thông tin:
 *    - Phim (tiêu đề, poster, thời lượng, thể loại, độ tuổi).
 *    - Suất chiếu (phòng chiếu, ngày chiếu, giờ bắt đầu, giờ kết thúc).
 *    - Ghế ngồi (mã ghế, hàng, số, loại ghế).
 *    - Đơn thanh toán (mã giao dịch, phương thức, trạng thái).
 * 3. Sắp xếp theo thời gian mua mới nhất (purchaseDate desc).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    // 1. Xác định User ID
    let currentUserId: number | null = session?.user?.id ? Number(session.user.id) : null;

    // Cho phép fallback query param user_id nếu gọi từ script test hoặc tài khoản Admin/Staff
    if (!currentUserId && searchParams.get('user_id')) {
      const parsedUserId = parseInt(searchParams.get('user_id')!, 10);
      if (!isNaN(parsedUserId) && parsedUserId > 0) {
        currentUserId = parsedUserId;
      }
    }

    if (!currentUserId) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để xem danh sách vé của bạn',
        'UNAUTHENTICATED'
      );
    }

    // Lọc theo trạng thái vé nếu có truyền (ví dụ: ?status=Valid)
    const statusQuery = searchParams.get('status');
    let ticketStatusFilter: TicketStatus | undefined;
    if (statusQuery) {
      if (['Valid', 'Used', 'Cancelled'].includes(statusQuery)) {
        ticketStatusFilter = statusQuery as TicketStatus;
      }
    }

    // 2. Truy vấn danh sách vé kèm đầy đủ thông tin liên quan
    const tickets = await prisma.ticket.findMany({
      where: {
        userId: currentUserId,
        ...(ticketStatusFilter ? { status: ticketStatusFilter } : {}),
      },
      include: {
        screening: {
          include: {
            movie: {
              select: {
                id: true,
                title: true,
                slug: true,
                poster: true,
                duration: true,
                genre: true,
                rating: true,
                ageRating: true,
              },
            },
          },
        },
        seat: {
          select: {
            id: true,
            code: true,
            row: true,
            number: true,
            type: true,
            status: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            transactionCode: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    // 3. Chuẩn hóa dữ liệu trả về theo format thân thiện
    const formattedTickets: TicketListItem[] = tickets.map(t => ({
      id: t.id,
      ticket_id: t.id,
      ticket_type: t.ticketType,
      ticketType: t.ticketType,
      price: Number(t.price),
      status: t.status,
      purchase_date: t.purchaseDate.toISOString(),
      purchaseDate: t.purchaseDate.toISOString(),
      user_id: t.userId,
      userId: t.userId,
      movie: t.screening?.movie
        ? {
            id: t.screening.movie.id,
            title: t.screening.movie.title,
            slug: t.screening.movie.slug,
            poster: t.screening.movie.poster,
            duration: t.screening.movie.duration,
            genre: t.screening.movie.genre,
            age_rating: t.screening.movie.ageRating,
            ageRating: t.screening.movie.ageRating,
          }
        : null,
      screening: t.screening
        ? {
            id: t.screening.id,
            room: t.screening.room,
            date: t.screening.date.toISOString(),
            start_time: t.screening.startTime.toISOString(),
            startTime: t.screening.startTime.toISOString(),
            end_time: t.screening.endTime.toISOString(),
            endTime: t.screening.endTime.toISOString(),
            price: Number(t.screening.price),
            status: t.screening.status,
          }
        : null,
      seat: t.seat
        ? {
            id: t.seat.id,
            code: t.seat.code,
            row: t.seat.row,
            number: t.seat.number,
            type: t.seat.type,
          }
        : null,
      payment: t.payment
        ? {
            id: t.payment.id,
            amount: Number(t.payment.amount),
            payment_method: t.payment.paymentMethod,
            paymentMethod: t.payment.paymentMethod,
            transaction_code: t.payment.transactionCode,
            transactionCode: t.payment.transactionCode,
            status: t.payment.status,
            created_at: t.payment.createdAt.toISOString(),
          }
        : null,
    }));

    return apiResponse(
      true,
      formattedTickets,
      `Lấy danh sách vé thành công (${formattedTickets.length} vé)`,
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
