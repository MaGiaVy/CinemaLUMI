import { fetchTickets, fetchMovies } from '@/lib/api';
import MyTicketsClient from './MyTicketsClient';

export default async function MyTicketsPage() {
  const [tickets, movies] = await Promise.all([
    fetchTickets(),
    fetchMovies(),
  ]);

  return <MyTicketsClient initialTickets={tickets} movies={movies} />;
}
