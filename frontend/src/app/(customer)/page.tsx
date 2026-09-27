import { fetchMovies, fetchScreenings, fetchReviews } from '@/lib/api';
import MovieScheduleClient from './MovieScheduleClient';

export default async function CustomerHomePage() {
  // Asynchronous API calls (Server Component)
  const [movies, screenings, reviews] = await Promise.all([
    fetchMovies(),
    fetchScreenings(),
    fetchReviews(),
  ]);

  return (
    <MovieScheduleClient
      initialMovies={movies}
      initialScreenings={screenings}
      initialReviews={reviews}
    />
  );
}
