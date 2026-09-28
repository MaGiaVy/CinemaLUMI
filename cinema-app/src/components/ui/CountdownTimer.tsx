'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  initialSeconds?: number;
  onExpire?: () => void;
  label?: string;
  isActive?: boolean;
}

export default function CountdownTimer({
  initialSeconds = 600,
  onExpire,
  label = 'Thời gian giữ ghế',
  isActive = true,
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!isActive) return;

    if (seconds <= 0) {
      onExpire?.();
      return;
    }
    const interval = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds, onExpire, isActive]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds < 120;
  const display = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[#B3B3B3] text-sm">{label}:</span>
      <span
        className={`font-mono font-bold text-lg px-3 py-1 rounded transition-colors ${
          isWarning
            ? 'text-[#E63946] bg-[#E63946]/10 border border-[#E63946]/30 animate-pulse'
            : 'text-[#FFB703] bg-[#FFB703]/10 border border-[#FFB703]/30'
        }`}
      >
        {display}
      </span>
    </div>
  );
}
