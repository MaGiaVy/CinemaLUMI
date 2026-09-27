import { fetchRevenueData, fetchMovies } from '@/lib/api';
import ReportsClient from './ReportsClient';

export default async function AdminReportsPage() {
  const [revenueData, movies] = await Promise.all([
    fetchRevenueData(),
    fetchMovies(),
  ]);

  return <ReportsClient initialRevenueData={revenueData} movies={movies} />;
}
