export default function Spinner({ size = 28, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: "spin 0.8s linear infinite" }}
      >
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="var(--color-border)"
          strokeWidth="2"
        />
        <path
          d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
          stroke="var(--color-teal)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="section-label">{label}</span>}
    </div>
  );
}
