import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { TicketStatus, SeatStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Interface cấu trúc dữ liệu phản hồi vé cho Nhân viên / Quản trị viên
 */
export interface StaffTicketSearchResult {
  id: number;
  ticket_id: number;
  ticketId: number;
  ticket_type: string;
  ticketType: string;
  price: number;
  status: TicketStatus;
  purchase_date: string;
  purchaseDate: string;
  ticket_code: string;
  ticketCode: string;

  // Thông tin khách hàng
  customer: {
    id: number;
    user_id: number;
    userId: number;
    name: string;
    full_name: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: string;
  };

  // Thông tin phim
  movie: {
    id: number;
    movie_id: number;
    movieId: number;
    title: string;
    poster: string;
    duration: number;
    genre: string;
    age_rating: string | null;
    ageRating: string | null;
  } | null;

  // Thông tin suất chiếu và tình trạng phòng chiếu
  screening: {
    id: number;
    screening_id: number;
    screeningId: number;
    room: string;
    room_number: number | null;
    roomNumber: number | null;
    date: string;
    start_time: string;
    startTime: string;
    end_time: string;
    endTime: string;
    price: number;
    status: string;
    total_seats: number;
    occupied_seats: number;
    reserved_seats: number;
    empty_seats: number;
  } | null;

  // Thông tin ghế & tình trạng ghế hiện tại của hệ thống (EMPTY, RESERVED, OCCUPIED)
  seat: {
    id: number;
    seat_id: number;
    seatId: number;
    code: string;
    row: string;
    number: number;
    type: string;
    status: SeatStatus;
    seat_status: SeatStatus;
    seatStatus: SeatStatus;
    reserved_until: string | null;
    reservedUntil: string | null;
  } | null;

  // Thông tin thanh toán và bắp nước đính kèm
  payment: {
    id: number;
    payment_id: number;
    paymentId: number;
    amount: number;
    payment_method: string | null;
    paymentMethod: string | null;
    transaction_code: string | null;
    transactionCode: string | null;
    coupon_code: string | null;
    couponCode: string | null;
    status: string;
    created_at: string;
    combos: Array<{
      id: number;
      combo_id: number;
      comboId: number;
      name: string;
      quantity: number;
      price: number;
      image: string | null;
    }>;
  } | null;
}

/**
 * GET /api/staff/tickets/search
 * 
 * Phân hệ Nhân viên tại quầy:
 * Cho phép nhân viên tìm kiếm vé của khách hàng qua số điện thoại, email hoặc mã vé.
 * 
 * Bắt buộc kiểm tra phân quyền:
 * - Chỉ cho phép người dùng có role là STAFF hoặc ADMIN truy cập.
 * - Khách hàng (CUSTOMER) hoặc chưa đăng nhập bị từ chối truy cập (401 / 403).
 * 
 * Tham số tìm kiếm hỗ trợ:
 * - `phone`: Tìm kiếm theo số điện thoại khách hàng.
 * - `email`: Tìm kiếm theo email khách hàng.
 * - `ticket_id` / `code`: Tìm kiếm theo mã số vé (id hoặc LMC-xxxxxx).
 * - `q`: Từ khóa tổng quát (số điện thoại, email, họ tên, mã vé, mã ghế, mã giao dịch).
 * - `status`: Lọc theo trạng thái vé (Valid, Used, Cancelled).
 * - `screening_id`: Lọc theo suất chiếu.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    // 1. Phân quyền truy cập (Staff / Admin)
    const userRole = session?.user?.role || request.headers.get('x-user-role') || searchParams.get('role');

    if (!userRole) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để truy cập tính năng tìm kiếm vé của nhân viên',
        'UNAUTHENTICATED'
      );
    }

    if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
      throw new AppError(
        403,
        'Chỉ có nhân viên (STAFF) hoặc quản trị viên (ADMIN) mới có quyền truy cập tìm kiếm vé',
        'FORBIDDEN'
      );
    }

    // 2. Trích xuất các tham số tìm kiếm
    const phone = searchParams.get('phone')?.trim() || '';
    const email = searchParams.get('email')?.trim() || '';
    const ticketIdParam = (
      searchParams.get('ticket_id') ||
      searchParams.get('ticketId') ||
      searchParams.get('code') ||
      ''
    ).trim();
    const q = searchParams.get('q')?.trim() || '';
    const statusParam = searchParams.get('status')?.trim() || '';
    const screeningIdParam = searchParams.get('screening_id') || searchParams.get('screeningId') || '';

    // 3. Xây dựng điều kiện lọc Prisma
    const andConditions: Prisma.TicketWhereInput[] = [];

    // Lọc theo trạng thái vé nếu hợp lệ
    if (statusParam && ['Valid', 'Used', 'Cancelled'].includes(statusParam)) {
      andConditions.push({ status: statusParam as TicketStatus });
    }

    // Lọc theo suất chiếu
    if (screeningIdParam) {
      const screeningId = parseInt(screeningIdParam, 10);
      if (!isNaN(screeningId) && screeningId > 0) {
        andConditions.push({ screeningId });
      }
    }

    // Lọc theo số điện thoại
    if (phone) {
      andConditions.push({
        user: {
          phone: {
            contains: phone,
            mode: 'insensitive',
          },
        },
      });
    }

    // Lọc theo email
    if (email) {
      andConditions.push({
        user: {
          email: {
            contains: email,
            mode: 'insensitive',
          },
        },
      });
    }

    // Lọc theo mã vé
    if (ticketIdParam) {
      // Phân tích nếu người dùng nhập dạng "2" hoặc "#LMC-000002" hoặc "LMC-2"
      const cleaned = ticketIdParam.replace(/[^0-9]/g, '');
      const parsedId = parseInt(cleaned, 10);
      if (!isNaN(parsedId) && parsedId > 0) {
        andConditions.push({ id: parsedId });
      } else {
        // Nếu không có số, thử tìm theo mã ghế (A1, B2)
        andConditions.push({
          seat: {
            code: {
              contains: ticketIdParam,
              mode: 'insensitive',
            },
          },
        });
      }
    }

    // Lọc theo từ khóa đa năng (q)
    if (q) {
      const cleanedNumber = q.replace(/[^0-9]/g, '');
      const parsedNumeric = parseInt(cleanedNumber, 10);
      const isPureNumber = /^\d+$/.test(q);
      const isLmcCode = /^#?LMC-\d+$/i.test(q);

      const orCriteria: Prisma.TicketWhereInput[] = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { phone: { contains: q, mode: 'insensitive' } } },
        { seat: { code: { contains: q, mode: 'insensitive' } } },
        { payment: { transactionCode: { contains: q, mode: 'insensitive' } } },
        { screening: { movie: { title: { contains: q, mode: 'insensitive' } } } },
      ];

      if ((isPureNumber || isLmcCode) && !isNaN(parsedNumeric) && parsedNumeric > 0) {
        orCriteria.push({ id: parsedNumeric });
      }

      andConditions.push({ OR: orCriteria });
    }

    const where: Prisma.TicketWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    // 4. Truy vấn Prisma lấy đầy đủ dữ liệu vé, suất chiếu và tình trạng ghế
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
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
                status: true,
              },
            },
            seats: {
              select: {
                id: true,
                code: true,
                status: true,
              },
            },
          },
        },
        seat: {
          select: {
            id: true,
            room: true,
            row: true,
            number: true,
            code: true,
            type: true,
            status: true,
            reservedUntil: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            transactionCode: true,
            couponCode: true,
            status: true,
            createdAt: true,
            orderCombos: {
              include: {
                combo: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
      take: 50,
    });

    // 5. Chuẩn hóa dữ liệu trả về theo chuẩn giao tiếp
    const formattedTickets: StaffTicketSearchResult[] = tickets.map((t) => {
      // Tính toán thống kê tình trạng ghế phòng chiếu hiện tại
      const allSeats = t.screening?.seats || [];
      const totalSeats = allSeats.length;
      const occupiedSeats = allSeats.filter((s) => s.status === SeatStatus.OCCUPIED).length;
      const reservedSeats = allSeats.filter((s) => s.status === SeatStatus.RESERVED).length;
      const emptySeats = allSeats.filter((s) => s.status === SeatStatus.EMPTY).length;

      const ticketCode = `#LMC-${String(t.id).padStart(6, '0')}`;

      return {
        id: t.id,
        ticket_id: t.id,
        ticketId: t.id,
        ticket_type: t.ticketType,
        ticketType: t.ticketType,
        price: Number(t.price),
        status: t.status,
        purchase_date: t.purchaseDate.toISOString(),
        purchaseDate: t.purchaseDate.toISOString(),
        ticket_code: ticketCode,
        ticketCode: ticketCode,

        customer: {
          id: t.user.id,
          user_id: t.user.id,
          userId: t.user.id,
          name: t.user.name,
          full_name: t.user.name,
          fullName: t.user.name,
          email: t.user.email,
          phone: t.user.phone,
          role: t.user.role,
        },

        movie: t.screening?.movie
          ? {
              id: t.screening.movie.id,
              movie_id: t.screening.movie.id,
              movieId: t.screening.movie.id,
              title: t.screening.movie.title,
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
              screening_id: t.screening.id,
              screeningId: t.screening.id,
              room: t.screening.room,
              room_number: t.screening.roomNumber,
              roomNumber: t.screening.roomNumber,
              date: t.screening.date.toISOString(),
              start_time: t.screening.startTime.toISOString(),
              startTime: t.screening.startTime.toISOString(),
              end_time: t.screening.endTime.toISOString(),
              endTime: t.screening.endTime.toISOString(),
              price: Number(t.screening.price),
              status: t.screening.status,
              total_seats: totalSeats,
              occupied_seats: occupiedSeats,
              reserved_seats: reservedSeats,
              empty_seats: emptySeats,
            }
          : null,

        seat: t.seat
          ? {
              id: t.seat.id,
              seat_id: t.seat.id,
              seatId: t.seat.id,
              code: t.seat.code,
              row: t.seat.row,
              number: t.seat.number,
              type: t.seat.type,
              status: t.seat.status,
              seat_status: t.seat.status,
              seatStatus: t.seat.status,
              reserved_until: t.seat.reservedUntil ? t.seat.reservedUntil.toISOString() : null,
              reservedUntil: t.seat.reservedUntil ? t.seat.reservedUntil.toISOString() : null,
            }
          : null,

        payment: t.payment
          ? {
              id: t.payment.id,
              payment_id: t.payment.id,
              paymentId: t.payment.id,
              amount: Number(t.payment.amount),
              payment_method: t.payment.paymentMethod,
              paymentMethod: t.payment.paymentMethod,
              transaction_code: t.payment.transactionCode,
              transactionCode: t.payment.transactionCode,
              coupon_code: t.payment.couponCode,
              couponCode: t.payment.couponCode,
              status: t.payment.status,
              created_at: t.payment.createdAt.toISOString(),
              combos: t.payment.orderCombos.map((oc) => ({
                id: oc.id,
                combo_id: oc.combo.id,
                comboId: oc.combo.id,
                name: oc.combo.name,
                quantity: oc.quantity,
                price: Number(oc.price),
                image: oc.combo.image,
              })),
            }
          : null,
      };
    });

    const hasSearchParams = Boolean(phone || email || ticketIdParam || q || statusParam || screeningIdParam);
    const successMessage = hasSearchParams
      ? `Tìm thấy ${formattedTickets.length} vé phù hợp với tiêu chí tìm kiếm`
      : `Hiển thị ${formattedTickets.length} vé mới nhất trong hệ thống`;

    return apiResponse(
      true,
      formattedTickets,
      successMessage,
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
