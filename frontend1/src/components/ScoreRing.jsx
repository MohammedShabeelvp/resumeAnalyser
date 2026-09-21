import { useEffect, useRef, useState } from "react";

export default function ScoreRing({ score = 0, color = "var(--color-teal)", label, size = 140, animate = true }) {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;

  const [displayed, setDisplayed] = useState(animate ? 0 : clamped);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!animate) {
      setDisplayed(clamped);
      return;
    }
    const start = performance.now();
    const duration = 1000;

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      setDisplayed(Math.round(progress * clamped));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped, animate]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: size, height: size, "--circumference": circumference, "--offset": offset }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth="10" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animate ? circumference : offset} // starts at full (hidden)
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={animate ? { animation: "ringDraw 1s ease forwards" } : undefined}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: size / 4.2, color }}>{displayed}</span>
        </div>
      </div>
      {label && <span className="section-label">{label}</span>}
    </div>
  );
}
