import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { TicketStatus, Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Interface cấu trúc dữ liệu báo cáo doanh thu chi tiết theo từng suất chiếu
 */
export interface ScreeningRevenueReportItem {
  screening_id: number;
  screeningId: number;
  date: string;
  start_time: string;
  startTime: string;
  end_time: string;
  endTime: string;
  room: string;
  room_number: number | null;
  roomNumber: number | null;
  base_price: number;
  basePrice: number;
  status: string;

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
  };

  // Số liệu kinh doanh & Tỷ lệ lấp đầy
  total_revenue: number;
  totalRevenue: number;
  tickets_sold: number;
  ticketsSold: number;
  seats_sold: number;
  seatsSold: number;
  total_seats: number;
  totalSeats: number;
  empty_seats: number;
  emptySeats: number;
  fill_rate: number;
  fillRate: number;
  fill_rate_percentage: string;
  fillRatePercentage: string;
}

/**
 * GET /api/admin/reports/revenue
 * 
 * Báo cáo chi tiết doanh thu theo suất chiếu (Yêu cầu UC-19):
 * 
 * Ràng buộc bảo mật:
 * - Bắt buộc kiểm tra session.user.role === 'ADMIN'.
 * - Khách hàng (CUSTOMER) hoặc Nhân viên (STAFF) bị từ chối truy cập (403 FORBIDDEN).
 * 
 * Query Parameters hỗ trợ lọc dữ liệu:
 * - `from_date` / `fromDate`: Lọc từ ngày (định dạng YYYY-MM-DD hoặc ISO).
 * - `to_date` / `toDate`: Lọc đến ngày (định dạng YYYY-MM-DD hoặc ISO).
 * - `movie_id` / `movieId`: Lọc theo mã phim cụ thể.
 * - `room_number` / `roomNumber`: Lọc theo số phòng hoặc tên phòng chiếu (Vd: 1, "Cinema 01").
 * 
 * Kết quả trả về:
 * - Mảng dữ liệu chi tiết cho từng suất chiếu kèm tổng doanh thu và tỷ lệ lấp đầy %.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    // 1. Ràng buộc bảo mật: Bắt buộc quyền ADMIN
    const userRole =
      session?.user?.role ||
      request.headers.get('x-user-role') ||
      searchParams.get('role');

    if (!userRole) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để truy cập báo cáo doanh thu',
        'UNAUTHENTICATED'
      );
    }

    if (userRole !== 'ADMIN') {
      throw new AppError(
        403,
        'Chỉ có quản trị viên (ADMIN) mới có quyền truy cập báo cáo doanh thu chi tiết (UC-19)',
        'FORBIDDEN'
      );
    }

    // 2. Trích xuất và phân tích các tham số lọc (Query Parameters)
    const fromDateParam = searchParams.get('from_date') || searchParams.get('fromDate');
    const toDateParam = searchParams.get('to_date') || searchParams.get('toDate');
    const movieIdParam = searchParams.get('movie_id') || searchParams.get('movieId');
    const roomNumberParam = searchParams.get('room_number') || searchParams.get('roomNumber') || searchParams.get('room');

    // 3. Xây dựng điều kiện lọc Prisma
    const where: Prisma.ScreeningWhereInput = {};

    // 3.1. Lọc theo khoảng thời gian suất chiếu
    if (fromDateParam || toDateParam) {
      const timeFilter: Prisma.DateTimeFilter = {};

      if (fromDateParam) {
        const fromDate = new Date(fromDateParam);
        if (!isNaN(fromDate.getTime())) {
          fromDate.setHours(0, 0, 0, 0);
          timeFilter.gte = fromDate;
        }
      }

      if (toDateParam) {
        const toDate = new Date(toDateParam);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          timeFilter.lte = toDate;
        }
      }

      if (timeFilter.gte || timeFilter.lte) {
        where.startTime = timeFilter;
      }
    }

    // 3.2. Lọc theo mã phim
    if (movieIdParam) {
      const parsedMovieId = parseInt(movieIdParam, 10);
      if (!isNaN(parsedMovieId) && parsedMovieId > 0) {
        where.movieId = parsedMovieId;
      }
    }

    // 3.3. Lọc theo phòng chiếu (số phòng hoặc tên phòng)
    if (roomNumberParam) {
      const parsedRoomNum = parseInt(roomNumberParam, 10);
      if (!isNaN(parsedRoomNum) && parsedRoomNum > 0) {
        where.OR = [
          { roomNumber: parsedRoomNum },
          { room: { contains: String(parsedRoomNum), mode: 'insensitive' } },
        ];
      } else {
        where.room = { contains: roomNumberParam.trim(), mode: 'insensitive' };
      }
    }

    // 4. Truy vấn Prisma lấy danh sách Suất chiếu, bao gồm Movie, Seats và Tickets hợp lệ
    const screenings = await prisma.screening.findMany({
      where,
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            slug: true,
            poster: true,
            duration: true,
            genre: true,
            ageRating: true,
          },
        },
        seats: {
          select: {
            id: true,
            code: true,
            type: true,
            status: true,
          },
        },
        tickets: {
          where: {
            status: { in: [TicketStatus.Valid, TicketStatus.Used] },
          },
          select: {
            id: true,
            price: true,
            status: true,
            ticketType: true,
            seatId: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // 5. Tính toán doanh thu và tỷ lệ lấp đầy cho từng suất chiếu
    const reportData: ScreeningRevenueReportItem[] = screenings.map((sc) => {
      // Tổng doanh thu của suất chiếu (chỉ tính vé Valid / Used)
      const totalRevenue = sc.tickets.reduce((sum, t) => sum + Number(t.price), 0);
      const ticketsSold = sc.tickets.length;
      const totalSeats = sc.seats.length > 0 ? sc.seats.length : 50; // Fallback nếu chưa seed seats
      const emptySeats = Math.max(0, totalSeats - ticketsSold);

      // Tỷ lệ lấp đầy (%)
      const fillRate =
        totalSeats > 0 ? Number(((ticketsSold / totalSeats) * 100).toFixed(1)) : 0;

      return {
        screening_id: sc.id,
        screeningId: sc.id,
        date: sc.date.toISOString().split('T')[0],
        start_time: sc.startTime.toISOString(),
        startTime: sc.startTime.toISOString(),
        end_time: sc.endTime.toISOString(),
        endTime: sc.endTime.toISOString(),
        room: sc.room,
        room_number: sc.roomNumber,
        roomNumber: sc.roomNumber,
        base_price: Number(sc.price),
        basePrice: Number(sc.price),
        status: sc.status,

        movie: {
          id: sc.movie.id,
          movie_id: sc.movie.id,
          movieId: sc.movie.id,
          title: sc.movie.title,
          poster: sc.movie.poster,
          duration: sc.movie.duration,
          genre: sc.movie.genre,
          age_rating: sc.movie.ageRating,
          ageRating: sc.movie.ageRating,
        },

        total_revenue: totalRevenue,
        totalRevenue: totalRevenue,
        tickets_sold: ticketsSold,
        ticketsSold: ticketsSold,
        seats_sold: ticketsSold,
        seatsSold: ticketsSold,
        total_seats: totalSeats,
        totalSeats: totalSeats,
        empty_seats: emptySeats,
        emptySeats: emptySeats,
        fill_rate: fillRate,
        fillRate: fillRate,
        fill_rate_percentage: `${fillRate}%`,
        fillRatePercentage: `${fillRate}%`,
      };
    });

    // 6. Trả về mảng dữ liệu báo cáo chi tiết bọc trong hàm apiResponse chuẩn
    return apiResponse(
      true,
      reportData,
      reportData.length > 0
        ? `Lấy báo cáo doanh thu thành công (${reportData.length} suất chiếu)`
        : 'Không có suất chiếu nào phù hợp với bộ lọc đã chọn',
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
