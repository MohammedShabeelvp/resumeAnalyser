export default function SkillBadge({ skill, variant = "default" }) {
  const styles = {
    default: "bg-blue-50 text-blue-700 border-blue-100",
    missing: "bg-red-50 text-red-600 border-red-100",
    success: "bg-green-50 text-green-700 border-green-100"
  }

  return (
    <span className={`text-xs px-3 py-1 rounded-full border ${styles[variant]}`}>
      {skill}
    </span>
  )
}