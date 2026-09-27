import { fetchScreenings, fetchMovies } from '@/lib/api';
import ScreeningManagementClient from './ScreeningManagementClient';

export default async function AdminScreeningsPage() {
  const [screenings, movies] = await Promise.all([
    fetchScreenings(),
    fetchMovies(),
  ]);

  return <ScreeningManagementClient initialScreenings={screenings} movies={movies} />;
}
