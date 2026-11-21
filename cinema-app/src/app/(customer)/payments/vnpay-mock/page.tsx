'use client';

import { Suspense } from 'react';
import PaymentGatewayShell from '@/components/payments/PaymentGatewayShell';

export default function VNPayGatewayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-6">
          <div className="w-8 h-8 rounded-full border-4 border-[#005BAA] border-t-transparent animate-spin" />
        </div>
      }
    >
      <PaymentGatewayShell provider="vnpay" />
    </Suspense>
  );
}
