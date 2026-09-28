import { prisma } from '@/lib/prisma';
import { apiResponse } from '@/lib/api-response';
import { handleError } from '@/lib/error';

// Đảm bảo API route luôn được thực thi động (không bị cache tĩnh)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();

    // Query đếm số lượng bản ghi kiểm tra kết nối PostgreSQL qua Prisma
    const [userCount, movieCount] = await Promise.all([
      prisma.user.count(),
      prisma.movie.count(),
    ]);

    const responseTime = `${Date.now() - startTime}ms`;

    return apiResponse(
      true,
      {
        status: 'UP',
        database: 'Connected (PostgreSQL)',
        responseTime,
        timestamp: new Date().toISOString(),
        counts: {
          users: userCount,
          movies: movieCount,
        },
      },
      'Hệ thống và cơ sở dữ liệu hoạt động bình thường',
      200
    );
  } catch (error) {
    const errorResponse = handleError(error);
    return apiResponse(
      false,
      {
        status: 'DOWN',
        database: 'Disconnected',
        error: errorResponse.error,
        timestamp: new Date().toISOString(),
      },
      errorResponse.error,
      errorResponse.statusCode,
      errorResponse.code,
      errorResponse.error
    );
  }
}
