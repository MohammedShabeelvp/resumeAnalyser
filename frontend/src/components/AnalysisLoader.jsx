import { useEffect, useState } from "react";

const STEPS = [
  { message: "Reading document...", duration: 1200 },
  { message: "Extracting text...", duration: 1000 },
  { message: "Detecting skills...", duration: 1200 },
  { message: "Comparing to job description...", duration: 1500 },
  { message: "Calculating ATS score...", duration: 1000 },
  { message: "Generating suggestions...", duration: 800 },
];

export default function AnalysisLoader() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer;

    function advance(index) {
      if (index >= STEPS.length - 1) return;
      timer = setTimeout(() => {
        if (!cancelled) {
          setStepIndex(index + 1);
          advance(index + 1);
        }
      }, STEPS[index].duration);
    }

    advance(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
          <circle cx="12" cy="12" r="9.5" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span
          key={stepIndex}
          className="text-sm text-white"
          style={{ fontFamily: "var(--font-sans)", animation: "shimmerPulse 1.1s ease-in-out infinite" }}
        >
          {STEPS[stepIndex].message}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-white/70" style={{ fontFamily: "var(--font-mono)" }}>
          Step {stepIndex + 1} of {STEPS.length}
        </span>
        <div className="flex items-center gap-1">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all"
              style={{
                height: 4,
                width: i <= stepIndex ? 18 : 6,
                background: i <= stepIndex ? "#ffffff" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
