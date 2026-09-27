import { fetchCombos, fetchMovieById, fetchScreeningById, fetchMovies, fetchScreenings } from '@/lib/api';
import ComboCheckoutClient from './ComboCheckoutClient';

interface ComboCheckoutPageProps {
  searchParams: Promise<{
    screeningId?: string;
    movieId?: string;
    seats?: string;
    total?: string;
  }>;
}

export default async function ComboCheckoutPage({ searchParams }: ComboCheckoutPageProps) {
  const params = await searchParams;
  const [combos, allMovies, allScreenings] = await Promise.all([
    fetchCombos(),
    fetchMovies(),
    fetchScreenings(),
  ]);

  const movie = (params.movieId ? await fetchMovieById(params.movieId) : null) || allMovies[0];
  const screening = (params.screeningId ? await fetchScreeningById(params.screeningId) : null) || allScreenings[0];
  const selectedSeats = params.seats ? params.seats.split(',') : ['E5', 'E6'];
  const ticketTotal = Number(params.total) || 240000;

  return (
    <ComboCheckoutClient
      movie={movie}
      screening={screening}
      selectedSeats={selectedSeats}
      ticketTotal={ticketTotal}
      combos={combos}
    />
  );
}
