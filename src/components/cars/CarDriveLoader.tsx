'use client';

import { useEffect } from 'react';

interface CarDriveLoaderProps {
  /** When true, the car speeds away and the overlay fades — then unmounts via parent. */
  leaving?: boolean;
  text?: string;
}

/**
 * Playful car-detail loader: a gold car drives in place (spinning wheels,
 * dust puffs, moving road) while the ad loads. When `leaving` flips, the car
 * speeds off-screen and the overlay fades to reveal the page.
 */
export function CarDriveLoader({ leaving = false, text = 'جاري تحميل تفاصيل السيارة' }: CarDriveLoaderProps) {
  useEffect(() => {
    document.body.style.overflow = leaving ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [leaving]);

  return (
    <div
      className={`fixed inset-0 z-[90] flex flex-col items-center justify-center bg-surface-950 overflow-hidden transition-opacity duration-300 ${leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      role="status"
      aria-label={text}
    >
      {/* scene */}
      <div className={`relative w-48 sm:w-60 ${leaving ? 'drive-away' : ''}`}>
        {/* dust puffs (behind car = right side, car faces left) */}
        {!leaving && (
          <>
            <span className="dust-puff" style={{ right: '6%', bottom: '18%', animationDelay: '0s' }} />
            <span className="dust-puff dust-mid" style={{ right: '2%', bottom: '26%', animationDelay: '0.4s' }} />
            <span className="dust-puff dust-big" style={{ right: '10%', bottom: '10%', animationDelay: '0.8s' }} />
          </>
        )}
        {leaving && (
          <>
            <span className="dust-puff dust-big" style={{ right: '12%', bottom: '16%', animationDelay: '0s' }} />
            <span className="dust-puff dust-mid" style={{ right: '4%', bottom: '30%', animationDelay: '0.1s' }} />
            <span className="dust-puff" style={{ right: '20%', bottom: '8%', animationDelay: '0.15s' }} />
          </>
        )}

        {/* car */}
        <svg viewBox="0 0 320 150" className={`w-full h-auto ${leaving ? '' : 'car-bob'}`} aria-hidden="true">
          {/* windows */}
          <path d="M102 72 C114 48 138 40 168 40 C198 40 214 50 226 72 Z" fill="#12100c" />
          <line x1="164" y1="40" x2="164" y2="72" stroke="#ffc640" strokeWidth="4" />
          {/* body */}
          <path
            d="M18 96 C18 88 24 84 34 82 L78 74 C92 72 98 72 108 72 L232 72 C244 72 250 74 262 78 L292 86 C302 89 306 93 306 100 L306 104 C306 110 302 112 296 112 L28 112 C22 112 18 108 18 100 Z"
            fill="#ffc640"
          />
          {/* front light (left = forward) */}
          <rect x="20" y="90" width="12" height="7" rx="3.5" fill="#fff7e0" />
          {/* rear light */}
          <rect x="294" y="90" width="10" height="7" rx="3.5" fill="#c2410c" />
          {/* door line + handle */}
          <line x1="168" y1="74" x2="168" y2="110" stroke="#b38600" strokeWidth="2" />
          <rect x="178" y="80" width="20" height="5" rx="2.5" fill="#1a1712" />
          {/* wheels */}
          <g>
            <circle cx="88" cy="112" r="22" fill="#0c0a07" stroke="#3a352a" strokeWidth="3" />
            <g className="wheel-spin">
              <circle cx="88" cy="112" r="9" fill="#ffc640" />
              <line x1="88" y1="103" x2="88" y2="121" stroke="#1a1712" strokeWidth="2.5" />
              <line x1="79" y1="112" x2="97" y2="112" stroke="#1a1712" strokeWidth="2.5" />
            </g>
          </g>
          <g>
            <circle cx="236" cy="112" r="22" fill="#0c0a07" stroke="#3a352a" strokeWidth="3" />
            <g className="wheel-spin">
              <circle cx="236" cy="112" r="9" fill="#ffc640" />
              <line x1="236" y1="103" x2="236" y2="121" stroke="#1a1712" strokeWidth="2.5" />
              <line x1="227" y1="112" x2="245" y2="112" stroke="#1a1712" strokeWidth="2.5" />
            </g>
          </g>
        </svg>

        {/* road */}
        <div className="road-dashes" />
      </div>

      {/* text */}
      <p className="mt-6 text-sm font-bold text-surface-300">
        {text}
        <span className="loading-dots" aria-hidden="true">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </p>
    </div>
  );
}
