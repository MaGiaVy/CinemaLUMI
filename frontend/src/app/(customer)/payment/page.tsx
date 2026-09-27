import { fetchMovieById, fetchScreeningById, fetchMovies, fetchScreenings } from '@/lib/api';
import PaymentClient from './PaymentClient';

interface PaymentPageProps {
  searchParams: Promise<{
    screeningId?: string;
    movieId?: string;
    seats?: string;
    total?: string;
  }>;
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = await searchParams;
  const [allMovies, allScreenings] = await Promise.all([
    fetchMovies(),
    fetchScreenings(),
  ]);

  const movie = (params.movieId ? await fetchMovieById(params.movieId) : null) || allMovies[0];
  const screening = (params.screeningId ? await fetchScreeningById(params.screeningId) : null) || allScreenings[0];
  const selectedSeats = params.seats ? params.seats.split(',') : ['E5', 'E6'];
  const total = Number(params.total) || 280000;

  return (
    <PaymentClient
      movie={movie}
      screening={screening}
      selectedSeats={selectedSeats}
      total={total}
    />
  );
}
