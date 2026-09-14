// Countdown Overlay for SYNTROX Neon Air Hockey
import React, { useEffect, useState } from 'react';
import { soundManager } from '../audio/soundManager';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(3); // 3, 2, 1, 0 (GO)

  useEffect(() => {
    // Beep for 3
    soundManager.playCountdown(false);

    const t2 = setTimeout(() => {
      setStep(2);
      soundManager.playCountdown(false);
    }, 850);

    const t1 = setTimeout(() => {
      setStep(1);
      soundManager.playCountdown(false);
    }, 1700);

    const t0 = setTimeout(() => {
      setStep(0);
      soundManager.playCountdown(true);
    }, 2550);

    const tEnd = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(t0);
      clearTimeout(tEnd);
    };
  }, [onComplete]);

  return (
    <div
      id="syntrox-countdown-overlay"
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-none select-none"
    >
      <div className="flex flex-col items-center">
        <span className="font-mono text-xs sm:text-sm tracking-[0.3em] text-cyan-400/80 mb-2 uppercase">
          PREPARE FOR BATTLE
        </span>

        {step > 0 ? (
          <div
            key={step}
            className="font-['Orbitron'] text-7xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-300 to-cyan-500 drop-shadow-[0_0_35px_rgba(0,240,255,0.8)] animate-ping"
            style={{ animationDuration: '0.85s', animationIterationCount: 1 }}
          >
            {step}
          </div>
        ) : (
          <div
            key="go"
            className="font-['Orbitron'] text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-300 to-emerald-500 drop-shadow-[0_0_40px_rgba(16,185,129,0.9)] scale-110 transition-transform"
          >
            GO!
          </div>
        )}
      </div>
    </div>
  );
};
