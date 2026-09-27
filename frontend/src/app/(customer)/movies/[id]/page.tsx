import { notFound } from 'next/navigation';
import {
  fetchMovieById,
  fetchScreeningsByMovieId,
  fetchReviews,
  fetchMovies,
} from '@/lib/api';
import MovieDetailsClient from './MovieDetailsClient';

interface MovieDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function MovieDetailsPage({ params }: MovieDetailsPageProps) {
  const { id } = await params;

  // Asynchronous API calls (Server Component)
  const [movie, screenings, reviews, allMovies] = await Promise.all([
    fetchMovieById(id),
    fetchScreeningsByMovieId(id),
    fetchReviews(id),
    fetchMovies(),
  ]);

  if (!movie) {
    notFound();
  }

  return (
    <MovieDetailsClient
      movie={movie}
      initialScreenings={screenings}
      reviews={reviews}
      relatedMovies={allMovies}
    />
  );
}
