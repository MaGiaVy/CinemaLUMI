import { notFound } from 'next/navigation';
import { fetchMovieById, fetchReviewsByMovieId } from '@/lib/api';
import MovieRatingClient from './MovieRatingClient';

interface MovieRatingPageProps {
  params: Promise<{ id: string }>;
}

export default async function MovieRatingPage({ params }: MovieRatingPageProps) {
  const { id } = await params;
  const movie = await fetchMovieById(id);

  if (!movie) {
    notFound();
  }

  const reviews = await fetchReviewsByMovieId(id);

  return <MovieRatingClient movie={movie} initialReviews={reviews} />;
}
