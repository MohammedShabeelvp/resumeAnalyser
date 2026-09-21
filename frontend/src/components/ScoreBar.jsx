export default function ScoreBar({ label, score = 0, weight, color = "var(--color-teal)" }) {
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm" style={{ fontFamily: "var(--font-sans)" }}>
          {label}
          {weight != null && <span className="ml-2 text-xs text-[var(--color-muted)]">weight {weight}</span>}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", color }} className="text-sm">
          {clamped}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--color-border)" }}>
        <div
          className="h-full rounded-full"
          style={{
            background: color,
            "--target-width": `${clamped}%`,
            animation: "barGrow 0.9s ease forwards",
          }}
        />
      </div>
    </div>
  );
}
