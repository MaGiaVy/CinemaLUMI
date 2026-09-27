import { fetchReviews } from '@/lib/api';
import ReviewModerationClient from './ReviewModerationClient';

export default async function AdminReviewsPage() {
  const reviews = await fetchReviews();
  return <ReviewModerationClient initialReviews={reviews} />;
}
