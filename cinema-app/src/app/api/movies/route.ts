import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

export const dynamic = 'force-dynamic';

/**
 * GET /api/movies
 * 
 * Lấy danh sách toàn bộ phim:
 * - Mặc định sắp xếp theo created_at mới nhất (desc).
 * - Hỗ trợ lọc theo query param `status` (SHOWING, UPCOMING, ENDED).
 * - Hỗ trợ tìm kiếm theo `search` (title).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const whereClause: any = {};

    if (status && ['SHOWING', 'UPCOMING', 'ENDED'].includes(status.toUpperCase())) {
      whereClause.status = status.toUpperCase();
    }

    if (search && search.trim() !== '') {
      whereClause.title = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const movies = await prisma.movie.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            screenings: true,
            reviews: true,
          },
        },
      },
    });

    return apiResponse(
      true,
      movies,
      'Lấy danh sách phim thành công',
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
 * POST /api/movies
 * 
 * Tạo bản ghi phim mới.
 * 
 * Payload:
 * - title (bắt buộc)
 * - genre (bắt buộc)
 * - duration (bắt buộc, số phút)
 * - poster (bắt buộc, direct URL từ Cloudinary)
 * - description (tùy chọn)
 * - rating (tùy chọn, mặc định 0.0)
 * - release_date (bắt buộc, định dạng YYYY-MM-DD)
 * - end_date (tùy chọn)
 * - age_rating (tùy chọn, ví dụ: P, C13, C16, C18)
 * - trailer, director, cast, status, ticket_price
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      genre,
      duration,
      poster,
      description,
      rating,
      release_date,
      end_date,
      age_rating,
      trailer,
      director,
      cast,
      status,
      ticket_price,
    } = body;

    // 1. Validate các trường bắt buộc
    if (!title || !title.trim()) {
      return apiResponse(false, undefined, 'Tiêu đề phim (title) là bắt buộc', 400);
    }

    if (!genre || !genre.trim()) {
      return apiResponse(false, undefined, 'Thể loại phim (genre) là bắt buộc', 400);
    }

    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      return apiResponse(false, undefined, 'Thời lượng phim (duration) phải là số dương hợp lệ', 400);
    }

    if (!poster || !poster.trim()) {
      return apiResponse(false, undefined, 'Ảnh poster phim là bắt buộc', 400);
    }

    if (!release_date) {
      return apiResponse(false, undefined, 'Ngày khởi chiếu (release_date) là bắt buộc', 400);
    }

    // 2. Kiểm tra tên phim đã tồn tại chưa
    const existingMovie = await prisma.movie.findFirst({
      where: {
        title: {
          equals: title.trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existingMovie) {
      return apiResponse(
        false,
        undefined,
        'Phim với tiêu đề này đã tồn tại trong hệ thống',
        409
      );
    }

    // Tạo slug đơn giản từ title
    const slug = title
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s-]+/g, '-')
      .concat(`-${Date.now().toString().slice(-4)}`);

    // 3. Chuẩn hóa dữ liệu ngày tháng
    const releaseDate = new Date(release_date);
    if (isNaN(releaseDate.getTime())) {
      return apiResponse(false, undefined, 'Định dạng ngày phát hành (release_date) không hợp lệ', 400);
    }

    let endDate: Date | null = null;
    if (end_date) {
      const parsedEnd = new Date(end_date);
      if (!isNaN(parsedEnd.getTime())) {
        endDate = parsedEnd;
      }
    }

    // 4. Chuẩn hóa trạng thái phim
    let movieStatus: 'SHOWING' | 'UPCOMING' | 'ENDED' = 'SHOWING';
    if (status && ['SHOWING', 'UPCOMING', 'ENDED'].includes(status.toUpperCase())) {
      movieStatus = status.toUpperCase() as any;
    }

    // 5. Lưu bản ghi vào cơ sở dữ liệu
    const newMovie = await prisma.movie.create({
      data: {
        title: title.trim(),
        slug,
        description: description?.trim() || null,
        duration: Number(duration),
        releaseDate,
        endDate,
        ageRating: age_rating?.trim() || null,
        poster: poster.trim(),
        trailer: trailer?.trim() || null,
        rating: rating !== undefined && !isNaN(Number(rating)) ? Number(rating) : 0.0,
        genre: genre.trim(),
        director: director?.trim() || null,
        cast: cast?.trim() || null,
        status: movieStatus,
        ticketPrice: ticket_price && !isNaN(Number(ticket_price)) ? Number(ticket_price) : 120000,
      },
    });

    return apiResponse(
      true,
      newMovie,
      'Thêm phim mới thành công',
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
