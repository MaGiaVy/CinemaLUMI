import { prisma } from '@/lib/prisma';
import MovieManagementClient, { MovieItem } from './MovieManagementClient';

export const dynamic = 'force-dynamic';

/**
 * Server Component: /admin/movies và /movies
 * 
 * Truy vấn trực tiếp từ cơ sở dữ liệu qua Prisma để render dữ liệu tức thì (Zero latency),
 * sau đó truyền sang Client Component để phục vụ tương tác tìm kiếm, lọc và xóa phim.
 */
export default async function MovieManagementPage() {
  const rawMovies = await prisma.movie.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Chuẩn hóa Decimal và Date sang primitive types để truyền sang Client Component
  const formattedMovies: MovieItem[] = rawMovies.map(movie => ({
    id: movie.id,
    title: movie.title,
    genre: movie.genre,
    duration: movie.duration,
    poster: movie.poster,
    description: movie.description,
    rating: Number(movie.rating),
    releaseDate: movie.releaseDate.toISOString().split('T')[0],
    endDate: movie.endDate ? movie.endDate.toISOString().split('T')[0] : null,
    ageRating: movie.ageRating,
    director: movie.director,
    cast: movie.cast,
    status: movie.status as 'SHOWING' | 'UPCOMING' | 'ENDED',
    ticketPrice: Number(movie.ticketPrice),
    createdAt: movie.createdAt.toISOString(),
  }));

  return <MovieManagementClient initialMovies={formattedMovies} />;
}
