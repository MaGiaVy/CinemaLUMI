import { ReactNode } from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#050508] text-[#f8fafc] relative overflow-x-hidden">
      {/* Deep Galaxy Multi-layered Nebula Aura Backdrop */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(circle at 12% 18%, rgba(136, 19, 55, 0.25) 0%, transparent 45%),
            radial-gradient(circle at 88% 12%, rgba(88, 28, 135, 0.28) 0%, transparent 48%),
            radial-gradient(circle at 50% 85%, rgba(112, 26, 117, 0.18) 0%, transparent 55%),
            radial-gradient(circle at 75% 65%, rgba(225, 29, 72, 0.1) 0%, transparent 40%),
            #050508
          `,
        }}
      />

      {/* Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto relative z-10 flex flex-col">
        {children}
      </main>
    </div>
  );
}
