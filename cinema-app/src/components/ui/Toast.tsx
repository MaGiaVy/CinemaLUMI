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

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
};

const colors = {
  success: 'border-l-[#2ECC71] bg-[#2ECC71]/10',
  error: 'border-l-[#E63946] bg-[#E63946]/10',
  info: 'border-l-[#0088FF] bg-[#0088FF]/10',
  warning: 'border-l-[#FFB703] bg-[#FFB703]/10',
};

const iconColors = {
  success: 'text-[#2ECC71]',
  error: 'text-[#E63946]',
  info: 'text-[#0088FF]',
  warning: 'text-[#FFB703]',
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border border-[#404040] border-l-4 ${colors[toast.type]} ${exiting ? 'toast-exit' : 'toast-enter'} min-w-[280px] max-w-[360px] shadow-xl`}
    >
      <span className={`text-base font-bold mt-0.5 ${iconColors[toast.type]}`}>{icons[toast.type]}</span>
      <p className="text-sm text-white flex-1">{toast.message}</p>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 300); }}
        className="text-[#B3B3B3] hover:text-white ml-1 text-sm"
      >
        ✕
      </button>
    </div>
  );
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
