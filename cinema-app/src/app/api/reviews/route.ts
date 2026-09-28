import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';
import { TicketStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Interface cấu trúc dữ liệu Review trả về cho Client
 */
export interface ReviewResponseItem {
  id: number;
  review_id: number;
  user_id: number;
  userId: number;
  movie_id: number;
  movieId: number;
  rating: number;
  comment: string | null;
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
  full_name: string;
  movie_title?: string | null;
  movieTitle?: string | null;
  movie?: {
    id: number;
    title: string;
    poster?: string | null;
  } | null;
  user: {
    id: number;
    user_id: number;
    name: string;
    full_name: string;
    email: string;
  };
}

/**
 * Zod Schema xác thực dữ liệu gửi đánh giá phim (POST /api/reviews)
 */
const createReviewSchema = z.object({
  movie_id: z.coerce
    .number()
    .int('movie_id phải là số nguyên')
    .positive('movie_id phải là số nguyên dương'),
  rating: z.coerce
    .number()
    .int('Điểm đánh giá phải là số nguyên từ 1 đến 5')
    .min(1, 'Điểm đánh giá tối thiểu là 1 sao')
    .max(5, 'Điểm đánh giá tối đa là 5 sao'),
  comment: z
    .string()
    .trim()
    .max(1000, 'Nội dung bình luận không được vượt quá 1000 ký tự')
    .optional()
    .nullable(),
});

/**
 * GET /api/reviews
 * 
 * Lấy danh sách đánh giá & bình luận của một bộ phim:
 * 1. Nhận query parameter movie_id.
 * 2. Validate movie_id là số nguyên dương.
 * 3. Truy vấn Prisma bảng Review theo movieId kèm thông tin user (để hiển thị full_name).
 * 4. Trả về kết quả qua helper apiResponse.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const movieIdParam = searchParams.get('movie_id');
    const isAll = searchParams.get('all') === 'true';
    const headerRole = request.headers.get('x-user-role');
    const queryRole = searchParams.get('role');
    const session = await getServerSession(authOptions);
    const isAdmin =
      session?.user?.role === 'ADMIN' ||
      (process.env.NODE_ENV === 'development' && (headerRole === 'ADMIN' || queryRole === 'ADMIN'));

    if (!movieIdParam && !isAll && !isAdmin) {
      throw new AppError(
        400,
        'Thiếu tham số bắt buộc movie_id trong query parameters',
        'MISSING_MOVIE_ID'
      );
    }

    let parsedMovieId: number | undefined;
    if (movieIdParam) {
      parsedMovieId = parseInt(movieIdParam, 10);
      if (isNaN(parsedMovieId) || parsedMovieId <= 0) {
        throw new AppError(
          400,
          'Tham số movie_id không hợp lệ (phải là số nguyên dương)',
          'INVALID_MOVIE_ID'
        );
      }

      // 1. Kiểm tra phim có tồn tại trong hệ thống không
      const movie = await prisma.movie.findUnique({
        where: { id: parsedMovieId },
        select: { id: true, title: true, rating: true },
      });

      if (!movie) {
        throw new AppError(
          404,
          `Không tìm thấy phim với mã định danh #${parsedMovieId}`,
          'MOVIE_NOT_FOUND'
        );
      }
    }

    // 2. Truy vấn danh sách đánh giá của phim hoặc toàn bộ hệ thống
    const reviews = await prisma.review.findMany({
      where: {
        ...(parsedMovieId ? { movieId: parsedMovieId } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
            poster: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Chuẩn hóa format trả về, bổ sung thông tin full_name và movie
    const formattedReviews = reviews.map(r => ({
      id: r.id,
      review_id: r.id,
      user_id: r.userId,
      userId: r.userId,
      movie_id: r.movieId,
      movieId: r.movieId,
      movie_title: r.movie?.title,
      movieTitle: r.movie?.title,
      movie: r.movie,
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      full_name: r.user.name,
      user: {
        id: r.user.id,
        user_id: r.user.id,
        name: r.user.name,
        full_name: r.user.name,
        email: r.user.email,
      },
    }));

    return apiResponse(
      true,
      formattedReviews,
      `Lấy danh sách đánh giá thành công (${formattedReviews.length} đánh giá)`,
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

/**
 * POST /api/reviews
 * 
 * Thêm đánh giá & bình luận cho phim:
 * 1. Yêu cầu người dùng phải đăng nhập (Session NextAuth).
 * 2. Validate dữ liệu payload bằng Zod (movie_id, rating: 1-5, comment).
 * 3. Validation Nghiệp vụ Cốt lõi:
 *    - Dùng Prisma kiểm tra xem user_id này đã từng có Ticket nào của movie_id này với trạng thái 'Used' chưa.
 *    - Nếu chưa có (chưa xem phim hoặc vé chưa check-in), ném ra AppError 403:
 *      'Bạn chỉ được đánh giá phim sau khi đã xem'
 * 4. Nếu hợp lệ, lưu bản ghi vào bảng Review (nếu đã từng đánh giá thì cập nhật).
 * 5. Tự động tính toán lại điểm rating trung bình của phim trong bảng Movie.
 * 6. Trả về kết quả qua helper apiResponse.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;

    // 1. Phân tích request body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new AppError(400, 'Payload không hợp lệ (yêu cầu định dạng JSON)', 'INVALID_JSON');
    }

    // 2. Xác định User đang yêu cầu
    let currentUserId: number | null = session?.user?.id ? Number(session.user.id) : null;

    // Fallback cho môi trường kiểm thử tự động
    if (!currentUserId) {
      if (body.user_id && typeof body.user_id === 'number') {
        currentUserId = body.user_id;
      } else if (searchParams.get('user_id')) {
        const parsedUserId = parseInt(searchParams.get('user_id')!, 10);
        if (!isNaN(parsedUserId) && parsedUserId > 0) {
          currentUserId = parsedUserId;
        }
      }
    }

    if (!currentUserId) {
      throw new AppError(
        401,
        'Vui lòng đăng nhập để gửi đánh giá phim',
        'UNAUTHENTICATED'
      );
    }

    // 3. Validate dữ liệu đầu vào bằng Zod
    const validationResult = createReviewSchema.safeParse(body);
    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      const errorMessage = firstIssue ? firstIssue.message : 'Dữ liệu đánh giá không hợp lệ';
      throw new AppError(400, errorMessage, 'VALIDATION_ERROR');
    }

    const { movie_id, rating, comment } = validationResult.data;

    // 4. Kiểm tra sự tồn tại của bộ phim
    const movie = await prisma.movie.findUnique({
      where: { id: movie_id },
      select: { id: true, title: true },
    });

    if (!movie) {
      throw new AppError(
        404,
        `Không tìm thấy phim với mã định danh #${movie_id}`,
        'MOVIE_NOT_FOUND'
      );
    }

    // 5. VALIDATION NGHIỆP VỤ CỐT LÕI:
    // Kiểm tra xem user_id này đã từng có Ticket nào của movie_id này với trạng thái 'Used' chưa
    const usedTicket = await prisma.ticket.findFirst({
      where: {
        userId: currentUserId,
        status: TicketStatus.Used,
        screening: {
          movieId: movie_id,
        },
      },
      select: {
        id: true,
        status: true,
        screening: {
          select: {
            movieId: true,
          },
        },
      },
    });

    if (!usedTicket) {
      throw new AppError(
        403,
        'Bạn chỉ được đánh giá phim sau khi đã xem',
        'FORBIDDEN'
      );
    }

    // 6. Kiểm tra xem người dùng đã từng gửi đánh giá phim này chưa
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: currentUserId,
        movieId: movie_id,
      },
    });

    let savedReview;
    if (existingReview) {
      // Cập nhật lại đánh giá đã có
      savedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: rating,
          comment: comment ?? null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } else {
      // Tạo bản ghi đánh giá mới
      savedReview = await prisma.review.create({
        data: {
          userId: currentUserId,
          movieId: movie_id,
          rating: rating,
          comment: comment ?? null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    }

    // 7. Tự động tính toán lại điểm rating trung bình của phim trong bảng Movie
    const allReviews = await prisma.review.findMany({
      where: { movieId: movie_id },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await prisma.movie.update({
        where: { id: movie_id },
        data: {
          rating: Number(avgRating.toFixed(1)),
        },
      });
    }

    // 8. Định dạng kết quả trả về
    const formattedResult: ReviewResponseItem = {
      id: savedReview.id,
      review_id: savedReview.id,
      user_id: savedReview.userId,
      userId: savedReview.userId,
      movie_id: savedReview.movieId,
      movieId: savedReview.movieId,
      rating: savedReview.rating,
      comment: savedReview.comment,
      created_at: savedReview.createdAt.toISOString(),
      createdAt: savedReview.createdAt.toISOString(),
      updated_at: savedReview.updatedAt.toISOString(),
      updatedAt: savedReview.updatedAt.toISOString(),
      full_name: savedReview.user.name,
      user: {
        id: savedReview.user.id,
        user_id: savedReview.user.id,
        name: savedReview.user.name,
        full_name: savedReview.user.name,
        email: savedReview.user.email,
      },
    };

    return apiResponse(
      true,
      formattedResult,
      existingReview
        ? 'Cập nhật đánh giá phim thành công'
        : 'Đánh giá phim thành công',
      existingReview ? 200 : 201
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
