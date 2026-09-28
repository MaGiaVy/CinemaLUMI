import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/movies/[id]
 * 
 * Lấy chi tiết một bộ phim bằng ID kèm danh sách suất chiếu và đánh giá.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return apiResponse(false, undefined, 'Mã định danh phim (id) không hợp lệ', 400);
    }

    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      include: {
        screenings: {
          orderBy: {
            startTime: 'asc',
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            screenings: true,
            reviews: true,
          },
        },
      },
    });

    if (!movie) {
      return apiResponse(false, undefined, 'Không tìm thấy bộ phim yêu cầu', 404);
    }

    return apiResponse(
      true,
      movie,
      'Lấy thông tin chi tiết phim thành công',
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
 * PUT /api/movies/[id]
 * 
 * Cập nhật thông tin của một bộ phim.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return apiResponse(false, undefined, 'Mã định danh phim (id) không hợp lệ', 400);
    }

    // 1. Kiểm tra phim có tồn tại không
    const existingMovie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!existingMovie) {
      return apiResponse(false, undefined, 'Không tìm thấy bộ phim cần cập nhật', 404);
    }

    // 2. Đọc payload cập nhật
    const body = await request.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.duration !== undefined && !isNaN(Number(body.duration))) {
      updateData.duration = Number(body.duration);
    }
    if (body.poster !== undefined) updateData.poster = body.poster.trim();
    if (body.trailer !== undefined) updateData.trailer = body.trailer?.trim() || null;
    if (body.genre !== undefined) updateData.genre = body.genre.trim();
    if (body.director !== undefined) updateData.director = body.director?.trim() || null;
    if (body.cast !== undefined) updateData.cast = body.cast?.trim() || null;
    if (body.age_rating !== undefined) updateData.ageRating = body.age_rating?.trim() || null;

    if (body.rating !== undefined && !isNaN(Number(body.rating))) {
      updateData.rating = Number(body.rating);
    }

    if (body.ticket_price !== undefined && !isNaN(Number(body.ticket_price))) {
      updateData.ticketPrice = Number(body.ticket_price);
    }

    if (body.release_date) {
      const parsedRelease = new Date(body.release_date);
      if (!isNaN(parsedRelease.getTime())) {
        updateData.releaseDate = parsedRelease;
      }
    }

    if (body.end_date !== undefined) {
      if (body.end_date === null || body.end_date === '') {
        updateData.endDate = null;
      } else {
        const parsedEnd = new Date(body.end_date);
        if (!isNaN(parsedEnd.getTime())) {
          updateData.endDate = parsedEnd;
        }
      }
    }

    if (body.status && ['SHOWING', 'UPCOMING', 'ENDED'].includes(body.status.toUpperCase())) {
      updateData.status = body.status.toUpperCase();
    }

    // 3. Thực thi cập nhật
    const updatedMovie = await prisma.movie.update({
      where: { id: movieId },
      data: updateData,
    });

    return apiResponse(
      true,
      updatedMovie,
      'Cập nhật thông tin phim thành công',
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
 * DELETE /api/movies/[id]
 * 
 * Xóa một bộ phim khỏi hệ thống.
 * 
 * RÀNG BUỘC NGHIỆP VỤ:
 * Trước khi xóa, dùng Prisma kiểm tra nếu phim này đang có suất chiếu (Screening)
 * ở trạng thái UPCOMING hoặc SHOWING thì báo lỗi 400 không cho xóa.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const movieId = parseInt(id, 10);

    if (isNaN(movieId)) {
      return apiResponse(false, undefined, 'Mã định danh phim (id) không hợp lệ', 400);
    }

    // 1. Kiểm tra phim có tồn tại không
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return apiResponse(false, undefined, 'Không tìm thấy bộ phim cần xóa', 404);
    }

    // 2. RÀNG BUỘC NGHIỆP VỤ: Kiểm tra các suất chiếu UPCOMING hoặc SHOWING
    const activeScreening = await prisma.screening.findFirst({
      where: {
        movieId,
        status: {
          in: ['UPCOMING', 'SHOWING'],
        },
      },
    });

    if (activeScreening) {
      return apiResponse(
        false,
        undefined,
        'Không thể xóa phim vì đang có suất chiếu ở trạng thái UPCOMING hoặc SHOWING. Vui lòng kết thúc hoặc hủy các suất chiếu trước khi xóa phim.',
        400
      );
    }

    // 3. Nếu không có suất chiếu đang hoạt động, tiến hành xóa phim
    await prisma.movie.delete({
      where: { id: movieId },
    });

    return apiResponse(
      true,
      { id: movieId, title: movie.title },
      `Đã xóa bộ phim "${movie.title}" thành công`,
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
