import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'green' | 'red' | 'gold' | 'blue' | 'gray' | 'purple';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  const variants = {
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    red: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    gold: 'bg-fuchsia-500/15 text-[#FDA4AF] border border-fuchsia-500/30 shadow-[0_0_8px_rgba(253,164,175,0.15)]',
    blue: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    gray: 'bg-slate-800/40 text-slate-300 border border-slate-700/50',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-md uppercase tracking-wider ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
