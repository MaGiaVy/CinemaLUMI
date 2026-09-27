import { fetchPricingConfig } from '@/lib/api';
import PricingConfigClient from './PricingConfigClient';

export default async function AdminPricingPage() {
  const pricing = await fetchPricingConfig();
  return <PricingConfigClient initialPricing={pricing} />;
}
