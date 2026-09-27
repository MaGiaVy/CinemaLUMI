import { fetchMovies } from '@/lib/api';
import MovieManagementClient from './MovieManagementClient';

export default async function AdminMoviesPage() {
  const movies = await fetchMovies();
  return <MovieManagementClient initialMovies={movies} />;
}
