const VARIANTS = {
  default: {
    background: "#EEF6F3",
    color: "#1A6B52",
    border: "#B8D9CF",
  },
  success: {
    background: "#EDFAF3",
    color: "#166534",
    border: "#A7F3D0",
  },
  missing: {
    background: "#FEF2F2",
    color: "#991B1B",
    border: "#FECACA",
  },
};

export default function SkillBadge({ skill, variant = "default" }) {
  const style = VARIANTS[variant] ?? VARIANTS.default;

  // Defensive: never let a stray object/array crash the render tree.
  const label =
    typeof skill === "string" || typeof skill === "number"
      ? skill
      : skill && typeof skill === "object"
      ? JSON.stringify(skill)
      : String(skill ?? "");

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs"
      style={{
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontFamily: "var(--font-sans)",
      }}
    >
      {label}
    </span>
  );
}
