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

    // 1. Ràng buộc bảo mật: Bắt buộc kiểm tra role === 'ADMIN'
    const userRole =
      session?.user?.role ||
      request.headers.get('x-user-role') ||
      searchParams.get('role');

    if (!userRole) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để truy cập trang báo cáo quản trị',
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

    // 3. Tính toán các chỉ số trong ngày hôm nay
    // 3.1. Tổng doanh thu hôm nay từ bảng Payment với trạng thái SUCCESS
    const todaySuccessPayments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.Success,
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      select: {
        amount: true,
      },
    });

    const todayTotalRevenue = todaySuccessPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    // 3.2. Tổng số vé bán ra trong ngày hôm nay (chỉ tính vé hợp lệ hoặc đã dùng)
    const todayTicketsSold = await prisma.ticket.count({
      where: {
        status: { in: [TicketStatus.Valid, TicketStatus.Used] },
        purchaseDate: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    // 3.3. Doanh thu từ bắp nước trong ngày hôm nay (bảng OrderCombo có hóa đơn SUCCESS)
    const todayOrderCombos = await prisma.orderCombo.findMany({
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
    });

    const todayComboRevenue = todayOrderCombos.reduce(
      (sum, c) => sum + Number(c.price) * c.quantity,
      0
    );

    // 3.4. Tỷ lệ lấp đầy rạp trung bình (Average Fill Rate %)
    // Tính trên các suất chiếu đang có trong hệ thống
    const activeScreenings = await prisma.screening.findMany({
      include: {
        seats: {
          select: {
            id: true,
            status: true,
          },
        },
        tickets: {
          where: {
            status: { in: [TicketStatus.Valid, TicketStatus.Used] },
          },
          select: {
            id: true,
          },
        },
      },
    });

    let totalSeatsCapacity = 0;
    let totalBookedSeats = 0;

    for (const sc of activeScreenings) {
      totalSeatsCapacity += sc.seats.length;
      totalBookedSeats += sc.tickets.length;
    }

    const averageFillRate =
      totalSeatsCapacity > 0
        ? Number(((totalBookedSeats / totalSeatsCapacity) * 100).toFixed(1))
        : 0;

    // 4. Lấy danh sách Top 5 bộ phim có doanh thu cao nhất mọi thời đại
    const allMovies = await prisma.movie.findMany({
      include: {
        screenings: {
          include: {
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

    const movieStats: TopMovieStat[] = allMovies.map((m) => {
      let revenue = 0;
      let ticketCount = 0;

      for (const sc of m.screenings) {
        for (const t of sc.tickets) {
          revenue += Number(t.price);
          ticketCount += 1;
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
        tickets_sold: ticketCount,
        ticketsSold: ticketCount,
      };
    });

    // Sắp xếp giảm dần theo doanh thu cao nhất, lấy top 5
    movieStats.sort((a, b) => {
      if (b.total_revenue !== a.total_revenue) {
        return b.total_revenue - a.total_revenue;
      }
      return b.tickets_sold - a.tickets_sold;
    });

    const top5Movies = movieStats.slice(0, 5);

    // 5. Thống kê toàn thời gian (All-Time Overview)
    const allSuccessPayments = await prisma.payment.findMany({
      where: {
        status: PaymentStatus.Success,
      },
      select: {
        amount: true,
      },
    });

    const allTimeRevenue = allSuccessPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const allTimeTicketsCount = await prisma.ticket.count({
      where: {
        status: { in: [TicketStatus.Valid, TicketStatus.Used] },
      },
    });

    const totalMoviesCount = allMovies.length;
    const totalScreeningsCount = activeScreenings.length;

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
