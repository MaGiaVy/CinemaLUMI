import { fetchCombos } from '@/lib/api';
import ComboManagementClient from './ComboManagementClient';

export default async function AdminCombosPage() {
  const combos = await fetchCombos();
  return <ComboManagementClient initialCombos={combos} />;
}
