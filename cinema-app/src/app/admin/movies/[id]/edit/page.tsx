import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import EditMovieClient from './EditMovieClient';
import { MovieItem } from '../../MovieManagementClient';

export const dynamic = 'force-dynamic';

interface EditMoviePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditMoviePage({ params }: EditMoviePageProps) {
  const resolvedParams = await params;
  const idStr = resolvedParams?.id;
  const movieId = parseInt(idStr, 10);

  if (isNaN(movieId)) {
    notFound();
  }

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    notFound();
  }

  const releaseDateStr = movie.releaseDate
    ? (movie.releaseDate instanceof Date ? movie.releaseDate.toISOString().split('T')[0] : String(movie.releaseDate).split('T')[0])
    : new Date().toISOString().split('T')[0];

  const endDateStr = movie.endDate
    ? (movie.endDate instanceof Date ? movie.endDate.toISOString().split('T')[0] : String(movie.endDate).split('T')[0])
    : null;

  const formattedMovie: MovieItem = {
    id: movie.id,
    title: movie.title,
    genre: movie.genre,
    duration: movie.duration,
    poster: movie.poster,
    description: movie.description,
    rating: Number(movie.rating || 0),
    releaseDate: releaseDateStr,
    endDate: endDateStr,
    ageRating: movie.ageRating,
    director: movie.director,
    cast: movie.cast,
    status: movie.status as 'SHOWING' | 'UPCOMING' | 'ENDED',
    ticketPrice: Number(movie.ticketPrice || 120000),
    createdAt: movie.createdAt ? movie.createdAt.toISOString() : new Date().toISOString(),
  };

  return <EditMovieClient initialMovie={formattedMovie} />;
}
