import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'green' | 'red' | 'gold' | 'blue' | 'gray' | 'purple';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'gray', size = 'sm' }: BadgeProps) {
  const variants = {
    green: 'bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30',
    red: 'bg-[#E63946]/20 text-[#E63946] border border-[#E63946]/30',
    gold: 'bg-[#FFB703]/20 text-[#FFB703] border border-[#FFB703]/30',
    blue: 'bg-[#0088FF]/20 text-[#0088FF] border border-[#0088FF]/30',
    gray: 'bg-[#404040]/60 text-[#B3B3B3] border border-[#525252]',
    purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded uppercase tracking-wide ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
