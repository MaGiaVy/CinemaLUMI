import { fetchTransactions, fetchTickets } from '@/lib/api';
import TicketLookupClient from './TicketLookupClient';

export default async function StaffLookupPage() {
  const [transactions, tickets] = await Promise.all([
    fetchTransactions(),
    fetchTickets(),
  ]);

  return <TicketLookupClient initialTransactions={transactions} initialTickets={tickets} />;
}
