import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import SkillBadge from "../components/SkillBadge"
import { useAuth } from "../context/AuthContext"


function ScoreRing({ score, color }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <svg width="140" height="140" className="-rotate-90">
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="10"
      />

      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease" }}
      />
    </svg>
  )
}

function ScoreBar({ label, score, weight, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 capitalize">
          {label}
          <span className="text-gray-300 ml-1">
            (weight {weight}%)
          </span>
        </span>

        <span className="font-medium text-gray-700">
          {score}%
        </span>
      </div>

      <div className="bg-gray-100 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="card mb-4">
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {title}
        </p>

        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  )
}

const scoreConfig = (score) => {
  if (score >= 75)
    return {
      color: "#22c55e",
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-100",
      label: "Strong match"
    }

  if (score >= 50)
    return {
      color: "#3b82f6",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-100",
      label: "Good match"
    }

  if (score >= 30)
    return {
      color: "#f59e0b",
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-100",
      label: "Partial match"
    }

  return {
    color: "#ef4444",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-100",
    label: "Low match"
  }
}

const factorColors = {
  skills: "#3b82f6",
  experience: "#8b5cf6",
  education: "#10b981",
  keywords: "#f59e0b",
  structure: "#252525"
}

const gapCategories = [
  { key: "skills", label: "Missing skills" },
  { key: "action_verbs", label: "Action verbs" },
  { key: "soft_skills", label: "Soft skills" },
  { key: "domain_terms", label: "Domain terms" }
]

export default function MatchPage() {
  const [data, setData] = useState(() => {
    try {
      const stored = sessionStorage.getItem("matchData")
      return stored ? JSON.parse(stored) : null
    } catch {
      sessionStorage.clear()
      return null
    }
  })
  const { user } = useAuth()
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {

    if (!data) {
      navigate("/")
      return
    }

    const timer = setTimeout(() => {
      setVisible(true)
    }, 100)

    return () => clearTimeout(timer)

  }, [data, navigate])

  if (!data) return null

  const {
    tfidf_score,
    bert_score,
    combined_score,
    similarity_score,
    common_keywords,
    ats,
    gaps
  } = data

  const config = scoreConfig(combined_score || similarity_score)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Match Results
            </h1>

            <p className="text-sm text-gray-400 mt-0.5">
              Resume vs Job Description
            </p>
          </div>

          <button
            onClick={() => navigate("/analysis")}
            className="btn-secondary"
          >
            Back to Analysis
          </button>
        </div>

        {/* Summary banner */}
        <div
          className={`rounded-2xl border p-4 mb-4 flex items-center gap-3 ${config.bg} ${config.border}`}
        >
          <span className={`text-2xl font-semibold ${config.text}`}>
            {similarity_score}%
          </span>

          <div>
            <p className={`text-sm font-medium ${config.text}`}>
              {config.label}
            </p>

            <p className="text-xs text-gray-400">
              {gaps?.total_missing > 0
                ? `${gaps.total_missing} gaps identified — see breakdown below`
                : "No significant gaps detected"}
            </p>
          </div>
        </div>

        {!user && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Save this analysis to your history
                </p>
                <p className="text-xs text-blue-500 mt-0.5">
                  Sign in or create a free account — this analysis will be saved automatically
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate("/login")}
                  className="text-xs text-blue-600 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition"
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        )}

        {user && data.saved_to_history && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3 mb-4">
            <p className="text-xs text-green-600">✓ Analysis saved to your history</p>
          </div>
        )}

        {/* Score ring + ATS side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

          {/* Match score ring */}
          <div className="card mb-4 flex flex-col items-center justify-center">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
              Match score
            </p>

            <div className="relative">
              <ScoreRing
                score={visible ? similarity_score : 0}
                color={config.color}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold text-gray-900">
                  {similarity_score}%
                </span>

                <span className="text-xs text-gray-400">
                  {config.label}
                </span>
              </div>
            </div>
          </div>

          {/* ATS score ring */}
          {ats && (() => {
            const atsConfig = scoreConfig(ats.ats_score)

            return (
              <div className="card mb-4 flex flex-col items-center justify-center">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
                  ATS score
                </p>

                <div className="relative">
                  <ScoreRing
                    score={visible ? ats.ats_score : 0}
                    color={atsConfig.color}
                  />

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-semibold text-gray-900">
                      {ats.ats_score}%
                    </span>

                    <span className="text-xs text-gray-400">
                      {ats.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Score comparison */}
        {data.bert_score && (
          <SectionCard title="Score breakdown">
            <div className="space-y-4">

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">
                    Semantic match
                    <span className="text-gray-300 ml-1">
                      (BERT — meaning based)
                    </span>
                  </span>

                  <span className="font-medium text-gray-700">
                    {data.bert_score}%
                  </span>
                </div>

                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-purple-500 transition-all duration-700"
                    style={{ width: `${data.bert_score}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">
                    Keyword match
                    <span className="text-gray-300 ml-1">
                      (TF-IDF — exact words)
                    </span>
                  </span>

                  <span className="font-medium text-gray-700">
                    {data.tfidf_score}%
                  </span>
                </div>

                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-400 transition-all duration-700"
                    style={{ width: `${data.tfidf_score}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-50">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">
                    Combined score
                    <span className="text-gray-300 ml-1">
                      (65% BERT + 35% TF-IDF)
                    </span>
                  </span>

                  <span className="font-medium text-gray-700">
                    {data.combined_score}%
                  </span>
                </div>

                <div className="bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gray-800 transition-all duration-700"
                    style={{ width: `${data.combined_score}%` }}
                  />
                </div>
              </div>

            </div>
          </SectionCard>
        )}

        {/* ATS breakdown bars */}
        {ats && (
          <SectionCard title="ATS breakdown">
            <div className="space-y-4">
              {Object.entries(ats.breakdown).map(([factor, values]) => (
                <ScoreBar
                  key={factor}
                  label={factor}
                  score={values.score}
                  weight={values.weight}
                  color={factorColors[factor]}
                />
              ))}
            </div>
          </SectionCard>
        )}

        {/* Gap analysis */}
        {gaps && (
          <SectionCard
            title="Gap analysis"
            subtitle={`${gaps.total_missing} items found in the job description but not in your resume`}
          >
            {/* Priority */}
            {gaps.priority?.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-medium text-amber-700 mb-2">
                  Top priorities to add to your resume
                </p>

                <div className="flex flex-wrap gap-2">
                  {gaps.priority.map(p => (
                    <SkillBadge
                      key={p}
                      skill={p}
                      variant="missing"
                    />
                  ))}
                </div>
              </div>
            )}

            {gapCategories.map(({ key, label }) => (
              gaps.missing[key]?.length > 0 && (
                <div key={key} className="mb-3 last:mb-0">
                  <p className="text-xs text-gray-400 mb-2">
                    {label}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {gaps.missing[key].map(item => (
                      <SkillBadge
                        key={item}
                        skill={item}
                        variant="missing"
                      />
                    ))}
                  </div>
                </div>
              )
            ))}

            {gaps.total_missing === 0 && (
              <p className="text-sm text-green-600">
                ✓ No significant gaps detected
              </p>
            )}
          </SectionCard>
        )}

        {/* Common keywords */}
        {common_keywords?.length > 0 && (
          <SectionCard
            title="Keywords in common"
            subtitle="Words that appear in both your resume and the job description"
          >
            <div className="flex flex-wrap gap-2">
              {common_keywords.map(kw => (
                <SkillBadge
                  key={kw}
                  skill={kw}
                  variant="success"
                />
              ))}
            </div>
          </SectionCard>
        )}

        {/* Show suggestions */}
        {data.suggestions?.length > 0 && (
          <div className="card mb-4">
            <p className="section-label mb-1">Resume suggestions</p>
            <p className="text-xs text-gray-400 mb-4">
              Specific improvements to increase your match score
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {data.suggestions.map((s, index) => {
                const styles = {
                  high:   { badge: "bg-red-50 text-red-600 border-red-100"     },
                  medium: { badge: "bg-amber-50 text-amber-600 border-amber-100" },
                  low:    { badge: "bg-blue-50 text-blue-600 border-blue-100"   }
                }
                const style = styles[s.priority] || styles.low

                const icons = {
                  missing_skill: "🔧",
                  experience:    "💼",
                  education:     "🎓",
                  keywords:      "🔑",
                  general:       "📄"
                }

                return (
                  <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-base mt-0.5 shrink-0">
                      {icons[s.type] || "💡"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{s.message}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border self-start whitespace-nowrap shrink-0 ${style.badge}`}>
                      {s.priority}
                    </span>
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-gray-300 mt-2 text-right">
              {data.suggestions.length} suggestions
            </p>
          </div>
        )}

      </div>
    </div>
  )
}