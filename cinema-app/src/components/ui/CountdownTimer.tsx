'use client';

import { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
  initialSeconds?: number;
  targetTime?: string | Date | number | null;
  onExpire?: () => void;
  label?: string;
  isActive?: boolean;
}

function getRemainingSeconds(targetTime?: string | Date | number | null, fallbackSeconds = 600): number {
  if (!targetTime) return fallbackSeconds;
  try {
    const targetMs = new Date(targetTime).getTime();
    if (isNaN(targetMs)) return fallbackSeconds;
    const diffSec = Math.floor((targetMs - Date.now()) / 1000);
    return Math.max(0, diffSec);
  } catch {
    return fallbackSeconds;
  }
}

export default function CountdownTimer({
  initialSeconds = 600,
  targetTime,
  onExpire,
  label = 'Thời gian giữ vé',
  isActive = true,
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(() => getRemainingSeconds(targetTime, initialSeconds));
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const rem = getRemainingSeconds(targetTime, initialSeconds);
    setSeconds(rem);
    hasExpiredRef.current = rem <= 0;
  }, [targetTime, initialSeconds]);

  useEffect(() => {
    if (!isActive) return;

    const initialRem = targetTime ? getRemainingSeconds(targetTime, initialSeconds) : seconds;
    if (initialRem <= 0) {
      setSeconds(0);
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current?.();
      }
      return;
    }

    const interval = setInterval(() => {
      setSeconds(prev => {
        const next = targetTime
          ? getRemainingSeconds(targetTime, initialSeconds)
          : Math.max(0, prev - 1);

        if (next <= 0) {
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, initialSeconds, isActive]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isWarning = seconds < 120;
  const display = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl backdrop-blur-md transition-all duration-300 ${
        isWarning
          ? 'bg-[#881337]/25 border border-[#E11D48] shadow-[0_0_20px_rgba(225,29,72,0.45)] animate-pulse'
          : 'bg-[rgba(18,14,28,0.75)] border border-[rgba(192,132,252,0.22)] shadow-[0_0_15px_rgba(88,28,135,0.25)]'
      }`}
    >
      {/* Biểu tượng đồng hồ cát xoay vũ trụ - Ngoại lệ duy nhất được phép dùng theo DESIGN.md */}
      <span className="hourglass-spin text-sm select-none" aria-label="Đồng hồ đếm ngược">
        ⏳
      </span>
      <span className="text-[#94A3B8] text-xs font-medium tracking-wide">
        {label}:
      </span>
      <span
        className={`font-mono font-bold text-sm sm:text-base tracking-wider ${
          isWarning ? 'text-[#FDA4AF]' : 'text-[#F8FAFC]'
        }`}
      >
        {display}
      </span>
    </div>
  );
}
