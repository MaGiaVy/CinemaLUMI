import { prisma } from '@/lib/prisma';
import ScreeningManagementClient, { ScreeningItem } from './ScreeningManagementClient';

export const dynamic = 'force-dynamic';

/**
 * Server Component: /admin/screenings và /screenings
 * 
 * Lấy danh sách suất chiếu từ cơ sở dữ liệu qua Prisma kèm thông tin phim và số lượng ghế/vé,
 * sau đó render trực tiếp phía Server để tối ưu hiệu suất, rồi truyền dữ liệu cho Client Component.
 */
export default async function ScreeningManagementPage() {
  const rawScreenings = await prisma.screening.findMany({
    orderBy: {
      startTime: 'asc',
    },
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          poster: true,
          duration: true,
          ageRating: true,
          genre: true,
        },
      },
      _count: {
        select: {
          seats: true,
          tickets: true,
        },
      },
    },
  });

  const formattedScreenings: ScreeningItem[] = rawScreenings.map(s => ({
    id: s.id,
    movieId: s.movieId,
    room: s.room,
    roomNumber: s.roomNumber,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    date: s.date.toISOString(),
    price: Number(s.price),
    status: s.status as 'UPCOMING' | 'SHOWING' | 'ENDED',
    movie: {
      id: s.movie.id,
      title: s.movie.title,
      poster: s.movie.poster,
      duration: s.movie.duration,
      ageRating: s.movie.ageRating,
      genre: s.movie.genre,
    },
    _count: {
      seats: s._count.seats,
      tickets: s._count.tickets,
    },
  }));

  return <ScreeningManagementClient initialScreenings={formattedScreenings} />;
}
