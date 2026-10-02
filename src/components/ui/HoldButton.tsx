'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * Hold-to-confirm button (reactbits.dev pattern).
 * Liquid fill rises while pressed, snaps back on early release,
 * swaps label through blur when hold completes.
 */
export function HoldButton({
  onComplete,
  holdDuration = 2000,
  className = '',
  children,
}: {
  onComplete: () => void;
  holdDuration?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [labelSwapped, setLabelSwapped] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef(false);

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = timestamp - startTimeRef.current;
    const p = Math.min(1, elapsed / holdDuration);
    setProgress(p);

    if (p >= 1 && !completedRef.current) {
      completedRef.current = true;
      setCompleted(true);
      setLabelSwapped(true);
      setTimeout(() => onComplete(), 400);
      return;
    }
    rafRef.current = requestAnimationFrame(animate);
  }, [holdDuration, onComplete]);

  const handlePointerDown = useCallback(() => {
    if (completedRef.current) return;
    startTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const handlePointerUp = useCallback(() => {
    if (completedRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    // Snap back
    setProgress(0);
    startTimeRef.current = 0;
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (completedRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setProgress(0);
    startTimeRef.current = 0;
  }, []);

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative overflow-hidden select-none touch-none ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Liquid fill background */}
      <div
        className="absolute inset-0 bg-rose-500/20 transition-none"
        style={{
          clipPath: `inset(${(1 - progress) * 100}% 0 0 0)`,
        }}
      />
      {/* Content */}
      <span
        className={`relative z-10 transition-all duration-300 ${
          labelSwapped ? 'blur-sm opacity-0' : 'blur-0 opacity-100'
        }`}
      >
        {children}
      </span>
      {/* Swapped label */}
      {labelSwapped && (
        <span className="absolute inset-0 z-20 flex items-center justify-center text-rose-300 font-black blur-0 animate-[fadeSlideIn_0.3s_ease-out]">
          تم التأكيد
        </span>
      )}
    </button>
  );
}
