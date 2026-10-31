'use client';

import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const toastConfigs = {
  success: {
    bg: 'bg-[#0E2517]',
    border: 'border-[#2ECC71] border-l-[#2ECC71]',
    badgeBg: 'bg-[#2ECC71]',
    badgeText: 'text-black',
    icon: '✓',
    title: 'Thành công',
    shadow: 'shadow-2xl shadow-[#2ECC71]/30',
  },
  error: {
    bg: 'bg-[#2D0F14]',
    border: 'border-[#E63946] border-l-[#E63946]',
    badgeBg: 'bg-[#E63946]',
    badgeText: 'text-white',
    icon: '✕',
    title: 'Lỗi',
    shadow: 'shadow-2xl shadow-[#E63946]/30',
  },
  warning: {
    bg: 'bg-[#2E2005]',
    border: 'border-[#FFB703] border-l-[#FFB703]',
    badgeBg: 'bg-[#FFB703]',
    badgeText: 'text-black',
    icon: '!',
    title: 'Cảnh báo',
    shadow: 'shadow-2xl shadow-[#FFB703]/30',
  },
  info: {
    bg: 'bg-[#0C1E33]',
    border: 'border-[#0088FF] border-l-[#0088FF]',
    badgeBg: 'bg-[#0088FF]',
    badgeText: 'text-white',
    icon: 'ℹ',
    title: 'Thông báo',
    shadow: 'shadow-2xl shadow-[#0088FF]/30',
  },
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const cfg = toastConfigs[toast.type] || toastConfigs.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3.5 px-4 py-3.5 rounded-xl border-2 border-l-[6px] ${cfg.bg} ${cfg.border} ${cfg.shadow} ${
        exiting ? 'toast-exit' : 'toast-enter'
      } min-w-[320px] max-w-[440px] text-white opacity-100 z-50 pointer-events-auto`}
      style={{ opacity: 1 }}
    >
      <div className={`w-7 h-7 rounded-full ${cfg.badgeBg} ${cfg.badgeText} flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-md`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-0.5">
          {cfg.title}
        </p>
        <p className="text-sm font-medium text-white leading-relaxed break-words">
          {toast.message}
        </p>
      </div>
      <button
        type="button"
        onClick={handleClose}
        className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/25 text-[#E0E0E0] hover:text-white flex items-center justify-center text-xs transition-colors shrink-0 font-bold"
        title="Đóng thông báo"
      >
        ✕
      </button>
    </div>
  );
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
