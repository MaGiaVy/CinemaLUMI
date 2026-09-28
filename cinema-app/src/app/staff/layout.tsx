import { ReactNode } from 'react';
import StaffSidebar from '@/components/layout/StaffSidebar';

export default function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#141414] text-white">
      <StaffSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
