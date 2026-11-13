import { ReactNode } from 'react';
import StaffSidebar from '@/components/layout/StaffSidebar';

export default function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#050508] text-[#F8FAFC] selection:bg-[#E11D48] selection:text-white relative overflow-x-hidden font-sans">
      {/* Deep Galaxy Multi-layered Nebula Aura Background */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(circle at 15% 15%, rgba(136, 19, 55, 0.35) 0%, transparent 45%),
            radial-gradient(circle at 85% 20%, rgba(88, 28, 135, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 50% 85%, rgba(112, 26, 117, 0.25) 0%, transparent 60%),
            radial-gradient(circle at 50% 30%, rgba(225, 29, 72, 0.12) 0%, transparent 40%),
            #050508
          `
        }}
      />
      <div className="relative z-10 flex min-h-screen w-full">
        <StaffSidebar />
        <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
