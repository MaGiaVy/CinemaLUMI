import { fetchMovieById, fetchScreeningById, fetchMovies, fetchScreenings } from '@/lib/api';
import SeatSelectionClient from './SeatSelectionClient';

interface SeatSelectionPageProps {
  searchParams: Promise<{ screeningId?: string; movieId?: string }>;
}

export default async function SeatSelectionPage({ searchParams }: SeatSelectionPageProps) {
  const { screeningId, movieId } = await searchParams;

  const [allMovies, allScreenings] = await Promise.all([
    fetchMovies(),
    fetchScreenings(),
  ]);

  const movie = (movieId ? await fetchMovieById(movieId) : null) || allMovies[0];
  const screening = (screeningId ? await fetchScreeningById(screeningId) : null) || allScreenings[0];

  return <SeatSelectionClient movie={movie} screening={screening} />;
}
