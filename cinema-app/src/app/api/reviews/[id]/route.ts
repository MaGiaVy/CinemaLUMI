import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { AppError, handleError } from '@/lib/error';
import { apiResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Kiểm tra phân quyền Admin:
 * Bắt buộc session.user.role === 'ADMIN'.
 * Hỗ trợ header x-user-role hoặc query role=ADMIN trong môi trường development / testing.
 */
async function verifyAdminRole(request: NextRequest): Promise<void> {
  const session = await getServerSession(authOptions);
  const headerRole = request.headers.get('x-user-role');
  const searchRole = request.nextUrl.searchParams.get('role');

  const role =
    session?.user?.role ||
    (process.env.NODE_ENV === 'development' ? headerRole || searchRole : null);

  if (!session && !headerRole && !searchRole) {
    throw new AppError(
      401,
      'Vui lòng đăng nhập để thực hiện hành động này',
      'UNAUTHENTICATED'
    );
  }

  if (role !== 'ADMIN') {
    throw new AppError(
      403,
      'Bạn không có quyền thực hiện hành động này. Yêu cầu quyền ADMIN.',
      'FORBIDDEN'
    );
  }
}

/**
 * GET /api/reviews/[id]
 * 
 * Lấy chi tiết một bình luận / đánh giá theo ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId) || reviewId <= 0) {
      throw new AppError(
        400,
        'Mã định danh bình luận (id) không hợp lệ',
        'INVALID_REVIEW_ID'
      );
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
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
          },
        },
      },
    });

    if (!review) {
      throw new AppError(
        404,
        `Không tìm thấy bình luận #${reviewId}`,
        'NOT_FOUND'
      );
    }

    const formattedReview = {
      id: review.id,
      review_id: review.id,
      user_id: review.userId,
      userId: review.userId,
      movie_id: review.movieId,
      movieId: review.movieId,
      rating: review.rating,
      comment: review.comment,
      created_at: review.createdAt.toISOString(),
      createdAt: review.createdAt.toISOString(),
      updated_at: review.updatedAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
      full_name: review.user.name,
      user: {
        id: review.user.id,
        user_id: review.user.id,
        name: review.user.name,
        full_name: review.user.name,
        email: review.user.email,
      },
      movie: review.movie,
    };

    return apiResponse(
      true,
      formattedReview,
      'Lấy thông tin bình luận thành công',
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
 * DELETE /api/reviews/[id]
 * 
 * API cho phép Admin kiểm duyệt & xóa bình luận:
 * 1. Ràng buộc bảo mật: Bắt buộc kiểm tra session.user.role === 'ADMIN'.
 * 2. Kiểm tra xem ID bình luận có tồn tại không:
 *    - Nếu không tồn tại, trả về AppError 404 ('Không tìm thấy bình luận cần xóa').
 * 3. Dùng Prisma xóa bản ghi Review tương ứng.
 * 4. Tự động tính toán lại điểm rating trung bình của phim trong bảng Movie.
 * 5. Nếu thành công, trả về { success: true, message: 'Đã xóa bình luận' }.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId) || reviewId <= 0) {
      throw new AppError(
        400,
        'Mã định danh bình luận (id) không hợp lệ',
        'INVALID_REVIEW_ID'
      );
    }

    // 1. Ràng buộc bảo mật: Bắt buộc kiểm tra quyền ADMIN
    await verifyAdminRole(request);

    // 2. Tìm kiếm bản ghi Review trong cơ sở dữ liệu
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        movieId: true,
        userId: true,
      },
    });

    if (!review) {
      throw new AppError(
        404,
        'Không tìm thấy bình luận cần xóa',
        'NOT_FOUND'
      );
    }

    // 3. Dùng Prisma xóa bản ghi Review tương ứng
    await prisma.review.delete({
      where: { id: reviewId },
    });

    // 4. Tính toán lại điểm rating trung bình cho phim sau khi xóa
    const remainingReviews = await prisma.review.findMany({
      where: { movieId: review.movieId },
      select: { rating: true },
    });

    const newAverageRating =
      remainingReviews.length > 0
        ? Number(
            (
              remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
              remainingReviews.length
            ).toFixed(1)
          )
        : 0.0;

    await prisma.movie.update({
      where: { id: review.movieId },
      data: {
        rating: newAverageRating,
      },
    });

    // 5. Trả về kết quả { success: true, message: 'Đã xóa bình luận' }
    return apiResponse(
      true,
      undefined,
      'Đã xóa bình luận',
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
