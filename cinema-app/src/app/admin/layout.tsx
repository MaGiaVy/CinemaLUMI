import { ReactNode } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#1A1A1A]">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        {children}
      </main>
    </div>
  );
}
