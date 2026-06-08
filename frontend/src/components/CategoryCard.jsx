import SkillBadge from "./SkillBadge"

const categoryLabels = {
  programming_languages: "Programming Languages",
  frontend: "Frontend",
  backend: "Backend",
  databases: "Databases",
  ai_ml: "AI / ML",
  devops_cloud: "DevOps & Cloud",
  tools: "Tools"
}

export default function CategoryCard({ category, skills }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
        {categoryLabels[category] || category}
      </p>
      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <SkillBadge key={skill} skill={skill} />
        ))}
      </div>
    </div>
  )
}