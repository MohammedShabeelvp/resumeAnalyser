import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import Spinner from "../components/Spinner"

export default function HistoryPage() {
  const [history, setHistory]           = useState([])
  const [loading, setLoading]           = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)
  const [editingId, setEditingId]       = useState(null)
  const [editName, setEditName]         = useState("")
  const [rematchId, setRematchId]       = useState(null)
  const [rematchJD, setRematchJD]       = useState("")
  const [rematchLoading, setRematchLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHistory = () => {
      setLoading(true)
      axios.get("http://localhost:5000/history")
        .then(res => setHistory(res.data.history))
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }
    fetchHistory()
  }, [])

  const handleDeleteOne = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/history/${id}`)
      setHistory(prev => prev.filter(item => item.id !== id))
    } catch (err) {
      console.error("Delete failed:", err)
    }
  }

  const handleClearAll = async () => {
    try {
      await axios.delete("http://localhost:5000/history")
      setHistory([])
      setConfirmClear(false)
    } catch (err) {
      console.error("Clear failed:", err)
    }
  }

  const handleRename = async (id) => {
    if (!editName.trim()) return
    try {
      await axios.patch(`http://localhost:5000/history/${id}/rename`, {
        name: editName
      })
      setHistory(prev => prev.map(item =>
        item.id === id ? { ...item, name: editName } : item
      ))
      setEditingId(null)
      setEditName("")
    } catch (err) {
      console.error("Rename failed:", err)
    }
  }

  const handleRematch = async (item) => {
    if (!rematchJD.trim()) return
    setRematchLoading(true)
    try {
      const res = await axios.post(
        `http://localhost:5000/history/${item.id}/rematch`,
        { job_description: rematchJD }
      )

      sessionStorage.setItem("matchData", JSON.stringify({
        ...res.data,
        job_description: rematchJD,
        resume_text:     res.data.resume_text
      }))

      sessionStorage.setItem("lastJobDescription", rematchJD)
      navigate("/match")

    } catch (err) {
      console.error("Rematch failed:", err)
    } finally {
      setRematchLoading(false)
    }
  }

  const scoreColor = (score) => {
    if (score >= 75) return "text-green-600"
    if (score >= 50) return "text-blue-600"
    if (score >= 30) return "text-amber-500"
    return "text-red-500"
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">History</h1>
            <p className="text-sm text-gray-400 mt-0.5">Past resume analyses</p>
          </div>

          {history.length > 0 && (
            <div className="flex items-center gap-2">
              {confirmClear ? (
                <>
                  <span className="text-xs text-gray-400">Are you sure?</span>
                  <button onClick={handleClearAll}
                    className="text-xs text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition">
                    Yes, clear all
                  </button>
                  <button onClick={() => setConfirmClear(false)}
                    className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg transition hover:bg-gray-50">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmClear(true)}
                  className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {loading && <Spinner text="Loading history..." />}

        {!loading && history.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm text-gray-400">No analyses yet</p>
            <button onClick={() => navigate("/")}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700">
              Upload a resume to get started →
            </button>
          </div>
        )}

        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="card">

              {/* Top row — name + delete */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-3">

                  {/* Editable name */}
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleRename(item.id)}
                        maxLength={50}
                        className="text-sm border border-blue-300 rounded-lg px-3 py-1 focus:outline-none flex-1"
                        autoFocus
                      />
                      <button onClick={() => handleRename(item.id)}
                        className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition">
                        Save
                      </button>
                      <button onClick={() => { setEditingId(null); setEditName("") }}
                        className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg transition hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.name}
                      </p>
                      <button
                        onClick={() => { setEditingId(item.id); setEditName(item.name) }}
                        className="text-gray-300 hover:text-blue-400 transition text-xs shrink-0"
                        title="Rename"
                      >
                        ✏️
                      </button>
                    </div>
                  )}

                  {/* File + date */}
                  <p className="text-xs text-gray-400 mt-0.5">{item.filename}</p>

                  {/* Job role badge */}
                  {item.job_role && (
                    <span className="inline-block mt-1 text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full">
                      {item.job_role}
                    </span>
                  )}

                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(item.analysis_time).toLocaleString()}
                  </p>
                </div>

                {/* Score + delete */}
                <div className="flex items-start gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`text-xl font-semibold ${scoreColor(item.similarity_score)}`}>
                      {item.similarity_score}%
                    </p>
                    <p className="text-xs text-gray-400">match</p>
                  </div>
                  <button
                    onClick={() => handleDeleteOne(item.id)}
                    className="text-gray-300 hover:text-red-400 transition text-lg leading-none mt-1"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Score bars */}
              <div className="space-y-2 mb-3">
                {[
                  { label: "Match score", value: item.similarity_score, color: "bg-blue-500"   },
                  { label: "ATS score",   value: item.ats_score,        color: "bg-purple-500" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-gray-400 mb-0.5">
                      <span>{label}</span><span>{value}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${color}`}
                        style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex gap-4 pt-3 border-t border-gray-50 text-xs text-gray-400 mb-3">
                <span>⚡ {item.skill_count} skills</span>
                <span>❌ {item.missing_count} gaps</span>
                <span>🏷 {item.ats_label}</span>
              </div>

              {/* Rematch section */}
              {rematchId === item.id ? (
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs text-gray-400 mb-2">
                    Paste a new job description to rematch against this resume
                  </p>
                  <textarea
                    value={rematchJD}
                    onChange={e => setRematchJD(e.target.value)}
                    rows={4}
                    placeholder="Paste job description here..."
                    className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:border-blue-300"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleRematch(item)}
                      disabled={rematchLoading || !rematchJD.trim()}
                      className="flex-1 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 py-2 rounded-xl transition"
                    >
                      {rematchLoading
                        ? <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                            Analysing...
                          </span>
                        : "Run match →"
                      }
                    </button>
                    <button
                      onClick={() => { setRematchId(null); setRematchJD("") }}
                      className="text-sm text-gray-500 border border-gray-200 px-4 py-2 rounded-xl transition hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setRematchId(item.id)
                    setRematchJD(item.job_description || "")
                  }}
                  className="w-full text-xs text-blue-600 hover:text-blue-700 border border-blue-100 hover:border-blue-200 hover:bg-blue-50 py-2 rounded-xl transition"
                >
                  🔄 Match again with new job description
                </button>
              )}

            </div>
          ))}
        </div>
      </div>
    </div>
  )
}