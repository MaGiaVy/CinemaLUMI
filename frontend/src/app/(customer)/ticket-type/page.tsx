import { fetchMovieById, fetchScreeningById, fetchVouchers, fetchMovies, fetchScreenings } from '@/lib/api';
import TicketTypeClient from './TicketTypeClient';

interface TicketTypePageProps {
  searchParams: Promise<{
    screeningId?: string;
    movieId?: string;
    seats?: string;
    basePrice?: string;
  }>;
}

export default async function TicketTypePage({ searchParams }: TicketTypePageProps) {
  const params = await searchParams;
  const [allMovies, allScreenings, vouchers] = await Promise.all([
    fetchMovies(),
    fetchScreenings(),
    fetchVouchers(),
  ]);

  const movie = (params.movieId ? await fetchMovieById(params.movieId) : null) || allMovies[0];
  const screening = (params.screeningId ? await fetchScreeningById(params.screeningId) : null) || allScreenings[0];
  const selectedSeats = params.seats ? params.seats.split(',') : ['E5', 'E6'];
  const basePrice = Number(params.basePrice) || screening.price * selectedSeats.length;

  return (
    <TicketTypeClient
      movie={movie}
      screening={screening}
      selectedSeats={selectedSeats}
      basePrice={basePrice}
      vouchers={vouchers}
    />
  );
}
