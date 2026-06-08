import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import SkillBadge from "../components/SkillBadge"
import CategoryCard from "../components/CategoryCard"
import axios from "axios"

export default function AnalysisPage() {

  //const [data, setData] = useState(null)

  const [matchStatus, setMatchStatus] = useState(null)
  const [matchMessage, setMatchMessage] = useState("")
  const [matchLoading, setMatchLoading] = useState(false)
  const [jobDescription, setJobDescription] = useState(() => {
    return sessionStorage.getItem("lastJobDescription") || ""
  })

  const handleMatch = async () => {

    if (!jobDescription.trim()) {
      setMatchStatus("error")
      setMatchMessage("Please paste a job description first.")
      return
    }

    try {
      setMatchLoading(true)
      setMatchStatus(null)

      const res = await axios.post("http://localhost:5000/match", {
        resume_text: text,
        job_description: jobDescription,
        upload_id: data.upload_id
      })

      sessionStorage.setItem("lastJobDescription", jobDescription)

      sessionStorage.setItem("matchData", JSON.stringify({
        ...res.data,
        job_description: jobDescription,
        resume_skills: skills.detected,
        resume_text: text
      }))

      // If guest, store pending analysis to save after login
      if (!data.upload_id) {
        sessionStorage.setItem("pendingAnalysis", JSON.stringify({
          resume_text:     text,
          job_description: jobDescription,
          filename:        data.filename,
          skills:          skills.detected,
          match_data:      res.data
        }))
      }

      navigate("/match")

    } catch (err) {
      setMatchStatus("error")
      setMatchMessage(err.response?.data?.error || "Something went wrong.")
    } finally {
      setMatchLoading(false)
    }
  }

  const navigate = useNavigate()

  const [data, setData] = useState(() => {
    try {
      const stored = sessionStorage.getItem("resumeData")
      return stored ? JSON.parse(stored) : null
    } catch {
      sessionStorage.clear()
      return null
    }
  })

  const [recommendations, setRecommendations] = useState([])

  /*useEffect(() => {
    const stored = sessionStorage.getItem("resumeData")
    if (!stored) {
      navigate("/")
      return
    }
    setData(JSON.parse(stored))
  }, [])*/

  useEffect(() => {
    if (!data) {
      navigate("/")
      return
    }

    axios.post("http://localhost:5000/recommend", {
      resume_text: data.text
    })
    .then(res => setRecommendations(res.data.recommendations))
    .catch(err => console.error("Recommendations failed:", err))

  }, [data])

  if (!data) return null

  const { filename, skills, text } = data

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Analysis Results
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{filename}</p>
          </div>

          {/*<button
            onClick={() => navigate("/")}
            className="btn-secondary"
          >
            ← Upload another
          </button>*/}
        </div>

        {/* Skill count stat */}
        <div className="card mb-4 flex items-center gap-4">
          <div className="text-4xl font-semibold text-blue-600">
            {skills.count}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700">
              Skills detected
            </p>
            <p className="text-xs text-gray-400">
              From your resume
            </p>
          </div>
        </div>

        {/* All skills flat */}
        <div className="card mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            All detected skills
          </p>

          <div className="flex flex-wrap gap-2">
            {skills.detected.map(skill => (
              <SkillBadge key={skill} skill={skill} />
            ))}
          </div>
        </div>

        {/* Skills by category */}
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          By category
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {Object.entries(skills.by_category).map(([category, categorySkills]) => (
            <CategoryCard
              key={category}
              category={category}
              skills={categorySkills}
            />
          ))}
        </div>

        {/* Job recommendations */}
        {recommendations.length > 0 && (
          <div className="card mb-4">
            <p className="section-label mb-1">Recommended roles</p>
            <p className="text-xs text-gray-400 mb-4">
              Based on your resume skills and experience
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.role}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-400 w-4">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{rec.role}</p>
                      <p className="text-xs text-gray-400">{rec.reason}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ml-3 shrink-0 ${
                    rec.score >= 75 ? "text-green-600" :
                    rec.score >= 50 ? "text-blue-600" :
                    "text-amber-500"
                  }`}>
                    {rec.score}%
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-300 mt-2 text-right">
              {recommendations.length} roles analysed
            </p>
          </div>
        )}

        {/* Job Description Input */}
        <div className="card mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Job description
          </p>

          <p className="text-xs text-gray-400 mb-3">
            Paste a job posting to compare against your resume
          </p>

          <textarea
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value)
              setMatchStatus(null)
            }}
            rows={6}
            placeholder="Paste the full job description here..."
            className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:border-blue-300"
          />

          <button
            onClick={handleMatch}
            disabled={matchLoading}
            className="btn-primary mt-3 w-full disabled:bg-blue-300"
          >
            {matchLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Analysing...
              </span>
            ) : (
              "Analyse Match →"
            )}
          </button>

          {matchStatus === "error" && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
              ✗ {matchMessage}
            </p>
          )}
        </div>

        {/* Raw text toggle */}
        <details className="card">
          <summary className="text-xs font-medium text-gray-400 uppercase tracking-wide cursor-pointer">
            Raw extracted text
          </summary>

          <textarea
            readOnly
            value={text}
            rows={10}
            className="mt-4 w-full text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none font-mono"
          />
        </details>

      </div>
    </div>
  )
}