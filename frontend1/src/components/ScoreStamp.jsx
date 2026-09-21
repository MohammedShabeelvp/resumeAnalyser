// The signature visual: a large serif numeral inside a hand-drawn-feeling
// ring, the way an editor circles a grade in red pen. Color of the ring
// reflects how strong the score is.
export default function ScoreStamp({ score, size = "lg", label }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  const tone = pct >= 75 ? "green" : pct >= 50 ? "ochre" : "red";
  const dims = size === "lg" ? "h-28 w-28 text-4xl" : "h-16 w-16 text-xl";

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div
        className={`relative flex items-center justify-center rounded-full ${dims}`}
        style={{ border: `3px solid var(--color-${tone})` }}
      >
        <span className="masthead-title" style={{ color: `var(--color-${tone})` }}>
          {pct}
        </span>
      </div>
      {label && <span className="eyebrow">{label}</span>}
    </div>
  );
}