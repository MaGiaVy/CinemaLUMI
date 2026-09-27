import { fetchVouchers } from '@/lib/api';
import VoucherManagementClient from './VoucherManagementClient';

export default async function AdminVouchersPage() {
  const vouchers = await fetchVouchers();
  return <VoucherManagementClient initialVouchers={vouchers} />;
}
