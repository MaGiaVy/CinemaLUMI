'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer select-none border tracking-wide';

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };

  const variants = {
    primary: 'bg-gradient-to-r from-[#E11D48] to-[#9F1239] hover:from-[#F43F5E] hover:to-[#BE123C] text-[#F8FAFC] border-rose-500/40 shadow-lg shadow-rose-950/40 active:scale-[0.98]',
    secondary: 'bg-[rgba(18,14,28,0.75)] hover:bg-[rgba(30,24,48,0.9)] text-[#F8FAFC] border-[rgba(192,132,252,0.22)] backdrop-blur-md active:scale-[0.98]',
    danger: 'bg-rose-950/40 text-rose-300 border-rose-600/50 hover:bg-rose-600 hover:text-white active:scale-[0.98]',
    ghost: 'bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[rgba(192,132,252,0.1)] border-transparent active:scale-[0.98]',
    gold: 'bg-gradient-to-r from-[#FDA4AF] to-[#C084FC] text-[#050508] font-bold border-transparent hover:opacity-90 shadow-md shadow-purple-950/30 active:scale-[0.98]',
  };

  const disabledClass = disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabledClass} ${widthClass} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
