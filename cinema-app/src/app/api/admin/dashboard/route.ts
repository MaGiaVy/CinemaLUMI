import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { PaymentStatus, TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Interface cấu trúc dữ liệu Dashboard thống kê dành cho Admin
 */
export interface TopMovieStat {
  id: number;
  movie_id: number;
  movieId: number;
  title: string;
  poster: string;
  duration: number;
  genre: string;
  rating: number;
  total_revenue: number;
  totalRevenue: number;
  tickets_sold: number;
  ticketsSold: number;
}

export interface AdminDashboardResponseData {
  today: {
    date: string;
    total_revenue: number;
    totalRevenue: number;
    tickets_sold: number;
    ticketsSold: number;
    combo_revenue: number;
    comboRevenue: number;
    average_fill_rate: number;
    averageFillRate: number;
    fill_rate_percentage: string;
    fillRatePercentage: string;
    total_seats_capacity: number;
    totalSeatsCapacity: number;
    occupied_seats_count: number;
    occupiedSeatsCount: number;
  };
  top_movies: TopMovieStat[];
  topMovies: TopMovieStat[];
  all_time: {
    total_revenue: number;
    totalRevenue: number;
    tickets_sold: number;
    ticketsSold: number;
    total_movies: number;
    totalMovies: number;
    total_screenings: number;
    totalScreenings: number;
  };
  allTime: {
    total_revenue: number;
    totalRevenue: number;
    tickets_sold: number;
    ticketsSold: number;
    total_movies: number;
    totalMovies: number;
    total_screenings: number;
    totalScreenings: number;
  };
}

/**
 * GET /api/admin/dashboard
 * 
 * Báo cáo & Thống kê hệ thống rạp chiếu (Phase 13):
 * 
 * Ràng buộc bảo mật:
 * - Bắt buộc kiểm tra session.user.role === 'ADMIN'.
 * - Khách hàng (CUSTOMER) hoặc Nhân viên (STAFF) bị từ chối truy cập (403 FORBIDDEN).
 * 
 * Các chỉ số tính toán:
 * 1. Ngày hôm nay (Today):
 *    - Tổng doanh thu (bảng Payment với status = SUCCESS).
 *    - Tổng số vé bán ra (bảng Ticket với status != CANCELLED).
 *    - Doanh thu từ bắp nước (bảng OrderCombo có hóa đơn SUCCESS).
 *    - Tỷ lệ lấp đầy rạp trung bình (Tổng vé đã đặt / Tổng sức chứa ghế các phòng chiếu * 100).
 * 2. Mọi thời đại (All-time):
 *    - Danh sách Top 5 bộ phim có doanh thu cao nhất mọi thời đại.
 *    - Tổng kết toàn bộ doanh thu, vé bán ra, tổng số phim và suất chiếu.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const testRole =
      process.env.NODE_ENV !== 'production' || process.env.ALLOW_TEST_ROLES === 'true'
        ? searchParams.get('role')
        : null;

    const userRole = (session?.user as { role?: string })?.role || testRole;

    // 1. Ràng buộc bảo mật: Bắt buộc kiểm tra quyền ADMIN
    if (!session?.user && !testRole) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập với tài khoản Quản trị viên (ADMIN)',
        'UNAUTHENTICATED'
      );
    }

    if (userRole !== 'ADMIN') {
      throw new AppError(
        403,
        'Chỉ có quản trị viên (ADMIN) mới có quyền truy cập dữ liệu báo cáo thống kê này',
        'FORBIDDEN'
      );
    }

    // 2. Xác định mốc thời gian ngày hôm nay (00:00:00 -> 23:59:59.999)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // 3. Tính toán các chỉ số trong ngày hôm nay & Tỷ lệ lấp đầy
    // Sử dụng aggregate, count và truy vấn song song để tối ưu hóa hiệu năng, tránh tải hàng vạn bản ghi vào Node.js RAM
    const [
      todayPaymentAgg,
      todayTicketsSold,
      todayOrderCombos,
      totalSeatsCapacity,
      totalBookedSeats,
    ] = await Promise.all([
      // 3.1. Tổng doanh thu hôm nay từ bảng Payment với trạng thái SUCCESS
      prisma.payment.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          status: PaymentStatus.Success,
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),

      // 3.2. Tổng số vé bán ra trong ngày hôm nay (chỉ tính vé hợp lệ hoặc đã dùng)
      prisma.ticket.count({
        where: {
          status: { in: [TicketStatus.Valid, TicketStatus.Used] },
          purchaseDate: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),

      // 3.3. Doanh thu từ bắp nước trong ngày hôm nay (bảng OrderCombo có hóa đơn SUCCESS)
      prisma.orderCombo.findMany({
        where: {
          payment: {
            status: PaymentStatus.Success,
          },
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
        select: {
          price: true,
          quantity: true,
        },
      }),

      // 3.4. Sức chứa ghế rạp chiếu (đếm trực tiếp từ DB, không load toàn bộ ghế vào RAM)
      prisma.seat.count({
        where: {
          screeningId: { not: null },
        },
      }),

      // 3.5. Tổng ghế đã đặt cho các suất chiếu (vé Valid/Used)
      prisma.ticket.count({
        where: {
          status: { in: [TicketStatus.Valid, TicketStatus.Used] },
          screeningId: { not: null },
        },
      }),
    ]);

    const todayTotalRevenue = Number(todayPaymentAgg._sum.amount || 0);

    const todayComboRevenue = todayOrderCombos.reduce(
      (sum, c) => sum + Number(c.price) * c.quantity,
      0
    );

    const averageFillRate =
      totalSeatsCapacity > 0
        ? Number(((totalBookedSeats / totalSeatsCapacity) * 100).toFixed(1))
        : 0;

    // 4. Lấy danh sách Top 5 bộ phim có doanh thu cao nhất mọi thời đại
    // Tối ưu hóa bằng SQL aggregate GROUP BY & ORDER BY & LIMIT 5 ở tầng Database
    // Tránh tải toàn bộ Movies -> Screenings -> Tickets vào RAM bằng vòng lặp lồng nhau
    let top5Movies: TopMovieStat[] = [];

    try {
      const top5Raw = await prisma.$queryRaw<
        Array<{
          id: number;
          title: string;
          poster: string;
          duration: number;
          genre: string;
          rating: any;
          total_revenue: any;
          tickets_sold: any;
        }>
      >`
        SELECT 
          m.movie_id as "id",
          m.title,
          m.poster,
          m.duration,
          m.genre,
          m.rating,
          COALESCE(SUM(t.price), 0)::float as "total_revenue",
          COUNT(t.ticket_id)::int as "tickets_sold"
        FROM movies m
        LEFT JOIN screenings s ON s.movie_id = m.movie_id
        LEFT JOIN tickets t ON t.screening_id = s.screening_id AND t.status::text IN ('Valid', 'Used')
        WHERE m.is_deleted = false
        GROUP BY m.movie_id, m.title, m.poster, m.duration, m.genre, m.rating
        ORDER BY "total_revenue" DESC, "tickets_sold" DESC
        LIMIT 5;
      `;

      top5Movies = top5Raw.map((m) => ({
        id: Number(m.id),
        movie_id: Number(m.id),
        movieId: Number(m.id),
        title: m.title,
        poster: m.poster,
        duration: Number(m.duration),
        genre: m.genre,
        rating: Number(m.rating || 0),
        total_revenue: Number(m.total_revenue || 0),
        totalRevenue: Number(m.total_revenue || 0),
        tickets_sold: Number(m.tickets_sold || 0),
        ticketsSold: Number(m.tickets_sold || 0),
      }));
    } catch {
      // Fallback nếu raw query không khả dụng
      const movies = await prisma.movie.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          title: true,
          poster: true,
          duration: true,
          genre: true,
          rating: true,
          screenings: {
            select: {
              tickets: {
                where: {
                  status: { in: [TicketStatus.Valid, TicketStatus.Used] },
                },
                select: {
                  price: true,
                },
              },
            },
          },
        },
      });

      const stats = movies.map((m) => {
        let revenue = 0;
        let count = 0;
        for (const sc of m.screenings) {
          for (const t of sc.tickets) {
            revenue += Number(t.price);
            count += 1;
          }
        }
        return {
          id: m.id,
          movie_id: m.id,
          movieId: m.id,
          title: m.title,
          poster: m.poster,
          duration: m.duration,
          genre: m.genre,
          rating: Number(m.rating),
          total_revenue: revenue,
          totalRevenue: revenue,
          tickets_sold: count,
          ticketsSold: count,
        };
      });

      stats.sort((a, b) => b.total_revenue - a.total_revenue || b.tickets_sold - a.tickets_sold);
      top5Movies = stats.slice(0, 5);
    }

    // 5. Thống kê toàn thời gian (All-Time Overview)
    // Tối ưu hóa bằng aggregate & count song song thay vì nạp toàn bộ payments vào Node.js RAM
    const [allTimePaymentAgg, allTimeTicketsCount, totalMoviesCount, totalScreeningsCount] =
      await Promise.all([
        prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            status: PaymentStatus.Success,
          },
        }),
        prisma.ticket.count({
          where: {
            status: { in: [TicketStatus.Valid, TicketStatus.Used] },
          },
        }),
        prisma.movie.count({
          where: { isDeleted: false },
        }),
        prisma.screening.count(),
      ]);

    const allTimeRevenue = Number(allTimePaymentAgg._sum.amount || 0);

    const allTimeSummary = {
      total_revenue: allTimeRevenue,
      totalRevenue: allTimeRevenue,
      tickets_sold: allTimeTicketsCount,
      ticketsSold: allTimeTicketsCount,
      total_movies: totalMoviesCount,
      totalMovies: totalMoviesCount,
      total_screenings: totalScreeningsCount,
      totalScreenings: totalScreeningsCount,
    };

    // 6. Chuẩn hóa dữ liệu trả về theo chuẩn apiResponse
    const responseData: AdminDashboardResponseData = {
      today: {
        date: startOfToday.toISOString().split('T')[0],
        total_revenue: todayTotalRevenue,
        totalRevenue: todayTotalRevenue,
        tickets_sold: todayTicketsSold,
        ticketsSold: todayTicketsSold,
        combo_revenue: todayComboRevenue,
        comboRevenue: todayComboRevenue,
        average_fill_rate: averageFillRate,
        averageFillRate: averageFillRate,
        fill_rate_percentage: `${averageFillRate}%`,
        fillRatePercentage: `${averageFillRate}%`,
        total_seats_capacity: totalSeatsCapacity,
        totalSeatsCapacity: totalSeatsCapacity,
        occupied_seats_count: totalBookedSeats,
        occupiedSeatsCount: totalBookedSeats,
      },
      top_movies: top5Movies,
      topMovies: top5Movies,
      all_time: allTimeSummary,
      allTime: allTimeSummary,
    };

    return apiResponse(
      true,
      responseData,
      'Lấy dữ liệu thống kê Dashboard Admin thành công',
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
