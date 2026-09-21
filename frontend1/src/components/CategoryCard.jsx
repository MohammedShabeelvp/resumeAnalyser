import SkillBadge from "./SkillBadge";

export default function CategoryCard({ title, skills = [] }) {
  return (
    <div className="card p-4">
      <p className="section-label mb-3">{title}</p>
      {skills.length === 0 ? (
        <p className="text-xs text-[var(--color-muted)]">No skills detected in this category.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <SkillBadge key={skill} skill={skill} variant="default" />
          ))}
        </div>
      )}
    </div>
  );
}
