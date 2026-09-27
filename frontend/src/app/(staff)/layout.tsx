import { ReactNode } from 'react';
import StaffSidebar from '@/components/layout/StaffSidebar';

export default function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#1A1A1A]">
      <StaffSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        {children}
      </main>
    </div>
  );
}
