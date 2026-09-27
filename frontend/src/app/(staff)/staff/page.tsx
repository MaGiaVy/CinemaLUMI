import { fetchTransactions } from '@/lib/api';
import StaffDashboardClient from './StaffDashboardClient';

export default async function StaffPage() {
  const transactions = await fetchTransactions();
  return <StaffDashboardClient initialTransactions={transactions} />;
}
