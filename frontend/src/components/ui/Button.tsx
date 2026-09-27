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
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded transition-all duration-200 cursor-pointer select-none border-0';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants = {
    primary: 'bg-[#E63946] text-white hover:bg-[#C62B36] active:scale-95',
    secondary: 'bg-[#383838] text-white hover:bg-[#404040] active:scale-95',
    danger: 'bg-[#E63946] text-white hover:bg-[#C62B36] border border-[#E63946] active:scale-95',
    ghost: 'bg-transparent text-[#B3B3B3] hover:text-white hover:bg-[#383838] active:scale-95',
    gold: 'bg-[#FFB703] text-[#1A1A1A] hover:bg-[#E6A400] active:scale-95',
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
